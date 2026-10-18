import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChatServiceError, generateMedicalReply, mentionsEmergency } from '../src/services/medicalChat';

const input = {
  message: 'What should I ask my pharmacist?', history: [{ role: 'user' as const, text: 'Hello' }],
  context: { profile: { weightKg: 70, heightCm: 175, allergies: ['penicillin'], healthConditions: [{ name: 'Example', notes: null }] }, schedules: [] },
  appMedications: [{ date: '2026-10-17', name: 'Local demo entry', dosage: 'Unverified', time: '08:00', status: 'upcoming' as const }],
};

test('recognizes clear emergency phrases and leaves routine questions for the model', () => {
  for (const message of ['I have chest pain', 'I can’t breathe', "I can't breathe", 'I took an overdose',
    'severe allergic reaction', 'Someone is unconscious', 'I want to kill myself', 'I am having a seizure']) {
    assert.equal(mentionsEmergency(message), true, message);
  }
  assert.equal(mentionsEmergency('What should I ask my pharmacist about my routine?'), false);
});

test('sends the API key only in a header and separates safety instructions from untrusted data', async () => {
  let calls = 0;
  const reply = await generateMedicalReply(input, { apiKey: 'test-only-key', model: 'gemini-flash-latest',
    fetcher: async (url, options) => {
      calls++;
      assert.equal(String(url), 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
      assert.equal(new Headers(options?.headers).get('X-goog-api-key'), 'test-only-key');
      const body = JSON.parse(options?.body as string);
      assert.match(body.systemInstruction.parts[0].text, /IntelliMed/);
      assert.match(body.systemInstruction.parts[0].text, /plain text only/);
      assert.match(body.systemInstruction.parts[0].text, /untrusted data/);
      const context = JSON.parse(body.contents[0].parts[0].text);
      assert.deepEqual(context.savedHealthContext, input.context);
      assert.deepEqual(context.unverifiedLocalAppEntriesMayIncludeDemoData, input.appMedications);
      assert.equal(JSON.stringify(body).includes('test-only-key'), false);
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [
        { text: 'Private model reasoning', thought: true }, { text: 'Ask your pharmacist to review your routine.' },
      ] } }] });
    },
  });
  assert.equal(calls, 1);
  assert.equal(reply, 'Ask your pharmacist to review your routine.');
});

test('returns plain text even when the model adds Markdown, preserving numbers and symbols', async () => {
  const reply = await generateMedicalReply(input, { apiKey: 'test', fetcher: async () => Response.json({
    candidates: [{ finishReason: 'STOP', content: { parts: [{ text:
      '## **Your routine**\n\nUse **plain words**, *short sentences*, and `simple terms`.\n\n- Keep 5 * 2, Hb_A1c, and 0.5 mg unchanged.\n[Source](https://example.com/info)',
    }] } }],
  }) });
  assert.equal(reply, 'Your routine\n\nUse plain words, short sentences, and simple terms.\n\nKeep 5 * 2, Hb_A1c, and 0.5 mg unchanged.\nSource (https://example.com/info)');
});

test('fails closed for missing keys, unsafe model names, provider errors, blocked and incomplete output', async () => {
  const neverFetch: typeof fetch = async () => { throw new Error('Should not fetch'); };
  await assert.rejects(generateMedicalReply(input, { apiKey: '', fetcher: neverFetch }),
    (error: unknown) => error instanceof ChatServiceError && error.status === 503);
  await assert.rejects(generateMedicalReply(input, { apiKey: 'test', model: '../other', fetcher: neverFetch }),
    (error: unknown) => error instanceof ChatServiceError && error.status === 503);
  for (const result of [
    { promptFeedback: { blockReason: 'SAFETY' } },
    { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: 'Incomplete advice' }] } }] },
    { candidates: [{ finishReason: 'SAFETY' }] },
    { candidates: [{ finishReason: 'STOP', content: { parts: [] } }] },
  ]) {
    await assert.rejects(generateMedicalReply(input, { apiKey: 'test', fetcher: async () => Response.json(result) }), ChatServiceError);
  }
  await assert.rejects(generateMedicalReply(input, { apiKey: 'test', fetcher: async () => new Response('Private provider details', { status: 429 }) }),
    (error: unknown) => error instanceof ChatServiceError && error.status === 429 && !error.message.includes('Private'));
  await assert.rejects(generateMedicalReply(input, { apiKey: 'test', fetcher: async () => { throw new Error('Secret internal error'); } }),
    (error: unknown) => error instanceof ChatServiceError && !error.message.includes('Secret'));
});

test('retries temporary overload and returns a successful reply', async () => {
  let calls = 0;
  const waits: number[] = [];
  const reply = await generateMedicalReply(input, { apiKey: 'test',
    wait: async (milliseconds) => { waits.push(milliseconds); },
    fetcher: async () => {
      calls++;
      if (calls < 3) return new Response('Temporarily overloaded', { status: 503 });
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'Recovered.' }] } }] });
    },
  });
  assert.equal(reply, 'Recovered.');
  assert.equal(calls, 3);
  assert.equal(waits.length, 2);
  assert.ok(waits[0]! >= 1000 && waits[0]! < 1200);
  assert.ok(waits[1]! >= 2000 && waits[1]! < 2200);
});

test('stops retrying after three attempts and reports overload distinctly', async () => {
  let calls = 0;
  await assert.rejects(generateMedicalReply(input, { apiKey: 'test', wait: async () => {},
    fetcher: async () => { calls++; return new Response('Private provider response', { status: 503 }); },
  }), (error: unknown) => error instanceof ChatServiceError && error.status === 503 && /busy/.test(error.message) && !error.message.includes('Private'));
  assert.equal(calls, 3);
});

test('does not retry API key or model configuration failures', async () => {
  let calls = 0;
  await assert.rejects(generateMedicalReply(input, { apiKey: 'test',
    fetcher: async () => { calls++; return new Response('Private key details', { status: 403 }); },
  }), (error: unknown) => error instanceof ChatServiceError && /configuration/.test(error.message) && !error.message.includes('Private'));
  assert.equal(calls, 1);
});
