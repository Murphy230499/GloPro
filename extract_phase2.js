import fs from 'fs';

const files = ['src/views/Appointments.jsx', 'src/views/Customers.jsx'];
const vietnameseRegex = /[\u00C0-\u1EF9]+/g;
let allResults = [];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.match(vietnameseRegex)) {
        allResults.push(`${file} - ${i + 1}: ${line.trim()}`);
      }
    });
  }
});

fs.writeFileSync('scratch/vi_strings_phase2.txt', allResults.join('\n'));
