import fs from 'fs';

const content = fs.readFileSync('scratch/ui_text_clean.md', 'utf8');
const lines = content.split('\n');
const result = {};
let count = 1;

lines.forEach(line => {
  if (line.startsWith('| ') && !line.includes('| STT |') && !line.includes('|---|')) {
    const parts = line.split('|');
    if (parts.length >= 3) {
      let text = parts[2].trim();
      text = text.replace(/\\\|/g, '|');
      if (text) {
        result[`text_${count}`] = text;
        count++;
      }
    }
  }
});

fs.writeFileSync('scratch/translation_strings.json', JSON.stringify(result, null, 2));
console.log('JSON generated');
