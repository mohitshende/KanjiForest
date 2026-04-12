const fs = require('fs');
const xml2js = require('xml2js');

async function main() {
  console.log('Reading KANJIDIC2 XML...');
  const xml = fs.readFileSync(__dirname + '/kanjidic2.xml', 'utf8');

  console.log('Parsing XML...');
  const result = await new xml2js.Parser().parseStringPromise(xml);
  const characters = result.kanjidic2.character;
  console.log(`Total characters in KANJIDIC2: ${characters.length}`);

  // Load existing mnemonics to preserve
  const existingMnemonics = fs.existsSync(__dirname + '/existing_mnemonics.json')
    ? JSON.parse(fs.readFileSync(__dirname + '/existing_mnemonics.json', 'utf8'))
    : {};

  const kanjiList = [];

  for (const char of characters) {
    const literal = char.literal[0];
    const misc = char.misc?.[0] || {};

    const grade = misc.grade ? parseInt(misc.grade[0]) : null;
    const jlptOld = misc.jlpt ? parseInt(misc.jlpt[0]) : null;
    const strokeCount = misc.stroke_count ? parseInt(misc.stroke_count[0]) : 0;
    const freqRank = misc.freq ? parseInt(misc.freq[0]) : 9999;

    const rmGroup = char.reading_meaning?.[0]?.rmgroup?.[0];
    let onyomi = [], kunyomi = [], meanings = [];

    if (rmGroup) {
      if (rmGroup.reading) {
        for (const r of rmGroup.reading) {
          if (r.$.r_type === 'ja_on') onyomi.push(r._);
          if (r.$.r_type === 'ja_kun') kunyomi.push(r._);
        }
      }
      if (rmGroup.meaning) {
        for (const m of rmGroup.meaning) {
          if (typeof m === 'string') meanings.push(m);
          else if (!m.$ || !m.$.m_lang) meanings.push(m._);
        }
      }
    }

    if (meanings.length === 0) continue;
    if (!jlptOld) continue;

    let jlptLevel;
    if (jlptOld === 4) {
      jlptLevel = (grade && grade <= 2) || freqRank <= 200 ? 5 : 4;
    } else if (jlptOld === 3) {
      jlptLevel = 4;
    } else if (jlptOld === 2) {
      jlptLevel = freqRank <= 750 ? 3 : 2;
    } else {
      jlptLevel = 1;
    }

    kanjiList.push({
      character: literal,
      meaning: meanings.join(', '),
      onyomi: onyomi.join(', '),
      kunyomi: kunyomi.join(', '),
      stroke_count: strokeCount,
      jlpt_level: jlptLevel,
      joyo_grade: grade || 7,
      radical_ids: [],
      component_kanji_ids: [],
      stroke_path_data: '',
      mnemonic: existingMnemonics[literal] || '',
      frequency_rank: freqRank,
    });
  }

  kanjiList.sort((a, b) => {
    if (b.jlpt_level !== a.jlpt_level) return b.jlpt_level - a.jlpt_level;
    return a.frequency_rank - b.frequency_rank;
  });

  kanjiList.forEach((k, i) => { k.id = i + 1; });

  const counts = {};
  kanjiList.forEach(k => { counts[k.jlpt_level] = (counts[k.jlpt_level] || 0) + 1; });

  console.log('\nBy JLPT level:', JSON.stringify(counts));
  console.log('Total:', kanjiList.length);

  const withMnemonic = kanjiList.filter(k => k.mnemonic).length;
  console.log('With mnemonics:', withMnemonic);

  fs.writeFileSync(
    __dirname + '/../assets/data/kanji.json',
    JSON.stringify(kanjiList, null, 2)
  );
  console.log('Written to kanji.json');
}

main().catch(console.error);
