import raw from './states.json';

export type StateRow = {
  name: string;
  /** BEA regional price parity as published, one decimal. Drives rank and ties. */
  rpp: number;
  /** BEA's unrounded index (three decimals, via FRED). Drives dollars when present. Rounds to `rpp`. */
  rppExact?: number;
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
  // Dollars use the unrounded index where we have it; rank and ties stay on the published one-decimal `rpp`.
  const dollars = worth(s.rppExact ?? s.rpp);
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

/**
 * Two adjacent ranks closer than this many BEA index points are a near-tie, not a winner and a runner-up. The index is
 * published to one decimal and is an estimate, so a 0.1-point lead is inside its own margin of error.
 */
export const NEAR_TIE_RPP = 0.5;

/**
 * If `name` leads the next-ranked state by no more than NEAR_TIE_RPP, returns that runner-up and the gap between them.
 * Used to frame #1 as the top of a tier ("ranked by index") instead of an outright winner.
 */
export const nearTieOf = (name: string): {name: string; rppGap: number; dollarGap: number} | null => {
  const s = byName(name);
  const next = STATES.find((x) => x.rpp > s.rpp);
  if (!next || next.rpp - s.rpp > NEAR_TIE_RPP) return null;
  return {name: next.name, rppGap: next.rpp - s.rpp, dollarGap: s.dollars - next.dollars};
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
