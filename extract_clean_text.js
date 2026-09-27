import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src';
const VI_REGEX = /[\u00C0-\u1EF9]+/;
const phrases = new Set();

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove comments
      let cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      // Remove t('...') to avoid re-extracting translated text
      cleanContent = cleanContent.replace(/t\(['"][^'"]+['"]\)/g, '');
      
      // 1. Extract text between JSX tags > text <
      const jsxMatches = cleanContent.matchAll(/>([^<]*[\u00C0-\u1EF9]+[^<]*)</g);
      for (const match of jsxMatches) {
        let text = match[1].trim();
        // Remove JSX curly braces if any
        text = text.replace(/\{[^}]+\}/g, '').trim();
        if (text && text.match(VI_REGEX)) {
           phrases.add(text.replace(/\s+/g, ' '));
        }
      }
      
      // 2. Extract text in single/double quotes
      const quoteMatches = cleanContent.matchAll(/['"]([^'"]*[\u00C0-\u1EF9]+[^'"]*)['"]/g);
      for (const match of quoteMatches) {
        const text = match[1].trim().replace(/\s+/g, ' ');
        if (text.length > 1) phrases.add(text);
      }
      
      // 3. Extract text in template literals
      const backtickMatches = cleanContent.matchAll(/`([^`]*[\u00C0-\u1EF9]+[^`]*)`/g);
      for (const match of backtickMatches) {
        let text = match[1].trim();
        text = text.replace(/\$\{[^}]+\}/g, '{var}').replace(/\s+/g, ' ');
        if (text.length > 1) phrases.add(text);
      }
    }
  }
}

scanDir(SRC_DIR);

const sortedPhrases = Array.from(phrases).sort();
const total = sortedPhrases.length;

let markdown = `# Danh sách các cụm từ UI chưa được dịch (Sạch)\n\n`;
markdown += `Tìm thấy **${total}** cụm từ duy nhất trên giao diện và thông báo (đã loại bỏ mã code).\n\n`;
markdown += `| STT | Cụm từ Tiếng Việt (UI Text) |\n`;
markdown += `|---|---|\n`;

sortedPhrases.forEach((phrase, i) => {
  // escape pipes for markdown tables
  markdown += `| ${i+1} | ${phrase.replace(/\|/g, '\\|')} |\n`;
});

fs.writeFileSync('scratch/ui_text_clean.md', markdown);
console.log('Clean report generated at scratch/ui_text_clean.md');
