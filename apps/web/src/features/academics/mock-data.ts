export const CURRENT_ACADEMIC_YEAR = { id: "ay_2026", name: "2026-2027" };

export const CLASSES = Array.from({ length: 10 }, (_, i) => ({
  id: `cls_${String(i + 1).padStart(2, "0")}`,
  name: `Class ${i + 1}`,
  sections: ["A", "B"].map((name) => ({ id: `sec_${i + 1}${name.toLowerCase()}`, name })),
}));

export function findSection(sectionId: string) {
  for (const cls of CLASSES) {
    const section = cls.sections.find((s) => s.id === sectionId);
    if (section) return { cls, section };
  }
  return null;
}