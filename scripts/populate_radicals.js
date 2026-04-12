#!/usr/bin/env node
/**
 * Populates radical_ids in kanji.json using classical Kangxi radical numbers from kanjidic2.xml
 */

const fs = require('fs');
const path = require('path');

const xmlPath = path.join(__dirname, 'kanjidic2.xml');
const kanjiPath = path.join(__dirname, '..', 'assets', 'data', 'kanji.json');

console.log('Reading kanjidic2.xml...');
const xml = fs.readFileSync(xmlPath, 'utf8');

// Build map: kanji character → classical radical ID
const radicalMap = new Map();
const charRegex = /<character>([\s\S]*?)<\/character>/g;
let match;
while ((match = charRegex.exec(xml)) !== null) {
  const block = match[1];
  const litMatch = block.match(/<literal>(.+?)<\/literal>/);
  const radMatch = block.match(/<rad_value rad_type="classical">(\d+)<\/rad_value>/);
  if (litMatch && radMatch) {
    radicalMap.set(litMatch[1], parseInt(radMatch[1]));
  }
}
console.log(`Mapped ${radicalMap.size} kanji to radicals`);

// Update kanji.json
const kanjiData = JSON.parse(fs.readFileSync(kanjiPath, 'utf8'));
let updated = 0;
for (const kanji of kanjiData) {
  const radId = radicalMap.get(kanji.character);
  if (radId !== undefined) {
    kanji.radical_ids = [radId];
    updated++;
  }
}
console.log(`Updated ${updated} / ${kanjiData.length} kanji with radical_ids`);

fs.writeFileSync(kanjiPath, JSON.stringify(kanjiData, null, 2));
console.log('Done — kanji.json updated');
