import { describe, it, expect } from 'vitest';
import { calculatePrediction, Cycle } from '../lib/prediction';
import { addDays, formatISO } from 'date-fns';

const createISODate = (baseDate: Date, daysToAdd: number) => 
  formatISO(addDays(baseDate, daysToAdd), { representation: 'date' });

describe('calculatePrediction', () => {
  const baseDate = new Date('2024-01-01');

  it('calculates regular 28-day cycles correctly', () => {
    const cycles: Cycle[] = [
      { start_date: createISODate(baseDate, 0), end_date: createISODate(baseDate, 4) },
      { start_date: createISODate(baseDate, 28), end_date: createISODate(baseDate, 32) },
      { start_date: createISODate(baseDate, 56), end_date: createISODate(baseDate, 60) },
    ];

    const result = calculatePrediction(cycles);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.avg_cycle_length).toBe(28);
      expect(result.avg_period_duration).toBe(5);
      expect(result.confidence_score).toBeGreaterThan(0.9);
      expect(result.irregular_flag).toBe(false);
      expect(result.predicted_start).toBe(createISODate(baseDate, 84));
    }
  });

  it('detects irregular cycles', () => {
    const cycles: Cycle[] = [
      { start_date: createISODate(baseDate, 0), end_date: createISODate(baseDate, 4) },
      { start_date: createISODate(baseDate, 20), end_date: createISODate(baseDate, 25) },
      { start_date: createISODate(baseDate, 60), end_date: createISODate(baseDate, 64) },
      { start_date: createISODate(baseDate, 90), end_date: createISODate(baseDate, 95) },
    ];

    const result = calculatePrediction(cycles);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.irregular_flag).toBe(true);
      expect(result.confidence_score).toBeLessThan(0.9);
      expect(result.insights).toContain("Your cycles appear irregular.");
    }
  });

  it('returns null for insufficient data', () => {
    const cycles: Cycle[] = [
      { start_date: createISODate(baseDate, 0), end_date: createISODate(baseDate, 4) },
    ];

    const result = calculatePrediction(cycles);
    expect(result).toBeNull();
  });

  it('handles long cycle gaps scenario', () => {
    const cycles: Cycle[] = [
      { start_date: createISODate(baseDate, 0), end_date: createISODate(baseDate, 4) },
      { start_date: createISODate(baseDate, 100), end_date: createISODate(baseDate, 104) }, // Gap of 100 days
    ];

    const result = calculatePrediction(cycles);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.insights).toContain("Noticeable gaps between cycles detected in history.");
    }
  });

  it('calculates fertility window correctly', () => {
     const cycles: Cycle[] = [
      { start_date: createISODate(baseDate, 0), end_date: createISODate(baseDate, 4) },
      { start_date: createISODate(baseDate, 28), end_date: createISODate(baseDate, 32) },
    ];

    const result = calculatePrediction(cycles);
    expect(result).not.toBeNull();
    if (result) {
      const expectedPredictedStart = new Date(result.predicted_start);
      // Ovulation is 14 days before next period start
      const expectedOvulation = addDays(expectedPredictedStart, -14);
      expect(result.ovulation_day).toBe(formatISO(expectedOvulation, { representation: 'date' }));
      
      const expectedFertileStart = addDays(expectedOvulation, -5);
      expect(result.fertile_start).toBe(formatISO(expectedFertileStart, { representation: 'date' }));

      const expectedFertileEnd = addDays(expectedOvulation, 1);
      expect(result.fertile_end).toBe(formatISO(expectedFertileEnd, { representation: 'date' }));
    }
  });
});
