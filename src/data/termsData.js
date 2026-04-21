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

export const TERM_POEM_MAP = {
  default: {
    poemVerse: '四时有序，节气自明',
    poemAuthor: '佚名',
    poemTitle: '节气记',
    poemNote: 'Seasonal rhythms reveal themselves in small daily changes.'
  },
  lichun: {
    poemVerse: '律回岁晚冰霜少，春到人间草木知。便觉眼前生意满，东风吹水绿参差。',
    poemAuthor: '宋·张榫',
    poemTitle: '《立春偶成》',
    poemNote: "Frost thins as the old year ebbs away, and spring is known by leaf and spray. Life rises full before the eye; east winds ripple green where waters lie."
  },
  yushui: {
    poemVerse: '天街小雨润如酥，草色遥看近却无。最是一年春好处，绝胜烟柳满皇都。',
    poemAuthor: '唐·韩愈',
    poemTitle: '《初春小雨》',
    poemNote: "On city streets the light rain gleams, the grass appears, then fades like dreams. This is the finest hour of spring's return, beyond the misty willows the capitals burn."
  },
  jingzhe: {
    poemVerse: '天街小雨润如酥，草色遥看近却无。最是一年春好处，绝胜烟柳满皇都。',
    poemAuthor: '唐·韩愈',
    poemTitle: '《初春小雨》',
    poemNote: "A tender rain on the roadway lies, soft as cream beneath the skies. Far-off grass shows green anew-the fairest spring the year yet knew."
  },
  chunfen: {
    poemVerse: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。',
    poemAuthor: '唐·贺知章',
    poemTitle: '《咏柳》',
    poemNote: "A willow stands in jade array, long green silks all drift and sway. Who cut these tender leaves so bright? The second month's wind, sharp and light."
  },
  qingming: {
    poemVerse: '清明时节雨纷纷，路上行人欲断魂。借问酒家何处有？牧童遥指杏花村。',
    poemAuthor: '唐·杜牧',
    poemTitle: '《清明》',
    poemNote: "In Qingming rain falls fine, unending; on travelers' hearts a sorrow bending. 'Where is the tavern?' someone cries-a boy points where Apricot Village lies."
  },
  guyu: {
    poemVerse: '谷雨洗纤素，裁为白牡丹。异香开玉合，轻粉泥银盘。',
    poemAuthor: '唐·王贞白',
    poemTitle: '《白牡丹》',
    poemNote: 'Grain Rain has washed her white more fair, and shaped a peony from the air. Strange fragrance stirs from jade apart; pale powder rests in a silver heart.'
  },
  lixia: {
    poemVerse: '梅子流酸软齿牙，芭蕉分绿与窗纱。日长睡起无情思，闲看儿童捉柳花。',
    poemAuthor: '宋·杨万里',
    poemTitle: '《闲居初夏午睡起》',
    poemNote: "Sour plums set teeth and tongue astir, green banana leaves veil the window's blur. I wake from noon with no thought to borrow, and watch children chase willow down till tomorrow."
  },
  xiaoman: {
    poemVerse: '夜莺啼绿柳，皓月醒长空。最爱垄头麦，迎风笑落红。',
    poemAuthor: '宋·欧阳修',
    poemTitle: '《小满》',
    poemNote: 'Nightingales sing through willow shade, a bright moon wakes the sky outspread. Best loved of all, the wheat in rows-laughing to the wind as red bloom goes.'
  },
  mangzhong: {
    poemVerse: '时雨及芒种，四野皆插秧。家家麦饭美，处处菱歌长。',
    poemAuthor: '宋·陆游',
    poemTitle: '《时雨》',
    poemNote: 'Timely rain meets Grain in Ear, seedlings fill the fields far and near. Each household savors the season\'s fare; long songs drift up through the summer air.'
  },
  xiazhi: {
    poemVerse: '夕凉恰恰好溪行，暮色催人底急生。半路蛙声迎步止，一荧松火隔篱明。',
    poemAuthor: '宋·杨万里',
    poemTitle: '《夏至雨霁与陈履常暮行溪上二首》其一',
    poemNote: 'Evening cool invites a walk by the stream, while dusk urges life like a tightening dream. Midway I stop where the frogs reply; beyond the fence one pine-flame glows shy.'
  },
  xiaoshu: {
    poemVerse: '倏忽温风至，因循小暑来。竹喧先觉雨，山暗已闻雷。',
    poemAuthor: '唐·元稹',
    poemTitle: '《咏廿四气诗·小暑六月节》',
    poemNote: 'Warm winds arrive in a sudden sweep; Minor Heat steals in, soft and deep. Bamboo first knows the coming rain; dark hills listen for thunder again.'
  },
  dashu: {
    poemVerse: '大暑三秋近，林钟九夏移。桂轮开子夜，萤火照空时。',
    poemAuthor: '唐·元稹',
    poemTitle: '《咏廿四气诗·大暑六月中》',
    poemNote: 'Great Heat tells autumn is drawing near, though summer still rules the turning year. At midnight the moon-wheel opens bright; fireflies kindle the empty night.'
  },
  liqiu: {
    poemVerse: '乳鸦啼散玉屏空，一枕新凉一扇风。睡起秋色无觅处，满阶梧桐月明中。',
    poemAuthor: '宋·刘翰',
    poemTitle: '《立秋》',
    poemNote: "Young crows fall silent, the jade room bare; new coolness stirs through fan and air. Waking, I search for autumn's trace-moonlit parasol leaves fill the stairway space."
  },
  chushu: {
    poemVerse: '处暑无三日，新凉直万金。白头更世事，青草印禅心。',
    poemAuthor: '宋·苏迥',
    poemTitle: '《长江二首（其一）》',
    poemNote: 'Barely three days, and heat is gone; new cool is worth ten thousand gold alone. White-haired, I face the world once more; green grass receives a quiet spirit at its door.'
  },
  bailu: {
    poemVerse: '蒹葭苍苍，白露为霜。所谓伊人，在水一方。',
    poemAuthor: '先秦·佚名',
    poemTitle: '《诗经·蒹葭》第一章',
    poemNote: 'Reed and rush in pale grace stand; white dew turns frost across the land. The one I seek, the one I know, lies beyond the water\'s flow.'
  },
  qiufen: {
    poemVerse: '中庭地白树栖鸦，冷露无声湿桂花。今夜月明人尽望，不知秋思落谁家。',
    poemAuthor: '唐·王建',
    poemTitle: '《十五夜望月寄杜郎中》',
    poemNote: "White lies the court where dark crows rest, cold dew soaks osmanthus without a breath. Tonight all gaze at the moon's clear dome-whose house will autumn longing roam?"
  },
  hanlu: {
    poemVerse: '野店星河在，行人道路长。草色多寒露，虫声似故乡。',
    poemAuthor: '唐·李郢',
    poemTitle: '《早发》',
    poemNote: 'At the inn the river of stars still stays, while the traveler follows long, dim ways. Cold dew weighs down the grass by dawn; insect cries make home live on.'
  },
  shuangjiang: {
    poemVerse: '薄雾浓云愁永昼，瑞脑销金兽。东篱把酒黄昏后，有暗香盈袖。',
    poemAuthor: '宋·李清照',
    poemTitle: '《醉花阴·薄雾浓云愁永昼》',
    poemNote: 'Thin mist, thick cloud, a day grown long; the incense fades, the gold beast gone. At dusk by eastern hedge I raise my wine; hidden fragrance fills my sleeves like time.'
  },
  lidong: {
    poemVerse: '冻笔新诗懒写，寒炉美酒时温。醉看墨花月白，恍疑雪满前村。',
    poemAuthor: '明·王稚登',
    poemTitle: '《立冬》',
    poemNote: 'My frozen brush leaves fresh verse unwritten; wine warms by the stove in a hush half-hidden. Drunk, I watch ink-blossoms pale in moonlight gleam-and think the village ahead is snow, not dream.'
  },
  xiaoxue: {
    poemVerse: '绿蚁新醅酒，红泥小火炉。晚来天欲雪，能饮一杯无？',
    poemAuthor: '唐·白居易',
    poemTitle: '《问刘十九》',
    poemNote: 'New wine foams green, the small stove glows red; evening draws near, and snow clouds spread. Since night is cold and the fire burns low, will you come share one cup before the snow?'
  },
  daxue: {
    poemVerse: '千山鸟飞绝，万径人踪灭。孤舟蓑笠翁，独钓寒江雪。',
    poemAuthor: '唐·柳宗元',
    poemTitle: '《江雪》',
    poemNote: 'On thousand hills no bird takes flight, on ten thousand paths no trace in sight. In a lonely boat, in cape and cone, an old man fishes the cold snow alone.'
  },
  dongzhi: {
    poemVerse: '黄钟应律好风催，阴伏阳升淑气回。葵影便移长至日，梅花先趁小寒开。',
    poemAuthor: '宋·朱淑真',
    poemTitle: '《冬至》',
    poemNote: 'The season turns on a kindly breeze; hidden yin yields, and bright breaths ease. Sunflower shadows lean toward lengthening light; plum blossoms arrive through the edge of night.'
  },
  xiaohan: {
    poemVerse: '小寒连大吕，欢鹊垒新巢。拾食寻河曲，衔紫绕树梢。',
    poemAuthor: '唐·元稹',
    poemTitle: '《咏廿四气诗·小寒十二月节》',
    poemNote: 'Minor Cold joins the tuning sky; magpies build their new nests high. Along bent riverbanks they feed and call, bearing twigs of purple through the treetop wall.'
  },
  dahan: {
    poemVerse: '腊酒自盈樽，金炉兽炭温。大寒宜近火，无事莫开门。',
    poemAuthor: '唐·元稹',
    poemTitle: '《咏廿四气诗·大寒十二月中》',
    poemNote: 'Winter wine fills the waiting cup; brazier coals in golden chambers glow up. In Great Cold, stay close where warm fires are-with nothing to do, keep shut the door ajar.'
  }
};

