export type GradeBand = { minPercent: number; maxPercent: number; grade: string; gpa?: number };
export type CategoryMarks = { marks: number; max: number; exams?: number };

export function calculateWeightedPercentage(categories: Map<string, CategoryMarks>, weights: Record<string, number>) {
  const weighted = Object.entries(weights).filter(([, weight]) => Number(weight) > 0);
  if (!weighted.length || weighted.some(([category]) => !categories.has(category) || !categories.get(category)!.max)) return null;
  return Math.round(weighted.reduce((sum, [category, weight]) => {
    const marks = categories.get(category)!;
    return sum + marks.marks / marks.max * 100 * Number(weight) / 100;
  }, 0) * 100) / 100;
}

export function gradeBandForPercentage(percentage: number | null, bands: GradeBand[]) {
  if (percentage === null) return null;
  return bands.find(band => percentage >= band.minPercent && percentage < band.maxPercent)
    || bands.find(band => percentage === 100 && band.maxPercent === 100)
    || null;
}
