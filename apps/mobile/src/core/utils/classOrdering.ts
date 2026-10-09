export const classOrderValue = (name: string) => {
  const key = name.trim().toLowerCase().replace(/^(class|grade|standard)\s*/i, '').replace(/\s+/g, ' ');
  const early: Record<string, number> = { nursery: -3, lkg: -2, 'lower kg': -2, 'lower kindergarten': -2, ukg: -1, 'upper kg': -1, 'upper kindergarten': -1 };
  if (key in early) return early[key];
  const grade = key.match(/\d+/);
  return grade ? Number(grade[0]) : Number.MAX_SAFE_INTEGER;
};

export const orderAcademicClasses = <T extends { name?: string }>(items: T[]) => [...items].sort((a, b) =>
  classOrderValue(String(a.name || '')) - classOrderValue(String(b.name || '')) ||
  String(a.name || '').localeCompare(String(b.name || ''), undefined, { numeric: true, sensitivity: 'base' }),
);

export const isGradeTenAlias = (name: string) => /^10\s*[ab]$/i.test(name.trim().replace(/^(class|grade|standard)\s*/i, ''));
export const gradeTenSectionName = (className: string) => className.trim().replace(/^(class|grade|standard)\s*/i, '').match(/^10\s*([ab])$/i)?.[1]?.toUpperCase() || null;

export const noticeTargetClasses = <T extends { id: string; name?: string }>(items: T[]) => {
  const aliases = items.filter(item => isGradeTenAlias(String(item.name || '')));
  const canonical = items.filter(item => /^10$/i.test(String(item.name || '').trim().replace(/^(class|grade|standard)\s*/i, '')));
  const tenIds = [...new Set([...canonical, ...aliases].map(item => item.id))];
  const ordinary = items.filter(item => !isGradeTenAlias(String(item.name || '')) && !canonical.includes(item));
  return orderAcademicClasses([...ordinary, ...(tenIds.length ? [{ id: '__grade_10__', name: '10', targetClassIds: tenIds } as T & { targetClassIds: string[] }] : [])]);
};
