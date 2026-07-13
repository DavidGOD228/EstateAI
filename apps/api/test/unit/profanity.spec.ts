import { containsProfanity } from '../../src/common/profanity';

describe('containsProfanity', () => {
  it('flags plain profanity regardless of case and position', () => {
    expect(containsProfanity('this flat is shit')).toBe(true);
    expect(containsProfanity('FUCKING great view')).toBe(true);
    expect(containsProfanity('what a Bitch of a commute')).toBe(true);
  });

  it('flags simple leetspeak obfuscation', () => {
    expect(containsProfanity('this flat is sh1t')).toBe(true);
    expect(containsProfanity('f@ck this listing')).toBe(true);
  });

  it('does not flag clean real-estate text or embedded substrings', () => {
    expect(containsProfanity('bright renovated apartment near a park')).toBe(false);
    expect(containsProfanity('Scunthorpe town centre')).toBe(false);
    expect(containsProfanity('grass lawn and classic interior')).toBe(false);
    expect(containsProfanity('cocktail bar nearby')).toBe(false);
  });
});
