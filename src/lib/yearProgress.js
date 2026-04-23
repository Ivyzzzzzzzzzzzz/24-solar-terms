export const isLeapYear = (year) => new Date(year, 1, 29).getMonth() === 1;

export const dayOfYearFloat = (date = new Date()) => {
  const start = new Date(date.getFullYear(), 0, 1);
  return ((date - start) / 86400000) + 1;
};

const clamp01 = (value) => Math.max(0, Math.min(1, value));

export const getYearProgressInfo = (date = new Date()) => {
  const yearDays = isLeapYear(date.getFullYear()) ? 366 : 365;
  const doy = dayOfYearFloat(date);
  const progress = clamp01(doy / yearDays);
  const daysLeft = Math.max(0, yearDays - doy);

  return {
    progress,
    percent: Math.round(progress * 100),
    daysLeft
  };
};

export const getTermYearProgressInfo = (term, year = new Date().getFullYear()) => {
  const yearDays = isLeapYear(year) ? 366 : 365;
  const doy = Number(term?.doy || 1);
  const progress = clamp01(doy / yearDays);
  const daysLeft = Math.max(0, yearDays - doy);

  return {
    progress,
    percent: Math.round(progress * 100),
    daysLeft
  };
};

export const yearProgressDeg = (progress = 0) => `${(clamp01(progress) * 360).toFixed(2)}deg`;
