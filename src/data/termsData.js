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
  { id:"lichun",      zh:"立春", en:"Beginning of Spring",  solarLon:315, doy:35,  dateEn:"Feb. 4",  dateZh:"二月四日" },
  { id:"yushui",      zh:"雨水", en:"Rain Water",           solarLon:330, doy:50,  dateEn:"Feb. 19", dateZh:"二月十九日" },
  { id:"jingzhe",     zh:"惊蛰", en:"Awakening of Insects",  solarLon:345, doy:64,  dateEn:"Mar. 5",  dateZh:"三月五日" },
  { id:"chunfen",     zh:"春分", en:"Spring Equinox",       solarLon:0,   doy:79,  dateEn:"Mar. 20", dateZh:"三月二十日" },
  { id:"qingming",    zh:"清明", en:"Pure Brightness",      solarLon:15,  doy:94,  dateEn:"Apr. 4",  dateZh:"四月四日" },
  { id:"guyu",        zh:"谷雨", en:"Grain Rain",           solarLon:30,  doy:110, dateEn:"Apr. 20", dateZh:"四月二十日" },
  { id:"lixia",       zh:"立夏", en:"Beginning of Summer",  solarLon:45,  doy:125, dateEn:"May 5",   dateZh:"五月五日" },
  { id:"xiaoman",     zh:"小满", en:"Grain Buds",           solarLon:60,  doy:141, dateEn:"May 21",  dateZh:"五月二十一日" },
  { id:"mangzhong",   zh:"芒种", en:"Grain in Ear",         solarLon:75,  doy:156, dateEn:"Jun. 5",  dateZh:"六月五日" },
  { id:"xiazhi",      zh:"夏至", en:"Summer Solstice",      solarLon:90,  doy:172, dateEn:"Jun. 21", dateZh:"六月二十一日" },
  { id:"xiaoshu",     zh:"小暑", en:"Minor Heat",           solarLon:105, doy:188, dateEn:"Jul. 7",  dateZh:"七月七日" },
  { id:"dashu",       zh:"大暑", en:"Major Heat",           solarLon:120, doy:203, dateEn:"Jul. 22", dateZh:"七月二十二日" },
  { id:"liqiu",       zh:"立秋", en:"Beginning of Autumn",  solarLon:135, doy:219, dateEn:"Aug. 7",  dateZh:"八月七日" },
  { id:"chushu",      zh:"处暑", en:"End of Heat",          solarLon:150, doy:235, dateEn:"Aug. 23", dateZh:"八月二十三日" },
  { id:"bailu",       zh:"白露", en:"White Dew",            solarLon:165, doy:250, dateEn:"Sep. 7",  dateZh:"九月七日" },
  { id:"qiufen",      zh:"秋分", en:"Autumn Equinox",       solarLon:180, doy:266, dateEn:"Sep. 23", dateZh:"九月二十三日" },
  { id:"hanlu",       zh:"寒露", en:"Cold Dew",             solarLon:195, doy:281, dateEn:"Oct. 8",  dateZh:"十月八日" },
  { id:"shuangjiang", zh:"霜降", en:"Frost’s Descent",      solarLon:210, doy:296, dateEn:"Oct. 23", dateZh:"十月二十三日" },
  { id:"lidong",      zh:"立冬", en:"Beginning of Winter",  solarLon:225, doy:311, dateEn:"Nov. 7",  dateZh:"十一月七日" },
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
  lichun: 'A first softness stirs beneath the cold.',
  yushui: 'Rain begins to loosen winter\'s grip.',
  jingzhe: 'Sleeping things begin to tremble awake.',
  chunfen: 'Light and dark meet in careful balance.',
  qingming: 'The world clears, brightening into detail.',
  guyu: 'Rain feeds the grain and thickens the earth.',
  lixia: 'Warmth settles and summer starts to unfold.',
  xiaoman: 'Things swell, not full, but almost.',
  mangzhong: 'Seeds and fields enter their season of urgency.',
  xiazhi: 'The longest day burns at its peak.',
  xiaoshu: 'Heat gathers, still rising toward its height.',
  dashu: 'The air grows heavy with the year\'s deepest heat.',
  liqiu: 'A faint coolness enters the heat.',
  chushu: 'Summer begins to release its hold.',
  bailu: 'Dew appears, cool and pale at dawn.',
  qiufen: 'Day and night return to balance once more.',
  hanlu: 'The dew turns colder, and autumn deepens.',
  shuangjiang: 'Frost arrives like a quiet decision.',
  lidong: 'Cold settles in and winter begins its claim.',
  xiaoxue: 'The first snow hints at a deepening stillness.',
  daxue: 'Snow and silence gather across the land.',
  dongzhi: 'The longest night holds a returning warmth within it.',
  xiaohan: 'Cold sharpens and the world draws inward.',
  dahan: 'The year reaches the depth of its cold.'
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
    "东风解冻 — East winds thaw the ice as early spring warmth begins to return.",
    "蛰虫始振 — Hibernating insects begin to stir as the ground slowly warms.",
    "鱼陟负冰 — Fish move beneath the ice as frozen waters begin to loosen."
  ],
  yushui: [
    "獭祭鱼 — Otters begin catching fish as rivers and streams reopen.",
    "鸿雁来 — Wild geese return as the air grows warmer.",
    "草木萌动 — Grass and trees begin to bud as moisture and warmth increase."
  ],
  jingzhe: [
    "桃始华 — Peach blossoms open as spring warmth deepens.",
    "仓庚鸣 — Orioles begin to sing as the season grows brighter and warmer.",
    "鹰化为鸠 — Fierce winter birds give way to gentler spring life as the season changes."
  ],
  chunfen: [
    "玄鸟至 — Swallows return as spring reaches a point of balance.",
    "雷乃发声 — Thunder begins to sound as warmer air stirs the sky.",
    "始电 — Lightning appears as spring storms begin to form."
  ],
  qingming: [
    "桐始华 — Paulownia trees flower as the season turns clear and mild.",
    "田鼠化为鴽 — Burrowing animals retreat as birds become more active in the open fields.",
    "虹始见 — Rainbows appear as sunlight breaks through spring rain."
  ],
  guyu: [
    "萍始生 — Duckweed spreads as the water grows warmer.",
    "鸣鸠拂其羽 — Cuckoos grow active as the air turns soft and damp.",
    "戴胜降于桑 — Hoopoes appear in mulberry trees as late spring settles in."
  ],
  lixia: [
    "蝼蝈鸣 — Summer insects begin to chirp as the days grow warmer.",
    "蚯蚓出 — Earthworms emerge as the soil becomes warm and moist.",
    "王瓜生 — Vines begin to grow as summer energy rises."
  ],
  xiaoman: [
    "苦菜秀 — Wild herbs grow lush as heat and rain increase.",
    "靡草死 — Delicate grasses begin to wither as the weather turns hotter.",
    "麦秋至 — Wheat nears harvest as the grain fills and matures."
  ],
  mangzhong: [
    "螳螂生 — Praying mantises appear as early summer deepens.",
    "鵙始鸣 — Shrikes begin to call as the fields grow active with life.",
    "反舌无声 — Some birds fall silent as the season grows hotter."
  ],
  xiazhi: [
    "鹿角解 — Deer shed their antlers as yang energy reaches its peak and begins to turn.",
    "蜩始鸣 — Cicadas begin to sing as the heat intensifies.",
    "半夏生 — Summer herbs begin to flourish as warmth and moisture peak."
  ],
  xiaoshu: [
    "温风至 — Warm winds arrive as summer heat builds.",
    "蟋蟀居宇 — Crickets seek shelter as the ground grows too hot.",
    "鹰始鸷 — Hawks hunt more fiercely as summer hardens the air."
  ],
  dashu: [
    "腐草为萤 — Fireflies appear as humid heat fills the summer night.",
    "土润溽暑 — The earth grows damp and heavy as heat and moisture thicken.",
    "大雨时行 — Heavy rains arrive as summer weather becomes unstable."
  ],
  liqiu: [
    "凉风至 — Cool winds begin to arrive as summer starts to recede.",
    "白露降 — Dew begins to form as nights grow cooler.",
    "寒蝉鸣 — Late cicadas call as the air begins to shift toward autumn."
  ],
  chushu: [
    "鹰乃祭鸟 — Eagles hunt birds as autumn sharpens their instincts.",
    "天地始肃 — The world grows more austere as heat begins to withdraw.",
    "禾乃登 — Grain ripens as the harvest season arrives."
  ],
  bailu: [
    "鸿雁来 — Wild geese arrive as autumn deepens.",
    "玄鸟归 — Swallows depart as the season turns colder.",
    "群鸟养羞 — Birds gather food as they prepare for the coming cold."
  ],
  qiufen: [
    "雷始收声 — Thunder fades as the atmosphere cools and settles.",
    "蛰虫坯户 — Insects seal their shelters as colder days approach.",
    "水始涸 — Waters begin to recede as autumn dries the land."
  ],
  hanlu: [
    "鸿雁来宾 — Geese continue to arrive as migration advances southward.",
    "雀入大水为蛤 — Sparrows disappear from view as colder waters dominate the landscape.",
    "菊有黄华 — Chrysanthemums bloom yellow as late autumn takes hold."
  ],
  shuangjiang: [
    "豺乃祭兽 — Wild hunters become more active as winter draws near.",
    "草木黄落 — Leaves yellow and fall as frost reaches the plants.",
    "蛰虫咸俯 — Insects retreat into stillness as the cold intensifies."
  ],
  lidong: [
    "水始冰 — Water begins to freeze as winter cold settles over the land.",
    "地始冻 — The ground begins to harden as frost enters the soil.",
    "雉入大水为蜃 — Some birds disappear as winter shifts life toward water and concealment."
  ],
  xiaoxue: [
    "虹藏不见 — Rainbows disappear as cold air replaces warm seasonal rain.",
    "天气上腾地气下降 — The energies of heaven and earth separate as winter deepens.",
    "闭塞而成冬 — The world closes inward as winter fully sets in."
  ],
  daxue: [
    "鹖鴠不鸣 — Cold-weather birds fall silent as the air turns harsher.",
    "虎始交 — Tigers begin to mate as life responds to deep winter cycles.",
    "荔挺出 — Hardy shoots emerge as hidden vitality persists beneath the cold."
  ],
  dongzhi: [
    "蚯蚓结 — Earthworms curl tightly as the winter cold hardens the soil around them.",
    "麋角解 — Moose shed their antlers as the year turns at its darkest point.",
    "水泉动 — Spring water begins to stir as hidden warmth starts to return beneath the cold."
  ],
  xiaohan: [
    "雁北乡 — Wild geese turn northward as the season begins to shift.",
    "鹊始巢 — Magpies begin building nests as new life is quietly prepared.",
    "雉始雊 — Pheasants begin to call as the first signs of renewal emerge."
  ],
  dahan: [
    "鸡始乳 — Hens begin to brood as life prepares to renew within the deepest cold.",
    "征鸟厉疾 — Birds of prey move swiftly as severe cold sharpens survival.",
    "水泽腹坚 — Rivers and marshes freeze solid as winter reaches its coldest depth."
  ]
};

