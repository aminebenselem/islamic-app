export function getMoonImage(illumination: number): string {
  // Handle negative or percentage-like values
  const normalized = Math.abs(illumination) > 1 ? Math.abs(illumination) / 100 : Math.abs(illumination);

  // Cap full moon only if illumination is truly 100%
  const capped = normalized >= 0.995 ? 0.9 : normalized;

  // Round to nearest 0.1 step
  const step = Math.round(capped * 10) / 10;

  // Format to one decimal
  const formatted = step.toFixed(1);

  return `../../assets/${formatted}.svg`;
}
