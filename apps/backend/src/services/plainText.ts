export function toPlainText(text: string): string {
  return text
    .replace(/^\s{0,3}(?:`{3,}|~{3,})[^\n]*$/gm, '')
    .replace(/!\[([^\]]*)\]\([^\n)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)')
    .replace(/(\*\*|__|~~)(?=\S)([\s\S]*?\S)\1/g, '$2')
    .replace(/(^|[\s(])([*_])(?=\S)([^*_\n]*?\S)\2(?=$|[\s.,!?;:)])/gm, '$1$3')
    .replace(/`+([^`\n]+)`+/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?$/gm, '$1')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
