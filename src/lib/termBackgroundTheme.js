const THEME_GROUPS = {
  spring: ['lichun', 'yushui', 'jingzhe', 'chunfen', 'qingming', 'guyu'],
  summer: ['lixia', 'xiaoman', 'mangzhong', 'xiazhi', 'xiaoshu', 'dashu'],
  autumn: ['liqiu', 'chushu', 'bailu', 'qiufen', 'hanlu', 'shuangjiang'],
  winter: ['lidong', 'xiaoxue', 'daxue', 'dongzhi', 'xiaohan', 'dahan']
};

const THEMES = {
  spring: {
    sky: [244, 242, 228],
    ink: [52, 58, 44],
    grass: [142, 168, 92],
    rain: true,
    rainDensity: 180,
    rainAlpha: 58,
    snow: false,
    wind: 0.9
  },
  summer: {
    sky: [241, 237, 223],
    ink: [42, 48, 38],
    grass: [126, 153, 78],
    rain: true,
    rainDensity: 110,
    rainAlpha: 42,
    snow: false,
    wind: 0.55
  },
  autumn: {
    sky: [245, 239, 229],
    ink: [64, 58, 44],
    grass: [150, 134, 86],
    rain: false,
    rainDensity: 0,
    rainAlpha: 0,
    snow: false,
    wind: 0.75
  },
  winter: {
    sky: [247, 244, 236],
    ink: [56, 54, 50],
    grass: [170, 172, 168],
    rain: false,
    rainDensity: 0,
    rainAlpha: 0,
    snow: true,
    snowDensity: 80,
    wind: 0.45
  }
};

export const getThemeForTerm = (termId) => {
  const id = String(termId || '').toLowerCase();

  if (THEME_GROUPS.spring.includes(id)) return THEMES.spring;
  if (THEME_GROUPS.summer.includes(id)) return THEMES.summer;
  if (THEME_GROUPS.autumn.includes(id)) return THEMES.autumn;
  return THEMES.winter;
};
