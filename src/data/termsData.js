// All 24 solar terms data with day/night hours
function estimateDayHours(doy) {
  const t = ((doy - 172) / 365) * (Math.PI * 2);
  const v = Math.cos(t);
  const day = 12 + 3 * v;
  return Math.max(8.5, Math.min(15.5, day));
}

const LUNAR_BASE_YEAR = 2025;

function numberToZhDay(n) {
  const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (n <= 10) return n === 10 ? '十' : digits[n];
  if (n < 20) return `十${digits[n - 10]}`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${digits[tens]}十${ones ? digits[ones] : ''}`;
  }
  return String(n);
}

function lunarDateZhFromDoy(doy, fallback = '') {
  try {
    const date = new Date(LUNAR_BASE_YEAR, 0, doy);
    const fmt = new Intl.DateTimeFormat('zh-CN-u-ca-chinese', {
      month: 'long',
      day: 'numeric'
    });
    const parts = fmt.formatToParts(date);
    const monthRaw = parts.find((p) => p.type === 'month')?.value || '';
    const dayRaw = parts.find((p) => p.type === 'day')?.value || '';
    const dayNum = Number.parseInt(dayRaw, 10);

    const month = monthRaw && monthRaw.includes('月') ? monthRaw : `${monthRaw}月`;
    const day = Number.isFinite(dayNum) ? `${numberToZhDay(dayNum)}日` : `${dayRaw}日`;

    if (!month || !dayRaw) return fallback;
    return `${month}${day}`;
  } catch (_) {
    return fallback;
  }
}

const TERM_LIST_RAW = [
  { id:"dongzhi",     zh:"冬至", en:"Winter Solstice",       solarLon:270, doy:355, dateEn:"Dec. 21", dateZh:"十二月二十一" },
  { id:"xiaohan",     zh:"小寒", en:"Minor Cold",           solarLon:285, doy:5,   dateEn:"Jan. 5",  dateZh:"一月五日" },
  { id:"dahan",       zh:"大寒", en:"Major Cold",           solarLon:300, doy:20,  dateEn:"Jan. 20", dateZh:"一月二十日" },
  { id:"lichun",      zh:"立春", en:"Start of Spring",      solarLon:315, doy:35,  dateEn:"Feb. 4",  dateZh:"二月四日" },
  { id:"yushui",      zh:"雨水", en:"Rain Water",           solarLon:330, doy:50,  dateEn:"Feb. 19", dateZh:"二月十九日" },
  { id:"jingzhe",     zh:"惊蛰", en:"Awakening of Insects",  solarLon:345, doy:64,  dateEn:"Mar. 5",  dateZh:"三月五日" },
  { id:"chunfen",     zh:"春分", en:"Spring Equinox",       solarLon:0,   doy:79,  dateEn:"Mar. 20", dateZh:"三月二十日" },
  { id:"qingming",    zh:"清明", en:"Pure Brightness",      solarLon:15,  doy:94,  dateEn:"Apr. 4",  dateZh:"四月四日" },
  { id:"guyu",        zh:"谷雨", en:"Grain Rain",           solarLon:30,  doy:110, dateEn:"Apr. 20", dateZh:"四月二十日" },
  { id:"lixia",       zh:"立夏", en:"Start of Summer",      solarLon:45,  doy:125, dateEn:"May 5",   dateZh:"五月五日" },
  { id:"xiaoman",     zh:"小满", en:"Grain Full",           solarLon:60,  doy:141, dateEn:"May 21",  dateZh:"五月二十一日" },
  { id:"mangzhong",   zh:"芒种", en:"Grain in Ear",         solarLon:75,  doy:156, dateEn:"Jun. 5",  dateZh:"六月五日" },
  { id:"xiazhi",      zh:"夏至", en:"Summer Solstice",      solarLon:90,  doy:172, dateEn:"Jun. 21", dateZh:"六月二十一日" },
  { id:"xiaoshu",     zh:"小暑", en:"Minor Heat",           solarLon:105, doy:188, dateEn:"Jul. 7",  dateZh:"七月七日" },
  { id:"dashu",       zh:"大暑", en:"Major Heat",           solarLon:120, doy:203, dateEn:"Jul. 22", dateZh:"七月二十二日" },
  { id:"liqiu",       zh:"立秋", en:"Start of Autumn",      solarLon:135, doy:219, dateEn:"Aug. 7",  dateZh:"八月七日" },
  { id:"chushu",      zh:"处暑", en:"End of Heat",          solarLon:150, doy:235, dateEn:"Aug. 23", dateZh:"八月二十三日" },
  { id:"bailu",       zh:"白露", en:"White Dew",            solarLon:165, doy:250, dateEn:"Sep. 7",  dateZh:"九月七日" },
  { id:"qiufen",      zh:"秋分", en:"Autumn Equinox",       solarLon:180, doy:266, dateEn:"Sep. 23", dateZh:"九月二十三日" },
  { id:"hanlu",       zh:"寒露", en:"Cold Dew",             solarLon:195, doy:281, dateEn:"Oct. 8",  dateZh:"十月八日" },
  { id:"shuangjiang", zh:"霜降", en:"Frost Descent",        solarLon:210, doy:296, dateEn:"Oct. 23", dateZh:"十月二十三日" },
  { id:"lidong",      zh:"立冬", en:"Start of Winter",      solarLon:225, doy:311, dateEn:"Nov. 7",  dateZh:"十一月七日" },
  { id:"xiaoxue",     zh:"小雪", en:"Minor Snow",           solarLon:240, doy:326, dateEn:"Nov. 22", dateZh:"十一月二十二日" },
  { id:"daxue",       zh:"大雪", en:"Major Snow",           solarLon:255, doy:341, dateEn:"Dec. 7",  dateZh:"十二月七日" }
];

const TERM_LUNAR_DATE_MAP_2026 = {
  dongzhi: '冬月初二',
  xiaohan: '冬月十七',
  dahan: '腊月初二',
  lichun: '正月初三',
  yushui: '正月十七',
  jingzhe: '二月初九',
  chunfen: '二月廿四',
  qingming: '三月初三',
  guyu: '三月十八',
  lixia: '四月初三',
  xiaoman: '四月十九',
  mangzhong: '五月初三',
  xiazhi: '五月十九',
  xiaoshu: '六月初三',
  dashu: '六月十九',
  liqiu: '七月初三',
  chushu: '七月十九',
  bailu: '八月初三',
  qiufen: '八月十九',
  hanlu: '九月初三',
  shuangjiang: '九月十八',
  lidong: '十月初三',
  xiaoxue: '十月十九',
  daxue: '十一月初三'
};

const TERM_SUMMARY_MAP = {
  dongzhi: 'The longest night holds a returning warmth within it.',
  guyu: 'Rain becomes a condition that supports growth.',
  yushui: 'Brief rain softens the ground, then recedes.'
};

export const TERM_LIST = TERM_LIST_RAW.map(term => ({
  ...term,
  dateZhSolar: term.dateZh,
  dateZh: TERM_LUNAR_DATE_MAP_2026[term.id] || lunarDateZhFromDoy(term.doy, term.dateZh),
  summary: TERM_SUMMARY_MAP[term.id] || `${term.en} marks a seasonal turning point.`,
  dayH: estimateDayHours(term.doy),
  nightH: 24 - estimateDayHours(term.doy)
}));

export const TERM_CONTENT_MAP = {
  default: {
    noteEn: [
      'Observe this day in stillness.',
      'Notice how the season is shifting around you.'
    ],
    noteZh: [
      '在今天停一停。',
      '感受季节正在悄悄转变。'
    ],
    poemVerse: '四时有序，节气自明',
    poemAuthor: '佚名',
    poemTitle: '节气记',
    poemNote: 'Seasonal rhythms reveal themselves in small daily changes.',
    phasesNote: '',
    ritualNotes: [
      'Take a seasonal walk and observe one natural sign near you.',
      'Prepare a simple meal that fits the weather of this term.'
    ]
  },
  dongzhi: {
    noteEn: [
      'Observe today’s sunset. Notice how early night begins.',
      'From tomorrow on, days lengthen.'
    ],
    noteZh: [
      '看一看今天的日落。',
      '感受夜色提前降临。',
      '从明天起，',
      '光会一点一点回来。'
    ],
    poemVerse: '冬至阳生春又来',
    poemAuthor: '唐·杜甫',
    poemTitle: '《小至》',
    poemNote: 'Even in the darkest night, the light begins its return. Hold onto quiet hope.',
    phasesRows: [
      { zh: '蚯蚓结 /', en: 'Earthworms curl tightly.' },
      { zh: '麋角解 /', en: 'Deer shed their antlers.' },
      { zh: '水泉动 /', en: 'Underground springs begin to stir.' }
    ],
    phasesNote: 'Cold soil forces them into protective shapes.',
    ritualNotes: [
      'In northern China, dumplings are common, symbolizing warmth and gathering.',
      'In southern China, families share tangyuan, representing reunion and wholeness.'
    ]
  },
  guyu: {
    noteEn: [
      'Rain now supports growth rather than cold.',
      'Watch how fields and roadsides green quickly.'
    ],
    noteZh: [
      '此时的雨，不再只是寒意，',
      '而是万物生长的条件。'
    ],
    poemVerse: '谷雨春光晓，山川黛色新',
    poemAuthor: '佚名',
    poemTitle: '《谷雨》',
    poemNote: 'Late-spring rain turns waiting into visible growth.',
    phasesNote: '',
    ritualNotes: [
      'Drink fresh spring tea and notice subtle taste changes.',
      'Open windows after rain and let the moist air in briefly.'
    ]
  },
  yushui: {
    noteEn: [
      'The ground softens with brief rain, then clears.',
      'Listen for early seasonal sounds after rainfall.'
    ],
    noteZh: [
      '细雨润地，旋即天清。',
      '万物在湿润中慢慢苏醒。'
    ],
    poemVerse: '天街小雨润如酥',
    poemAuthor: '唐·韩愈',
    poemTitle: '《早春呈水部张十八员外》',
    poemNote: 'Early rain is light, but it changes everything quietly.',
    phasesNote: '',
    ritualNotes: [
      'Walk after light rain and observe sprouts near paths and walls.',
      'Keep routines gentle and aligned with the still-cool weather.'
    ]
  }
};

export const HOU_MAP = {
  lichun: [
    "东风解冻 — East wind melts ice",
    "蛰虫始振 — Insects awaken",
    "鱼陟负冰 — Fish move under ice"
  ],
  yushui: [
    "獭祭鱼 — Otters catch fish",
    "鸿雁来 — Geese return",
    "草木萌动 — Plants sprout"
  ],
  jingzhe: [
    "桃始华 — Peach blossoms open",
    "仓庚鸣 — Orioles sing",
    "鹰化为鸠 — Eagles give way to doves"
  ],
  chunfen: [
    "玄鸟至 — Swallows return",
    "雷乃发声 — Thunder begins",
    "始电 — Lightning flashes"
  ],
  qingming: [
    "桐始华 — Paulownia blooms",
    "田鼠化为鴽 — Field mice disappear",
    "虹始见 — Rainbows appear"
  ],
  guyu: [
    "萍始生 — Duckweed grows",
    "鸣鸠拂其羽 — Cuckoos call",
    "戴胜降于桑 — Hoopoes visit mulberry"
  ],
  lixia: [
    "蝼蝈鸣 — Crickets sing",
    "蚯蚓出 — Earthworms surface",
    "王瓜生 — Wild melons grow"
  ],
  xiaoman: [
    "苦菜秀 — Bitter greens thrive",
    "靡草死 — Soft grasses fade",
    "麦秋至 — Wheat ripens"
  ],
  mangzhong: [
    "螳螂生 — Mantises hatch",
    "鵙始鸣 — Shrikes sing",
    "反舌无声 — Songbirds quiet"
  ],
  xiazhi: [
    "鹿角解 — Deer shed antlers",
    "蜩始鸣 — Cicadas sing",
    "半夏生 — Pinellia grows"
  ],
  xiaoshu: [
    "温风至 — Warm winds arrive",
    "蟋蟀居宇 — Crickets move indoors",
    "鹰始鸷 — Hawks hunt"
  ],
  dashu: [
    "腐草为萤 — Fireflies glow",
    "土润溽暑 — Air turns humid",
    "大雨时行 — Heavy rains fall"
  ],
  liqiu: [
    "凉风至 — Cool winds arrive",
    "白露降 — Dew forms",
    "寒蝉鸣 — Cicadas cry"
  ],
  chushu: [
    "鹰乃祭鸟 — Hawks hunt",
    "天地始肃 — Air grows solemn",
    "禾乃登 — Grains mature"
  ],
  bailu: [
    "鸿雁来 — Geese arrive",
    "玄鸟归 — Swallows depart",
    "群鸟养羞 — Birds store food"
  ],
  qiufen: [
    "雷始收声 — Thunder fades",
    "蛰虫坯户 — Insects seal burrows",
    "水始涸 — Waters recede"
  ],
  hanlu: [
    "鸿雁来宾 — Geese gather",
    "雀入大水为蛤 — Clams appear",
    "菊有黄华 — Chrysanthemums bloom"
  ],
  shuangjiang: [
    "豺乃祭兽 — Jackals hunt",
    "草木黄落 — Leaves fall",
    "蛰虫咸俯 — Insects retreat"
  ],
  lidong: [
    "水始冰 — Water freezes",
    "地始冻 — Ground hardens",
    "雉入大水为蜃 — Clams form"
  ],
  xiaoxue: [
    "虹藏不见 — Rainbows vanish",
    "天气上升地气下降 — Energy shifts",
    "闭塞成冬 — Winter settles"
  ],
  daxue: [
    "鹖鴠不鸣 — Birds fall silent",
    "虎始交 — Tigers mate",
    "荔挺出 — Shoots emerge"
  ],
  dongzhi: [
    "蚯蚓结 — Earthworms curl",
    "麋角解 — Elk shed antlers",
    "水泉动 — Springs stir"
  ],
  xiaohan: [
    "雁北乡 — Geese head north",
    "鹊始巢 — Magpies build nests",
    "雉始鸲 — Pheasants call"
  ],
  dahan: [
    "鸡始乳 — Hens lay eggs",
    "征鸟厉疾 — Raptors hunt",
    "水泽腹坚 — Ice thickens"
  ]
};

export const TERM_COLORS = {
  "dongzhi":     { base: "#7fa3be" },
  "xiaohan":     { base: "#7e90c2" },
  "dahan":       { base: "#898fc7" },

  "lichun":      { base: "#c0ca8e" },
  "yushui":      { base: "#9fce84" },
  "jingzhe":     { base: "#93d0a1" },
  "chunfen":     { base: "#6eb99e" },
  "qingming":    { base: "#7fc7c0" },
  "guyu":        { base: "#7cbcca" },

  "lixia":       { base: "#c8ca6d" },
  "xiaoman":     { base: "#d8c673" },
  "mangzhong":   { base: "#efbe61" },
  "xiazhi":      { base: "#e1a76e" },
  "xiaoshu":     { base: "#dea081" },
  "dashu":       { base: "#d79088" },

  "liqiu":       { base: "#df9470" },
  "chushu":      { base: "#d09589" },
  "bailu":       { base: "#d5888b" },
  "qiufen":      { base: "#c98197" },
  "hanlu":       { base: "#bd7ea5" },
  "shuangjiang": { base: "#ad7db1" },

  "lidong":      { base: "#778dbc" },
  "xiaoxue":     { base: "#7cb6d1" },
  "daxue":       { base: "#6c8ca2" }
};
