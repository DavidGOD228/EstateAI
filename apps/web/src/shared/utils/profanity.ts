/**
 * Client-side mirror of apps/api/src/common/profanity.ts so users get an
 * inline violation message before the API rejects the request with 400.
 * Keep the two word lists in sync.
 */
/** Unambiguous as a word prefix: any continuation is still profane ("shitty", "fucking", "bitchville"). */
const STRONG_PREFIXES = [
  'asshole',
  'bullshit',
  'cocksucker',
  'cunt',
  'dickhead',
  'douche',
  'dumbass',
  'faggot',
  'fuck',
  'jackass',
  'jerkoff',
  'motherfucker',
  'nigga',
  'nigger',
  'shit',
  'slut',
  'twat',
  'wank',
  'whore',
  'bitch',
];

/** Ambiguous prefixes ("cocktail", "Dickens", "assist") — matched only as whole words with common suffixes. */
const STRICT_WORDS = ['arse', 'ass', 'bastard', 'bollocks', 'cock', 'dick', 'fag', 'piss', 'prick', 'pussy', 'retard'];

const LEET_MAP: Record<string, string> = {
  '@': 'a',
  $: 's',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '!': 'i',
};

const STRONG_PATTERN = new RegExp(`\\b(?:${STRONG_PREFIXES.join('|')})\\w*`, 'i');
const STRICT_PATTERN = new RegExp(`\\b(?:${STRICT_WORDS.join('|')})(?:s|es|ed|er|ers|ing)?\\b`, 'i');
/** Symbol-masked variants of the most common words, e.g. "f*ck", "f@ck", "sh#t". */
const MASKED_PATTERN = /\b(?:f[^\w\s]+u?ck|sh[^\w\s]+t|b[^\w\s]+tch|c[^\w\s]+nt|d[^\w\s]+ck)\w*/i;

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  const deobfuscated = lower.replace(/[@$013457!]/g, (char) => LEET_MAP[char] ?? char);
  for (const candidate of [lower, deobfuscated]) {
    if (STRONG_PATTERN.test(candidate) || STRICT_PATTERN.test(candidate)) return true;
  }
  return MASKED_PATTERN.test(lower);
}

export const PROFANITY_VIOLATION_MESSAGE = 'Please remove inappropriate language.';
