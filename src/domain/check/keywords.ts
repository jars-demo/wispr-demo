// Turns sentences and code into comparable keyword sets: lowercase, split camelCase and
// snake_case, drop filler words, and strip common endings so "limiting" meets "limit".

const STOP = new Set(
  `a an the and or but if then so to of in on at by for with from into onto per via as is are be
  been being was were it its this that these those there here we you i me my our your they them
  add adds added adding make makes made making ensure ensures should must need needs want wants
  please also just only some any all each every new use uses using do does did done not no don
  dont doesnt didnt never avoid leave alone keep touch change changes changed unchanged can will
  would could when after before up out over under about like maybe might perhaps sure think`
    .split(/\s+/)
    .filter(Boolean),
)

export function stem(word: string): string {
  let w = word
  for (const suffix of ['ations', 'ation', 'ings', 'ing', 'ies', 'ers', 'er', 'ed', 'es', 's']) {
    if (w.length > suffix.length + 2 && w.endsWith(suffix)) {
      w = w.slice(0, -suffix.length)
      break
    }
  }
  return w
}

export function words(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 3 && !STOP.has(w))
    .map(stem)
}

export function keywordSet(text: string): Set<string> {
  return new Set(words(text))
}

export function mentionsTests(text: string): boolean {
  return /\b(tests?|testing|spec|specs|coverage|unit test|e2e)\b/i.test(text)
}
