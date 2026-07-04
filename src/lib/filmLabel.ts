const STOCKS: [RegExp, string][] = [
  [/^ektar\s*100/i,       'Kodak Ektar 100'],
  [/^gold\s*200/i,        'Kodak Gold 200'],
  [/^gold\s*100/i,        'Kodak Gold 100'],
  [/^portra\s*800/i,      'Kodak Portra 800'],
  [/^portra\s*400/i,      'Kodak Portra 400'],
  [/^portra\s*160/i,      'Kodak Portra 160'],
  [/^ultramax\s*400/i,    'Kodak UltraMax 400'],
  [/^colorplus\s*200/i,   'Kodak ColorPlus 200'],
  [/^hp5/i,               'Ilford HP5 Plus'],
  [/^fp4/i,               'Ilford FP4 Plus'],
  [/^delta\s*3200/i,      'Ilford Delta 3200'],
  [/^delta\s*400/i,       'Ilford Delta 400'],
  [/^delta\s*100/i,       'Ilford Delta 100'],
  [/^superia\s*x-tra/i,   'Fuji Superia X-TRA'],
  [/^superia/i,           'Fuji Superia'],
  [/^velvia\s*50/i,       'Fuji Velvia 50'],
  [/^velvia\s*100/i,      'Fuji Velvia 100'],
  [/^provia/i,            'Fuji Provia 100F'],
  [/^pro400h/i,           'Fuji Pro 400H'],
  [/^cinestill\s*800/i,   'CineStill 800T'],
  [/^cinestill\s*50/i,    'CineStill 50D'],
  [/^lomo\s*800/i,        'Lomography 800'],
  [/^lomo\s*400/i,        'Lomography 400'],
  [/^lomo\s*100/i,        'Lomography 100'],
  [/^redscale/i,          'Lomography Redscale'],
];

export function filmLabel(key: string): string {
  const filename = (key.split('/').pop() ?? key).replace(/(\.\w+)+$/, '');
  const parts = filename.split('_');

  // Try each segment against known stocks
  for (const part of parts) {
    for (const [re, label] of STOCKS) {
      if (re.test(part)) return label;
    }
  }

  // Fallback: use the first segment that contains digits (skips plain-word prefixes like "home")
  const filmPart = parts.find((p) => /\d/.test(p)) ?? parts[0];
  return filmPart.replace(/([A-Za-z])(\d{2,})/, '$1 $2');
}
