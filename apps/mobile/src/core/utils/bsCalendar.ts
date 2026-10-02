import NepaliDate from 'nepali-date-converter';

export type BsMonth = { year: number; month: number };
export type DualCalendarDay = { bsDay: number; adDate: Date; weekDay: number };

export function currentBsMonth(): BsMonth {
  const { BS } = new NepaliDate().getDateObject();
  return { year: BS.year, month: BS.month };
}

export function shiftBsMonth(value: BsMonth, offset: number): BsMonth {
  const shifted = new NepaliDate(value.year, value.month + offset, 1);
  return { year: shifted.getYear(), month: shifted.getMonth() };
}

export function getBsMonthDays(value: BsMonth): DualCalendarDay[] {
  const firstDay = new NepaliDate(value.year, value.month, 1);
  const nextMonth = new NepaliDate(value.year, value.month + 1, 1);
  const dayCount = Math.round((nextMonth.toJsDate().getTime() - firstDay.toJsDate().getTime()) / 86_400_000);
  return Array.from({ length: dayCount }, (_, index) => {
    const bsDay = index + 1;
    const converted = new NepaliDate(value.year, value.month, bsDay);
    const adDate = converted.toJsDate();
    return { bsDay, adDate, weekDay: converted.getDay() };
  });
}

export function getBsMonthLabels(value: BsMonth) {
  const days = getBsMonthDays(value);
  const first = days[0]?.adDate;
  const last = days[days.length - 1]?.adDate;
  const format = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const adRange = first && last
    ? format(first) === format(last) ? format(first) : `${format(first)} – ${format(last)}`
    : '';
  return { bs: new NepaliDate(value.year, value.month, 1).format('MMMM YYYY'), ad: adRange };
}

export function getGregorianMonthsForBsMonth(value: BsMonth) {
  const seen = new Map<string, { year: number; month: number }>();
  for (const day of getBsMonthDays(value)) {
    const year = day.adDate.getFullYear();
    const month = day.adDate.getMonth();
    seen.set(`${year}-${month}`, { year, month });
  }
  return [...seen.values()];
}
