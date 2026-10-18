import { EventEmitter } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { SerialPort, ReadlineParser } from 'serialport';
import { assertDispensablePlan } from './plans';
import { prisma } from '../db/prisma';
import type { VendingPlan } from '../../../../packages/shared/src/types/Vending';

let port: SerialPort | undefined;
let opening: Promise<void> | undefined;
const messages = new EventEmitter();
let deviceError: string | null = null;

function command(text: string, expected: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); messages.off('line', receive); messages.off('failure', fail); };
    const fail = (error: Error) => { cleanup(); reject(error); };
    const receive = (line: string) => {
      if (line.startsWith('ERROR|')) return fail(new Error(line.slice(6).replaceAll('_', ' ')));
      if (line === expected) { cleanup(); resolve(); }
    };
    const timeout = setTimeout(() => fail(new Error('The Arduino did not acknowledge the display command.')), 7000);
    messages.on('line', receive);
    messages.on('failure', fail);
    port?.write(`${text}\n`, (error) => { if (error) fail(error); });
  });
}
async function connect(): Promise<void> {
  if (opening) return opening;
  if (port?.isOpen && !deviceError) return;
  opening = (async () => {
    const devices = await SerialPort.list();
    const path = process.env.DISPENSER_PORT || devices.find((device) =>
      ['2341', '2a03'].includes(device.vendorId?.toLowerCase() ?? '') ||
      (device.vendorId?.toLowerCase() === '8087' && device.productId?.toLowerCase() === '0ab6') ||
      /arduino/i.test(device.manufacturer ?? ''))?.path;
    if (!path) throw new Error('NO_DEVICE');
    if (port?.isOpen) await new Promise<void>((resolve) => port!.close(() => resolve()));
    const serialPath = path.replace(/^\/dev\/tty\./, '/dev/cu.');
    port = new SerialPort({ path: serialPath, baudRate: 9600, autoOpen: false });
    port.on('error', (error) => { deviceError = error.message; messages.emit('failure', error); });
    port.on('close', () => { deviceError = 'Arduino disconnected.'; messages.emit('failure', new Error(deviceError)); });
    port.pipe(new ReadlineParser({ delimiter: '\n' })).on('data', (line: string) => messages.emit('line', line.trim()));
    await new Promise<void>((resolve, reject) => port!.open((error) => error ? reject(error) : resolve()));
    deviceError = null;
    await delay(2200); // Uno resets when its USB serial port opens.
    await command('PING', 'READY|LCD');
  })();
  try { await opening; } catch (error) {
    deviceError = error instanceof Error ? error.message : 'Could not connect to the Arduino.';
    throw error;
  } finally { opening = undefined; }
}
export async function hardwareStatus() {
  if (process.env.DISPENSER_MODE === 'software') {
    return { mode: 'software', connected: false, label: 'Station ready' };
  }
  try {
    await connect();
    return { mode: 'arduino', connected: true, label: 'Arduino LCD connected', port: port?.path };
  } catch (error) {
    if (error instanceof Error && error.message === 'NO_DEVICE' && process.env.DISPENSER_REQUIRE_HARDWARE !== 'true') {
      return { mode: 'software', connected: false, label: 'Station ready' };
    }
    const detail = deviceError ?? '';
    const label = /LCD MISSING/i.test(detail) ? 'LCD not detected · check the I²C connection'
      : /busy|lock/i.test(detail) ? 'Arduino busy · close Serial Monitor and retry'
      : /acknowledge/i.test(detail) ? 'Arduino not responding · check USB and retry'
      : 'Arduino unavailable · check the USB and LCD connections';
    return { mode: 'unavailable', connected: false, label };
  }
}
const queue: string[] = [];
let processing = false;
export function enqueueOrder(id: string) {
  queue.push(id);
  void drain();
}
async function drain() {
  if (processing) return;
  processing = true;
  try {
    while (queue.length) {
      const id = queue.shift()!;
      try {
        const order = await prisma.vendingOrder.findUniqueOrThrow({ where: { id } });
        if (order.status !== 'queued') continue;
        const plan = order.plan as VendingPlan;
        assertDispensablePlan(plan);
        const hardware = await hardwareStatus();
        if (hardware.mode === 'unavailable') throw new Error(hardware.label);
        await prisma.vendingOrder.update({ where: { id }, data: { status: 'dispensing', deviceMode: hardware.mode } });
        if (hardware.mode === 'arduino') await command(`START|${plan.items.length}|${plan.totalDoses}`, 'ACK|START');
        for (let index = 0; index < plan.items.length; index++) {
          const item = plan.items[index]!;
          const name = item.name.normalize('NFKD').replace(/[^a-zA-Z0-9 .-]/g, '').slice(0, 32);
          if (hardware.mode === 'arduino') await command(`STEP|${index + 1}|${plan.items.length}|${item.doses}|${name}`, `ACK|STEP|${index + 1}`);
          else await delay(1100);
          await prisma.vendingOrder.update({ where: { id }, data: { progress: index + 1 } });
        }
        if (hardware.mode === 'arduino') await command(`END|${plan.totalDoses}`, 'ACK|END');
        await prisma.vendingOrder.update({ where: { id }, data: { status: 'completed', completedAt: new Date() } });
      } catch (error) {
        await prisma.vendingOrder.update({ where: { id }, data: { status: 'failed', error: error instanceof Error ? error.message : 'Dispensing failed.' } }).catch(() => {});
      }
    }
  } finally { processing = false; }
}
// A restart must never silently repeat an earlier dispense.
export async function recoverInterruptedOrders() {
  await prisma.vendingOrder.updateMany({ where: { status: { in: ['queued', 'dispensing'] } },
    data: { status: 'failed', error: 'The vending service restarted. Please review and create a new order.' } });
}
