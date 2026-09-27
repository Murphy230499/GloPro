import fs from 'fs';

const content = fs.readFileSync('src/views/Settings.jsx', 'utf8');
const vietnameseRegex = /[\u00C0-\u1EF9]+/g;
const lines = content.split('\n');

const results = [];
lines.forEach((line, i) => {
  if (line.match(vietnameseRegex)) {
    results.push(`${i + 1}: ${line.trim()}`);
  }
});

fs.writeFileSync('scratch/vi_strings_settings.txt', results.join('\n'));
