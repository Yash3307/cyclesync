import { differenceInDays, addDays, parseISO, isValid, formatISO } from 'date-fns';

export interface Cycle {
  id?: string;
  start_date: string; // ISO string YYYY-MM-DD
  end_date: string | null;  // ISO string YYYY-MM-DD
  duration_days?: number | null;
  cycle_length?: number | null;
}

export interface PredictionResult {
  predicted_start: string;
  predicted_end: string;
  avg_cycle_length: number;
  avg_period_duration: number;
  confidence_score: number;
  irregular_flag: boolean;
  fertile_start: string;
  fertile_end: string;
  ovulation_day: string;
  insights: string[];
}

export function calculatePrediction(cycles: Cycle[]): PredictionResult | null {
  // Need at least 2 cycles to calculate cycle lengths, but we can return null if < 2 full cycles
  if (!cycles || cycles.length < 2) {
    return null;
  }

  // Sort cycles by start_date ascending (oldest first)
  const sortedCycles = [...cycles].sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );

  const cycleLengths: number[] = [];
  const periodDurations: number[] = [];
  let hasLongGaps = false;

  for (let i = 0; i < sortedCycles.length; i++) {
    const current = sortedCycles[i];
    
    // Calculate period duration if end date exists
    if (current.end_date) {
      const duration = differenceInDays(new Date(current.end_date), new Date(current.start_date)) + 1;
      if (duration > 0 && duration <= 15) { // Sanity check for period duration (usually 2-8 days)
        periodDurations.push(duration);
      }
    }

    // Calculate cycle length (start of current to start of next)
    if (i < sortedCycles.length - 1) {
      const next = sortedCycles[i + 1];
      const length = differenceInDays(new Date(next.start_date), new Date(current.start_date));
      
      // Sanity check cycle lengths (usually 21-35 days, allow up to 60 for irregular, but flag long gaps)
      if (length > 0) {
        cycleLengths.push(length);
        if (length > 60) {
          hasLongGaps = true;
        }
      }
    }
  }

  // If no valid cycle lengths found
  if (cycleLengths.length === 0) {
    return null;
  }

  // Calculate Averages
  const sumLengths = cycleLengths.reduce((a, b) => a + b, 0);
  const avg_cycle_length = Math.round(sumLengths / cycleLengths.length);

  const sumDurations = periodDurations.reduce((a, b) => a + b, 0);
  // Default to 5 days if no valid durations exist
  const avg_period_duration = periodDurations.length > 0 ? Math.round(sumDurations / periodDurations.length) : 5;

  // Calculate Standard Deviation for cycle lengths
  const variance = cycleLengths.reduce((a, b) => a + Math.pow(b - avg_cycle_length, 2), 0) / cycleLengths.length;
  const stddev_cycle = Math.sqrt(variance);

  // Confidence Score: base it on variability. Lower stddev = higher confidence
  // Max confidence 0.99, clamp to min 0.1
  let confidence_score = Math.max(0.1, Math.min(0.99, 1 - (stddev_cycle / 14)));
  confidence_score = Math.round(confidence_score * 100) / 100; // Round to 2 decimals

  // Detect Irregularity
  const irregular_flag = stddev_cycle > 6;

  // Predict Next Period
  const lastCycleStart = new Date(sortedCycles[sortedCycles.length - 1].start_date);
  const predicted_start_date = addDays(lastCycleStart, avg_cycle_length);
  const predicted_end_date = addDays(predicted_start_date, avg_period_duration - 1);

  // Fertility Window Prediction (Standard Rhythm Method approximation)
  // Ovulation typically occurs 14 days before the start of the next cycle.
  // Fertile window is usually 5 days before ovulation up to 1 day after.
  const ovulation_date = addDays(predicted_start_date, -14);
  const fertile_start_date = addDays(ovulation_date, -5);
  const fertile_end_date = addDays(ovulation_date, 1);

  // Formatting results to YYYY-MM-DD
  const formatYMD = (d: Date) => formatISO(d, { representation: 'date' });

  // Generate Insights
  const insights: string[] = [];
  if (irregular_flag) {
    insights.push("Your cycles appear irregular.");
    insights.push("Cycle length variability is high.");
  }
  if (hasLongGaps) {
    insights.push("Noticeable gaps between cycles detected in history.");
  }
  
  if (cycleLengths.length > 0 && !hasLongGaps) {
    const lastLength = cycleLengths[cycleLengths.length - 1];
    const diffFromAvg = Math.abs(lastLength - avg_cycle_length);
    if (diffFromAvg > 5) {
      insights.push(`Your last cycle differed significantly (${diffFromAvg} days) from your average.`);
    } else {
      insights.push("Your cycle lengths are relatively consistent.");
    }
  }

  return {
    predicted_start: formatYMD(predicted_start_date),
    predicted_end: formatYMD(predicted_end_date),
    avg_cycle_length,
    avg_period_duration,
    confidence_score,
    irregular_flag,
    fertile_start: formatYMD(fertile_start_date),
    fertile_end: formatYMD(fertile_end_date),
    ovulation_day: formatYMD(ovulation_date),
    insights
  };
}
