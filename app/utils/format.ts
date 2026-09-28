// 1 → "01", for the numbered lists and service counters.
export const twoDigits = (value: number) => String(value).padStart(2, '0');
