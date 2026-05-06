export function generateSKU(grade: string, flavorCode: string, sizeValue: string): string {
  return `SAF-${grade}-${flavorCode}-${sizeValue}`;
}

export function getMeshSize(grade: string): string {
  return grade === "500M" ? "500" : "200";
}

export const GRADES = [
  { value: "STD", label: "STD (Standard)" },
  { value: "500M", label: "500M (Premium)" },
] as const;

export const PACKAGING_STATES = ["raw", "sleeved", "labeled", "ready-to-ship"] as const;
export const LOCATIONS = ["factory", "warehouse"] as const;
