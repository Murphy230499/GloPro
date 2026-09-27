const fs = require('fs');

async function translateChunk(texts, tl, sl = 'en') {
  const separator = " ⸻ ";
  const text = texts.join(separator);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  
  try {
    const res = await fetch(url);
    const json = await res.json();
    let translated = json[0].map(x => x[0]).join('');
    let results = translated.split(/⸻|——|--|—/g).map(s => s.trim());
    
    if (results.length !== texts.length) {
      console.warn(`Chunk mismatch for ${tl}! Expected ${texts.length}, got ${results.length}. Translating one by one...`);
      results = [];
      for (const t of texts) {
        if (!t.trim()) { results.push(""); continue; }
        const singleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(t)}`;
        const sr = await fetch(singleUrl);
        const sj = await sr.json();
        results.push(sj[0].map(x => x[0]).join('').trim());
        await new Promise(r => setTimeout(r, 100));
      }
    }
    return results.map(s => s.replace(/\{\s*(.*?)\s*\}/g, '{$1}'));
  } catch(e) {
    console.error("Error translating chunk:", e);
    return texts;
  }
}

async function run() {
  const content = fs.readFileSync('/Volumes/Coding/GloPro/src/lib/i18n.jsx', 'utf8');

  function extractDict(str) {
    const dict = {};
    const r = /'([^']+)'\s*:\s*(['\"\`])([\s\S]*?)\2\s*(?:,|$)/g;
    let mm;
    while ((mm = r.exec(str)) !== null) {
      dict[mm[1]] = mm[3].replace(/\\\\/g, '\\\\').replace(/\\'/g, "'");
    }
    return dict;
  }

  const langs = ['vi', 'en', 'zh', 'ko', 'ja'];
  const dicts = {};

  let remaining = content;
  langs.forEach(l => {
    const startIdx = remaining.indexOf(l + ': {');
    if (startIdx === -1) return;
    const str = remaining.substring(startIdx);
    let endIdx = str.length;
    langs.forEach(nextL => {
      if (nextL !== l) {
        const nextIdx = str.indexOf('\n  ' + nextL + ': {');
        if (nextIdx !== -1 && nextIdx < endIdx) endIdx = nextIdx;
      }
    });
    // Check for end of JS object if it's the last lang (ja)
    if (l === 'ja') {
      const nextIdx = str.indexOf('\n};\n');
      if (nextIdx !== -1 && nextIdx < endIdx) endIdx = nextIdx;
    }
    const lStr = str.substring(0, endIdx);
    dicts[l] = extractDict(lStr);
  });

  const allKeys = new Set();
  langs.forEach(l => Object.keys(dicts[l]).forEach(k => allKeys.add(k)));

  const missingReport = {};
  langs.forEach(l => {
    missingReport[l] = [];
    allKeys.forEach(k => {
      if (!(k in dicts[l])) {
        missingReport[l].push(k);
      }
    });
  });

  async function translateMissing(missingArr, tl) {
    const results = {};
    const batchSize = 10;
    for (let i = 0; i < missingArr.length; i += batchSize) {
      const batch = missingArr.slice(i, i + batchSize);
      // Fallback source language resolution
      // If we are missing in VI, we'll translate from EN (if available) or ZH
      const sourceLang = tl === 'vi' ? 'en' : 'vi';
      const texts = batch.map(k => dicts[sourceLang][k] || dicts['zh'][k] || '');
      
      console.log(`Translating ${tl} batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingArr.length / batchSize)}...`);
      const trans = await translateChunk(texts, tl, 'auto');
      for (let j = 0; j < batch.length; j++) {
        results[batch[j]] = trans[j] || batch[j];
      }
      await new Promise(r => setTimeout(r, 200));
    }
    return results;
  }

  const newStr = { vi: '', en: '', zh: '', ko: '', ja: '' };

  for (const tl of langs) {
    if (missingReport[tl].length > 0) {
      console.log(`Missing keys for ${tl}: ${missingReport[tl].length}`);
      const trans = await translateMissing(missingReport[tl], tl);
      for (const k of missingReport[tl]) {
        let safeVal = (trans[k] || '').replace(/'/g, "\\'").replace(/\n/g, "\\n");
        newStr[tl] += `\n    '${k}': '${safeVal}',`;
      }
    }
  }

  let updatedContent = content;
  
  if (newStr.vi) updatedContent = updatedContent.replace(/(vi:\s*\{[\s\S]*?)(  \},\n\s*en:)/, `$1${newStr.vi}\n$2`);
  if (newStr.en) updatedContent = updatedContent.replace(/(en:\s*\{[\s\S]*?)(  \},\n\s*zh:)/, `$1${newStr.en}\n$2`);
  if (newStr.zh) updatedContent = updatedContent.replace(/(zh:\s*\{[\s\S]*?)(  \},\n\s*ko:)/, `$1${newStr.zh}\n$2`);
  if (newStr.ko) updatedContent = updatedContent.replace(/(ko:\s*\{[\s\S]*?)(  \},\n\s*ja:)/, `$1${newStr.ko}\n$2`);
  if (newStr.ja) updatedContent = updatedContent.replace(/(ja:\s*\{[\s\S]*?)(  \},\n\};)/, `$1${newStr.ja}\n$2`);

  fs.writeFileSync('/Volumes/Coding/GloPro/src/lib/i18n.jsx', updatedContent, 'utf8');
  console.log('All missing dictionaries keys synced successfully!');
}

run();
