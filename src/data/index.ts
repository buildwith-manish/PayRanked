import raw from './states.json';

export type StateRow = {
  name: string;
  rpp: number;
  fact?: string;
  factSource?: string;
};

export type Computed = StateRow & {
  /** unrounded dollars an annual $100,000 is worth */
  dollars: number;
  /** nearest $100, for display */
  display: number;
  /** extra buying power over $100,000, unrounded */
  extra: number;
  /** 1-based rank, ties share a rank (competition ranking: 1,2,3,3,5...) */
  rank: number;
  noWageTax: boolean;
};

export const SALARY = 100000;

export const NO_WAGE_TAX = [
  'Alaska', 'Florida', 'Nevada', 'New Hampshire', 'South Dakota',
  'Tennessee', 'Texas', 'Washington', 'Wyoming',
];

export const roundTo100 = (n: number) => Math.round(n / 100) * 100;
export const worth = (rpp: number) => SALARY / (rpp / 100);

const rows = raw as StateRow[];

// Cheapest first: lower rpp = more buying power = better rank.
const sorted = [...rows].sort((a, b) => a.rpp - b.rpp);

export const STATES: Computed[] = sorted.map((s) => {
  const dollars = worth(s.rpp);
  return {
    ...s,
    dollars,
    display: roundTo100(dollars),
    extra: dollars - SALARY,
    rank: sorted.findIndex((x) => x.rpp === s.rpp) + 1,
    noWageTax: NO_WAGE_TAX.includes(s.name),
  };
});

export const byName = (name: string): Computed => {
  const s = STATES.find((x) => x.name === name);
  if (!s) throw new Error(`Unknown state: ${name}`);
  return s;
};

/** Countdown order as given in the brief: each entry is one reveal (ties hold two states). */
export const COUNTDOWN: {rank: number; label: string; names: string[]}[] = [
  {rank: 10, label: '#10', names: ['Kansas', 'Nebraska']},
  {rank: 9, label: '#9', names: ['West Virginia']},
  {rank: 8, label: '#8', names: ['North Dakota']},
  {rank: 7, label: '#7', names: ['Alabama']},
  {rank: 6, label: '#6', names: ['South Dakota']},
  {rank: 5, label: '#5', names: ['Louisiana']},
  {rank: 3, label: '#3', names: ['Iowa', 'Oklahoma']},
  {rank: 2, label: '#2', names: ['Mississippi']},
  {rank: 1, label: '#1', names: ['Arkansas']},
];

export const BOTTOM_FIVE = ['California', 'Hawaii', 'New Jersey', 'New York', 'Washington'];

/** The gap between two states, from unrounded values. */
export const gap = (cheap: string, pricey: string) => {
  const a = byName(cheap).dollars;
  const b = byName(pricey).dollars;
  return {amount: a - b, pct: (a / b - 1) * 100};
};

export const fmtUSD = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const fmtK = (n: number) => '$' + Math.round(n / 1000) + 'K';