export const HOU_MAP_LANDING = {
  lichun: [
    "东风解冻 — East winds thaw",
    "蛰虫始振 — Insects stir",
    "鱼陟负冰 — Fish rise under ice"
  ],
  yushui: [
    "獭祭鱼 — Otters catch fish",
    "鸿雁来 — Geese return",
    "草木萌动 — Plants begin to bud"
  ],
  jingzhe: [
    "桃始华 — Peach blossoms open",
    "仓庚鸣 — Orioles sing",
    "鹰化为鸠 — Hawks give way to doves"
  ],
  chunfen: [
    "玄鸟至 — Swallows arrive",
    "雷乃发声 — Thunder begins",
    "始电 — Lightning appears"
  ],
  qingming: [
    "桐始华 — Paulownia blooms",
    "田鼠化为鴽 — Field mice yield to quails",
    "虹始见 — Rainbows appear"
  ],
  guyu: [
    "萍始生 — Duckweed grows",
    "鸣鸠拂其羽 — Cuckoos preen",
    "戴胜降于桑 — Hoopoes perch in mulberries"
  ],
  lixia: [
    "蝼蝈鸣 — Insects chirp",
    "蚯蚓出 — Earthworms emerge",
    "王瓜生 — Vines begin to grow"
  ],
  xiaoman: [
    "苦菜秀 — Wild herbs flourish",
    "靡草死 — Tender grasses wither",
    "麦秋至 — Wheat ripens"
  ],
  mangzhong: [
    "螳螂生 — Mantises appear",
    "鵙始鸣 — Shrikes call",
    "反舌无声 — Mockingbirds fall silent"
  ],
  xiazhi: [
    "鹿角解 — Deer shed antlers",
    "蜩始鸣 — Cicadas sing",
    "半夏生 — Summer herbs grow"
  ],
  xiaoshu: [
    "温风至 — Warm winds arrive",
    "蟋蟀居宇 — Crickets seek shelter",
    "鹰始鸷 — Hawks hunt sharply"
  ],
  dashu: [
    "腐草为萤 — Fireflies appear",
    "土润溽暑 — The earth grows humid",
    "大雨时行 — Heavy rains come"
  ],
  liqiu: [
    "凉风至 — Cool winds arrive",
    "白露降 — Dew descends",
    "寒蝉鸣 — Autumn cicadas sing"
  ],
  chushu: [
    "鹰乃祭鸟 — Eagles hunt birds",
    "天地始肃 — The world turns austere",
    "禾乃登 — Grain ripens"
  ],
  bailu: [
    "鸿雁来 — Geese arrive",
    "玄鸟归 — Swallows return south",
    "群鸟养羞 — Birds store food"
  ],
  qiufen: [
    "雷始收声 — Thunder quiets",
    "蛰虫坯户 — Insects seal burrows",
    "水始涸 — Waters recede"
  ],
  hanlu: [
    "鸿雁来宾 — Geese continue south",
    "雀入大水为蛤 — Sparrows become clams",
    "菊有黄华 — Chrysanthemums bloom yellow"
  ],
  shuangjiang: [
    "豺乃祭兽 — Jackals hunt",
    "草木黄落 — Leaves yellow and fall",
    "蛰虫咸俯 — Insects go still"
  ],
  lidong: [
    "水始冰 — Water freezes",
    "地始冻 — Ground freezes",
    "雉入大水为蜃 — Pheasants become clams"
  ],
  xiaoxue: [
    "虹藏不见 — Rainbows disappear",
    "天气上腾地气下降 — Heaven rises, earth sinks",
    "闭塞而成冬 — Winter closes in"
  ],
  daxue: [
    "鹖鴠不鸣 — Cold birds fall silent",
    "虎始交 — Tigers mate",
    "荔挺出 — Winter shoots emerge"
  ],
  dongzhi: [
    "蚯蚓结 — Earthworms curl",
    "麋角解 — Moose shed antlers",
    "水泉动 — Spring water stirs"
  ],
  xiaohan: [
    "雁北乡 — Geese turn north",
    "鹊始巢 — Magpies build nests",
    "雉始雊 — Pheasants call"
  ],
  dahan: [
    "鸡始乳 — Hens brood",
    "征鸟厉疾 — Birds of prey quicken",
    "水泽腹坚 — The hearts of waters and marshes freeze solid"
  ]
};

export const TERM_COLORS = {
  "dongzhi":     { base: "#89a2b6" },
  "xiaohan":     { base: "#8895b9" },
  "dahan":       { base: "#9195be" },

  "lichun":      { base: "#b9c195" },
  "yushui":      { base: "#a1c38d" },
  "jingzhe":     { base: "#99c6a3" },
  "chunfen":     { base: "#7cb09d" },
  "qingming":    { base: "#89bdb8" },
  "guyu":        { base: "#87b5bf" },

  "lixia":       { base: "#bcbe7c" },
  "xiaoman":     { base: "#cabd81" },
  "mangzhong":   { base: "#dbb774" },
  "xiazhi":      { base: "#d1a67d" },
  "xiaoshu":     { base: "#d0a28b" },
  "dashu":       { base: "#cb9690" },

  "liqiu":       { base: "#cf997f" },
  "chushu":      { base: "#c59a91" },
  "bailu":       { base: "#c99093" },
  "qiufen":      { base: "#bf8b9b" },
  "hanlu":       { base: "#b588a4" },
  "shuangjiang": { base: "#a887ab" },

  "lidong":      { base: "#8392b4" },
  "xiaoxue":     { base: "#87b1c5" },
  "daxue":       { base: "#798f9e" }
};