export const TERM_POEM_META_EN_MAP = {
  default: {
    poemAuthorEn: 'Anonymous',
    poemTitleEn: 'Seasonal Notes'
  },
  lichun: {
    poemAuthorEn: 'Zhang Shi (Song)',
    poemTitleEn: 'An Impromptu Verse on Beginning of Spring'
  },
  yushui: {
    poemAuthorEn: 'Han Yu (Tang)',
    poemTitleEn: 'Light Rain in Early Spring'
  },
  jingzhe: {
    poemAuthorEn: 'Han Yu (Tang)',
    poemTitleEn: 'Light Rain in Early Spring'
  },
  chunfen: {
    poemAuthorEn: 'He Zhizhang (Tang)',
    poemTitleEn: 'Ode to the Willow'
  },
  qingming: {
    poemAuthorEn: 'Du Mu (Tang)',
    poemTitleEn: 'Qingming'
  },
  guyu: {
    poemAuthorEn: 'Wang Zhenbai (Tang)',
    poemTitleEn: 'White Peony'
  },
  lixia: {
    poemAuthorEn: 'Yang Wanli (Song)',
    poemTitleEn: 'Waking from a Noon Nap in Early Summer Seclusion'
  },
  xiaoman: {
    poemAuthorEn: 'Ouyang Xiu (Song)',
    poemTitleEn: 'Grain Buds'
  },
  mangzhong: {
    poemAuthorEn: 'Lu You (Song)',
    poemTitleEn: 'Timely Rain'
  },
  xiazhi: {
    poemAuthorEn: 'Yang Wanli (Song)',
    poemTitleEn: 'After Rain at Summer Solstice, Walking by the Creek with Chen Luchang, No. 1'
  },
  xiaoshu: {
    poemAuthorEn: 'Yuan Zhen (Tang)',
    poemTitleEn: 'Poem on the Twenty-Four Solar Terms: Minor Heat, Sixth Month'
  },
  dashu: {
    poemAuthorEn: 'Yuan Zhen (Tang)',
    poemTitleEn: 'Poem on the Twenty-Four Solar Terms: Major Heat, Mid-Sixth Month'
  },
  liqiu: {
    poemAuthorEn: 'Liu Han (Song)',
    poemTitleEn: 'Beginning of Autumn'
  },
  chushu: {
    poemAuthorEn: 'Su Jiong (Song)',
    poemTitleEn: 'Two Poems on the Yangtze, No. 1'
  },
  bailu: {
    poemAuthorEn: 'Anonymous (Pre-Qin)',
    poemTitleEn: 'The Book of Songs: Reeds and Rushes, Stanza 1'
  },
  qiufen: {
    poemAuthorEn: 'Wang Jian (Tang)',
    poemTitleEn: 'Looking at the Moon on the Fifteenth Night, Sent to Director Du'
  },
  hanlu: {
    poemAuthorEn: 'Li Ying (Tang)',
    poemTitleEn: 'Departing Early'
  },
  shuangjiang: {
    poemAuthorEn: 'Li Qingzhao (Song)',
    poemTitleEn: 'Drunken in the Shadow of Flowers'
  },
  lidong: {
    poemAuthorEn: 'Wang Zhideng (Ming)',
    poemTitleEn: 'Beginning of Winter'
  },
  xiaoxue: {
    poemAuthorEn: 'Bai Juyi (Tang)',
    poemTitleEn: 'A Question for Liu the Nineteenth'
  },
  daxue: {
    poemAuthorEn: 'Liu Zongyuan (Tang)',
    poemTitleEn: 'River Snow'
  },
  dongzhi: {
    poemAuthorEn: 'Zhu Shuzhen (Song)',
    poemTitleEn: 'Winter Solstice'
  },
  xiaohan: {
    poemAuthorEn: 'Yuan Zhen (Tang)',
    poemTitleEn: 'Poem on the Twenty-Four Solar Terms: Minor Cold, Twelfth Month'
  },
  dahan: {
    poemAuthorEn: 'Yuan Zhen (Tang)',
    poemTitleEn: 'Poem on the Twenty-Four Solar Terms: Major Cold, Mid-Twelfth Month'
  }
};

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
    ],
    ritualNotesZh: [
      '沿着季节散步，留意身边一个自然变化的信号。',
      '做一顿符合这个节气天气的简单饭食。'
    ]
  },
  dongzhi: {
    noteEn: [
      'Observe today\'s sunset. Notice how early night begins.',
      'From tomorrow on, days lengthen.'
    ],
    noteZh: [
      '看看今天的日落，留意黑夜是多么早地开始。',
      '从明天起，白昼会一点一点变长。'
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
    ],
    ritualNotesZh: [
      '在中国北方，冬至常吃饺子，象征温暖与团聚。',
      '在中国南方，家人常吃汤圆，寓意团圆与圆满。'
    ]
  },
  xiaohan: {
    noteEn: [
      'Step outside and feel the air on your face.',
      'Cold becomes something physical, direct, and impossible to ignore.'
    ],
    noteZh: [
      '走到室外，感受空气落在脸上的方式。',
      '寒冷在这时变得具体、直接，也无法忽视。'
    ],
    ritualNotes: [
      'Laba porridge: Winter-stored grains and beans come together in one hot bowl.'
    ],
    ritualNotesZh: [
      '腊八粥：把冬季储备食材熬成一碗热粥。'
    ]
  },
  dahan: {
    noteEn: [
      'Stay near warmth for a moment.',
      'At the coldest point of the year, even a small fire, lamp, or cup can feel immense.'
    ],
    noteZh: [
      '靠近温暖的地方停一会儿。',
      '在一年最冷的时候，一点点火光、灯光，或一只热杯子，都会显得格外珍贵。'
    ],
    ritualNotes: [
      'Lantern: Hung near the turn of the year, it signals the coming new year.'
    ],
    ritualNotesZh: [
      '灯笼：常在岁末年初出现，提示新年将近。'
    ]
  },
  lichun: {
    noteEn: [
      'Look closely at bare branches.',
      'Some buds may already be forming before the season feels ready.'
    ],
    noteZh: [
      '仔细看看仍然光裸的枝条。',
      '有些芽苞，也许会比季节更早一步出现。'
    ],
    ritualNotes: [
      'Spring pancake: Seasonal vegetables wrapped in a thin pancake mark the start of spring farming.'
    ],
    ritualNotesZh: [
      '春饼：把新鲜时蔬卷进薄饼，以“咬春”迎接农事新始。'
    ]
  },
  yushui: {
    noteEn: [
      'Notice the ground after rain.',
      'The earth begins to loosen, soften, and hold a different kind of light.'
    ],
    noteZh: [
      '留意雨后的地面。',
      '泥土开始变得松动、柔软，也映出一种不同的光。'
    ],
    poemVerse: '天街小雨润如酥',
    poemAuthor: '唐·韩愈',
    poemTitle: '《早春呈水部张十八员外》',
    poemNote: 'Early rain is light, but it changes everything quietly.',
    phasesNote: '',
    ritualNotes: [
      'Rain-water tea: Tea brewed with early spring rain becomes a small ritual of seasonal renewal.'
    ],
    ritualNotesZh: [
      '雨水茶：以初春雨水入茶，把饮茶变成迎新的季节动作。'
    ]
  },
  jingzhe: {
    noteEn: [
      'Pause and listen outdoors.',
      'The world may still look quiet, but small lives are beginning to stir beneath it.'
    ],
    noteZh: [
      '在户外停一停，听一听。',
      '世界看起来也许仍然安静，但细小的生命已经在其下开始活动。'
    ],
    ritualNotes: [
      'Fried beans: Their crisp cracking sound echoes the season\'s sudden awakening.'
    ],
    ritualNotesZh: [
      '炒豆：清脆爆裂的声音呼应万物被惊醒的意象。'
    ]
  },
  chunfen: {
    noteEn: [
      'Notice how balanced the day feels.',
      'Light and dark sit beside each other for a brief moment of near-equality.'
    ],
    noteZh: [
      '感受这一天的均衡。',
      '明与暗在这一刻短暂并置，几乎相等。'
    ],
    ritualNotes: [
      'Kite: A spring outing custom that also suggests release and uplift.'
    ],
    ritualNotesZh: [
      '风筝：既是春日出游活动，也带有舒展与放松之意。'
    ]
  },
  qingming: {
    noteEn: [
      'Take a slower walk today.',
      'Look for fresh green, soft rain, and the clarity that appears in early spring air.'
    ],
    noteZh: [
      '今天不妨走慢一点。',
      '留意新绿、细雨，以及初春空气里出现的清明感。'
    ],
    ritualNotes: [
      'Qingtuan: Its green color brings traces of fresh spring growth into the food.',
      'Tomb-sweeping: Qingming has long been tied to ancestor remembrance and family memory.'
    ],
    ritualNotesZh: [
      '青团：草叶染出的青色，把春天的新生带进食物里。',
      '扫墓：清明长期与祭祖和家族纪念相连。'
    ]
  },
  guyu: {
    noteEn: [
      'Observe new leaves or young plants.',
      'This is a time when growth feels tender, fast, and almost visible.'
    ],
    noteZh: [
      '观察新叶，或刚长出的植物。',
      '这是一个生长显得柔软、迅速，几乎肉眼可见的时节。'
    ],
    poemVerse: '谷雨春光晓，山川黛色新',
    poemAuthor: '佚名',
    poemTitle: '《谷雨》',
    poemNote: 'Late-spring rain turns waiting into visible growth.',
    phasesNote: '',
    ritualNotes: [
      'Tea picking: It falls in one of the key harvest periods for spring tea.'
    ],
    ritualNotesZh: [
      '采茶：正值重要春茶采摘时节。'
    ]
  },
  lixia: {
    noteEn: [
      'Stand in the sun for a moment longer than usual.',
      'You may begin to feel the season shift not in color, but in temperature.'
    ],
    noteZh: [
      '在阳光下多停留一会儿。',
      '你也许会先从温度，而不是颜色，感到季节的转变。'
    ],
    ritualNotes: [
      'Egg competition: Eggs are both a seasonal food and a playful custom at this time.'
    ],
    ritualNotesZh: [
      '斗蛋：鸡蛋既是时令食物，也发展成可参与的节令游戏。'
    ]
  },
  xiaoman: {
    noteEn: [
      'Look at grasses, grains, or any field-like planting.',
      'Things are not fully ripe, but they are no longer small.'
    ],
    noteZh: [
      '看看草木、麦粒，或任何像田野一样生长的植物。',
      '万物尚未成熟，但已经不再幼小。'
    ],
    ritualNotes: [
      'Silkworm: Their active growth at this time shaped related seasonal rituals.'
    ],
    ritualNotesZh: [
      '蚕：此时桑蚕生长旺盛，也带出相关祈愿习俗。'
    ]
  },
  mangzhong: {
    noteEn: [
      'Do something with your hands today.',
      'This term carries the feeling of sowing, planting, gathering, and being in motion.'
    ],
    noteZh: [
      '今天动手做一点什么。',
      '这个节气里有播种、栽种、收取，以及持续行动的感觉。'
    ],
    ritualNotes: [
      'Green plums: Ripening plums are often pickled or made into tart early-summer foods.'
    ],
    ritualNotesZh: [
      '梅子：青梅成熟，常被腌渍或做成初夏酸味食物。'
    ]
  },
  xiazhi: {
    noteEn: [
      'Notice how late the light stays.',
      'Even evening seems reluctant to end.'
    ],
    noteZh: [
      '留意光停留到多晚。',
      '连傍晚都像有些不愿结束。'
    ],
    ritualNotes: [
      'First-wheat noodles: Newly harvested wheat turns a bowl of noodles into a first taste of the season.',
      'Round fan: Used for cooling, it naturally belongs to midsummer seasonal life.'
    ],
    ritualNotesZh: [
      '尝新面：新麦初成，一碗面成为“尝新”的节令记忆。',
      '团扇：既能消暑，也常见于夏日时令生活。'
    ]
  },
  xiaoshu: {
    noteEn: [
      'Pay attention to shade, breeze, and moving air.',
      'Small reliefs become easier to notice when the heat begins to build.'
    ],
    noteZh: [
      '留意树荫、微风，与流动的空气。',
      '当热意开始累积，细小的凉意会变得更容易被察觉。'
    ],
    ritualNotes: [
      'Lotus seeds: Common in summer soups and desserts, they suggest calm seasonal nourishment.',
      'Lotus leaf: Seen in objects, wrapping, and imagery, it became a symbol of midsummer.'
    ],
    ritualNotesZh: [
      '莲子：常入夏季汤品和甜品，带出清润平和的联想。',
      '莲叶：常见于器物、包裹与图像中，成为盛夏意象。'
    ]
  },
  dashu: {
    noteEn: [
      'Drink something cold slowly.',
      'Let yourself feel how intense summer can become at its fullest.'
    ],
    noteZh: [
      '慢慢喝一点冰凉的东西。',
      '感受夏天在最盛的时候，能够变得多么强烈。'
    ],
    ritualNotes: [
      'Sun-curing ginger: Ginger dried with brown sugar under the summer sun turns heat into part of the food.',
      'Sending off the Major Heat boat: A ceremonial boat is sent out to sea to send away heat and pray for safety.'
    ],
    ritualNotesZh: [
      '晒伏姜：生姜与红糖在伏日曝晒，把炎热做进食物里。',
      '送大暑船：以送船出海的方式送暑并祈求平安。'
    ]
  },
  liqiu: {
    noteEn: [
      'Notice the morning or night air.',
      'Even before the landscape changes, the temperature may tell you autumn is near.'
    ],
    noteZh: [
      '留意清晨或夜晚的空气。',
      '即使景色还没改变，温度可能已经先告诉你秋天快到了。'
    ],
    ritualNotes: [
      'Putting on autumn weight: Rich food helps the body recover from summer and enter autumn.'
    ],
    ritualNotesZh: [
      '贴秋膘：以丰盛饮食补回夏日消耗，迎接秋天。'
    ]
  },
  chushu: {
    noteEn: [
      'Step outside in the evening.',
      'See whether the heat has loosened its grip, even just a little.'
    ],
    noteZh: [
      '傍晚时走到外面去。',
      '看看热气是否已经稍稍松开了它的掌控。'
    ],
    ritualNotes: [
      'Duck: In some regions, it is a familiar seasonal food at this time.',
      'Fishing net: It connects the term to waterside harvest and fishing labor.'
    ],
    ritualNotesZh: [
      '鸭：在一些地方，它是这一时节常见的家常食物。',
      '渔网：让这个节气联想到水边收获与捕鱼。'
    ]
  },
  bailu: {
    noteEn: [
      'Look at grass or leaves early in the day.',
      'Moisture may gather there before the sun has time to erase it.'
    ],
    noteZh: [
      '在清晨看看草叶或树叶。',
      '太阳还来不及将它抹去之前，水气可能已经静静停在上面。'
    ],
    ritualNotes: [
      'Gathering "Ten Whites": Herbs with "white" in their names are gathered and cooked into a White Dew custom.'
    ],
    ritualNotesZh: [
      '采十样白：采集名字带“白”的草药入菜，形成白露习俗。'
    ]
  },
  qiufen: {
    noteEn: [
      'Notice the evenness of the day.',
      'The year pauses again in balance before moving deeper into autumn.'
    ],
    noteZh: [
      '感受这一天的平分。',
      '一年再次短暂停在均衡之中，然后继续走向更深的秋天。'
    ],
    ritualNotes: [
      'Moon offering: Autumn Equinox was once tied to moon rituals that turned seasonal fullness into ceremony.'
    ],
    ritualNotesZh: [
      '祭月：古时秋分曾与祭月相关，把秋意转化为礼仪。'
    ]
  },
  hanlu: {
    noteEn: [
      'Touch the air in the early morning.',
      'Coolness is no longer a suggestion; it has become part of the day.'
    ],
    noteZh: [
      '在清晨触摸空气。',
      '凉意不再只是暗示，它已经成为这一天的一部分。'
    ],
    ritualNotes: [
      'Floral cake: Often paired with climbing, it carries the auspicious idea of rising higher.'
    ],
    ritualNotesZh: [
      '花糕：常与登高相连，也寄托“步步高升”的吉意。'
    ]
  },
  shuangjiang: {
    noteEn: [
      'Look closely at leaves, edges, and surfaces.',
      'The season begins to sharpen, and everything feels a little more fragile.'
    ],
    noteZh: [
      '仔细看看叶片、边缘与各种表面。',
      '季节开始变得清晰而锐利，万物也显得更脆弱一些。'
    ],
    ritualNotes: [
      'Persimmon: Its season, color, and fullness make it a natural sign of late autumn.'
    ],
    ritualNotesZh: [
      '柿子：成熟时节、色彩和饱满感都很像深秋。'
    ]
  },
  lidong: {
    noteEn: [
      'Notice what has fallen away.',
      'Branches, fields, and air begin to show their structure more clearly.'
    ],
    noteZh: [
      '留意那些已经落下或褪去的东西。',
      '枝条、田野与空气，都开始更清楚地显出它们的结构。'
    ],
    ritualNotes: [
      'Mutton hot pot: Warming mutton and shared hot pot make it a fitting food for early winter.'
    ],
    ritualNotesZh: [
      '羊肉火锅：温补的羊肉和围坐共食都很适合入冬。'
    ]
  },
  xiaoxue: {
    noteEn: [
      'Watch the sky carefully.',
      'Even if snow does not arrive, the light may already carry its feeling.'
    ],
    noteZh: [
      '认真看看天空。',
      '即使雪还没有来，光线里也可能已经带着雪的感觉。'
    ],
    ritualNotes: [
      'Cured meat: It belongs to the time when households begin preserving food for winter.'
    ],
    ritualNotesZh: [
      '腊肉：正值开始准备冬季储藏食物的时候。'
    ]
  },
  daxue: {
    noteEn: [
      'Listen to how quiet the world can become.',
      'Snow, when it comes, changes not only the ground, but also sound.'
    ],
    noteZh: [
      '听一听世界能变得多么安静。',
      '雪到来时，改变的不只是地面，还有声音。'
    ],
    ritualNotes: [
      'Roasted sweet potato: Its warmth is felt immediately, from the hands to the body.'
    ],
    ritualNotesZh: [
      '红薯：是一种从手到胃都能感到暖意的冬日食物。'
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
    "田鼠化鹌鹑 — Burrowing animals retreat as birds become more active in the open fields.",
    "虹始见 — Rainbows appear as sunlight breaks through spring rain."
  ],
  guyu: [
    "萍始生 — Duckweed spreads as the water grows warmer.",
    "鸣鸠拂羽 — Cuckoos grow active as the air turns soft and damp.",
    "戴胜降桑 — Hoopoes appear in mulberry trees as late spring settles in."
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
    "伯劳始鸣 — Shrikes begin to call as the fields grow active with life.",
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
    "闭塞成冬 — The world closes inward as winter fully sets in."
  ],
  daxue: [
    "寒鸟不鸣 — Cold-weather birds fall silent as the air turns harsher.",
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
    "田鼠化鹌鹑 — Field mice yield to quails",
    "虹始见 — Rainbows appear"
  ],
  guyu: [
    "萍始生 — Duckweed grows",
    "鸣鸠拂羽 — Cuckoos preen",
    "戴胜降桑 — Hoopoes perch in mulberries"
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
    "伯劳始鸣 — Shrikes call",
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
