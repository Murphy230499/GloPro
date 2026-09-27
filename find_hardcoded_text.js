import fs from 'fs';
import path from 'path';

const SRC_DIR = 'src';
const VI_REGEX = /[\u00C0-\u1EF9]+/g;
const fileStats = [];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic stripping of single-line and multi-line comments
      let cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      // Remove text inside t('...')
      cleanContent = cleanContent.replace(/t\(['"][^'"]+['"]\)/g, '');
      
      const lines = cleanContent.split('\n');
      const hardcodedLines = [];
      
      lines.forEach((line, index) => {
        if (line.match(VI_REGEX)) {
          // Clean up line for reporting
          const trimmed = line.trim().replace(/\s+/g, ' ');
          if (trimmed.length > 2) {
             hardcodedLines.push({ line: index + 1, text: trimmed });
          }
        }
      });
      
      if (hardcodedLines.length > 0) {
        fileStats.push({
          file: fullPath,
          count: hardcodedLines.length,
          samples: hardcodedLines.slice(0, 3).map(h => h.text)
        });
      }
    }
  }
}

scanDir(SRC_DIR);

fileStats.sort((a, b) => b.count - a.count);

const totalFiles = fileStats.length;
const totalStrings = fileStats.reduce((sum, f) => sum + f.count, 0);

let markdown = `# Báo cáo Các chuỗi văn bản cứng (Hardcoded Text) trong mã nguồn\n\n`;
markdown += `Tìm thấy **${totalStrings}** dòng chứa văn bản tiếng Việt chưa được dịch trong **${totalFiles}** file.\n\n`;
markdown += `| File | Số lượng dòng | Ví dụ (3 dòng đầu) |\n`;
markdown += `|------|---------------|--------------------|\n`;

fileStats.slice(0, 50).forEach(stat => {
  markdown += `| \`${stat.file}\` | ${stat.count} | <ul>${stat.samples.map(s => `<li><code>${s.substring(0, 50).replace(/\|/g, '\\|')}...</code></li>`).join('')}</ul> |\n`;
});

if (fileStats.length > 50) {
  markdown += `\n*...và ${fileStats.length - 50} file khác.*\n`;
}

fs.writeFileSync('scratch/hardcoded_report.md', markdown);
console.log('Report generated at scratch/hardcoded_report.md');
