import type { Category, CategoryId, DifficultyConfig, DifficultyLevel, Question } from '../types';
import realUltrasoundVideo from '../assets/videos/real_ultrasound_berry.mp4';

export const DEFAULT_REAL_ULTRASOUND_VIDEO = realUltrasoundVideo;

// 三大赛道定义
export const CATEGORIES: Category[] = [
  {
    id: 'cardiac',
    title: '心脏筛查',
    subtitle: '心之所向·精准辨识',
    tag: '四腔心/流出道/大动脉',
    icon: 'HeartPulse',
    description: '考察胎儿心脏四腔心、左右室流出道、三血管气管切面等核心复杂结构异常识别。',
  },
  {
    id: 'malformation',
    title: '畸形诊断',
    subtitle: '比比谁最会诊断？',
    tag: '神经/骨骼/胸腹罕见畸形',
    icon: 'Brain',
    description: '涵盖全前脑、脊柱裂、致死性骨发育不良、前腹壁缺损等高难度胎儿畸形病例鉴别。',
  },
  {
    id: 'structure',
    title: '结构识别',
    subtitle: '看谁最会识别结构？',
    tag: '标准切面解剖与标志物',
    icon: 'Layers',
    description: '快速定位并识别丘脑、透明隔腔、小脑蚓部、胃泡、双肾及脐带等关键解剖结构。',
  },
];

// 五阶难度配置
export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    level: 1,
    name: '1级 · 见习探头',
    subName: '基础标准切面',
    badge: 'Novice',
    isPaid: false,
    description: '适合新手与见习医师，考察常规易辨识切面与典型正常/异常结构。',
  },
  {
    level: 2,
    name: '2级 · 初阶医师',
    subName: '常见异常筛查',
    badge: 'Apprentice',
    isPaid: false,
    description: '涵盖临床最常见的结构畸形与切面变异，要求具备基础鉴别能力。',
  },
  {
    level: 3,
    name: '3级 · 骨干能手',
    subName: '进阶综合判读',
    badge: 'Specialist',
    isPaid: false,
    description: '涉及多切面联动判读与中等复杂畸形鉴别，考验扫查功底。',
  },
  {
    level: 4,
    name: '4级 · 副高先锋',
    subName: '罕见高难度挑战',
    badge: 'Expert',
    isPaid: true,
    price: 39.9,
    description: '【高阶付费关卡】精选临床疑难罕见病例切面，对标副高级职称考核。',
  },
  {
    level: 5,
    name: '5级 · 专家大师',
    subName: '殿堂级巅峰竞技',
    badge: 'Master',
    isPaid: true,
    price: 69.9,
    description: '【大师付费关卡】极微细结构与复合型罕见出生缺陷，超声大咖专属对决。',
  },
];

// 核心超声题库数据池
export const QUESTION_POOL: Question[] = [
  // ================= 心脏筛查赛道 =================
  {
    id: 'cardiac-101',
    categoryId: 'cardiac',
    level: 1,
    title: '请观察该胎儿心脏主动脉弓与主肺动脉动态扫查，诊断该复合畸形：',
    hint: '主肺动脉窗伴主动脉弓连续性中断征象',
    videoUrl: './videos/real_ultrasound_berry.mp4',
    viewType: '主动脉弓与三血管切面动态扫查',
    standardAnswer: 'Berry综合征',
    aliases: ['主肺动脉窗', '主动脉弓离断', 'Berry', 'Berry综合征', 'Berry syndrome', '左上腔静脉'],
    keywords: ['Berry', '主肺动脉窗'],
    explanation: 'Berry综合征经典表现：远端主肺动脉窗合并A型主动脉弓离断，常伴左上腔静脉永存。',

  },
  {
    id: 'cardiac-102',
    categoryId: 'cardiac',
    level: 1,
    title: '动态扫查显示左心室较右心室显著狭小，主动脉瓣回声增强闭锁，诊断为：',
    hint: '左心系统发育极差',
    viewType: '左室长轴切面 (LVOT View)',
    standardAnswer: '左心发育不良综合征',
    aliases: ['左心发育不良', 'HLHS', '左室发育不良综合征'],
    keywords: ['左心', '发育不良'],
    explanation: '左室腔明显缩小，主动脉弓发育不良或闭锁。',
  },
  {
    id: 'cardiac-201',
    categoryId: 'cardiac',
    level: 2,
    title: '三血管气管切面（3VT）显示肺动脉与主动脉呈“平行排列”而非交叉，诊断为：',
    hint: '两大动脉空间解剖关系异常',
    viewType: '三血管气管切面 (3VT View)',
    standardAnswer: '完全型大动脉转位',
    aliases: ['大动脉转位', 'TGA', '完全性大动脉转位', 'd-TGA'],
    keywords: ['大动脉', '转位'],
    explanation: '主动脉起自右心室，肺动脉起自左心室，大血管走形失去正常交叉。',
  },
  {
    id: 'cardiac-301',
    categoryId: 'cardiac',
    level: 3,
    title: '超声切面显示主动脉骑跨于室间隔之上，伴肺动脉狭窄及右室壁增厚，诊断为：',
    hint: '经典紫绀型先天性心脏病四联改变',
    viewType: '右室流出道切面 (RVOT View)',
    standardAnswer: '法洛四联症',
    aliases: ['法四', 'TOF', '法洛氏四联症', '法洛四联征'],
    keywords: ['法洛', '四联'],
    explanation: '包含室间隔缺损、主动脉骑跨、肺动脉狭窄、右心室肥厚。',
  },
  {
    id: 'cardiac-401',
    categoryId: 'cardiac',
    level: 4,
    title: '房室交界区十字交叉结构消失，共用单组房室瓣口，伴原发孔房缺与流入道室缺，诊断为：',
    hint: '心内膜垫未完全融合',
    viewType: '房室瓣水平横切面 (AV Canal)',
    standardAnswer: '完全性心内膜垫缺损',
    aliases: ['心内膜垫缺损', '完全型房室间隔缺损', 'CAVSD', '房室间隔缺损', 'AVSD'],
    keywords: ['心内膜垫', '缺损'],
    explanation: '十字交叉消失，共同房室瓣口，原发孔ASD伴流入道VSD。',
  },
  {
    id: 'cardiac-501',
    categoryId: 'cardiac',
    level: 5,
    title: '三尖瓣隔瓣及后瓣附着点明显下移向心尖部，右心房巨大伴“房化右室”，诊断为：',
    hint: '三尖瓣下移畸形',
    viewType: '心尖四腔心切面 (Apical 4CH)',
    standardAnswer: '埃泼斯坦畸形',
    aliases: ['Ebstein畸形', '三尖瓣下移畸形', '埃布斯坦畸形', 'Ebstein anomaly'],
    keywords: ['埃泼斯坦', '三尖瓣下移'],
    explanation: '三尖瓣瓣叶下移附着于右心室壁，右房极度扩大伴房化右室。',
  },

  // ================= 畸形诊断赛道 =================
  {
    id: 'malform-101',
    categoryId: 'malformation',
    level: 1,
    title: '胎儿颅脑横切面显示颅骨光环缺失，脑组织暴露于羊水中呈“蛙眼征”，诊断为：',
    hint: '最常见的神经管缺陷',
    viewType: '胎儿颜面及颅脑矢状切面',
    standardAnswer: '无脑儿',
    aliases: ['无脑畸形', '露脑畸形', 'Anencephaly'],
    keywords: ['无脑'],
    explanation: '颅骨穹窿缺如，脑组织变性外露，眼眶突出呈典型蛙眼外观。',
  },
  {
    id: 'malform-201',
    categoryId: 'malformation',
    level: 2,
    title: '脊柱矢状切面显示腰骶段双排强回声骨化中心分叉呈“V”字形，局部向外膨出囊性包块，诊断为：',
    hint: '开放性脊柱异常',
    viewType: '脊柱矢状及冠状切面',
    standardAnswer: '脊柱裂',
    aliases: ['开放性脊柱裂', '脊膜膨出', '脊髓脊膜膨出', 'Spina Bifida'],
    keywords: ['脊柱裂'],
    explanation: '后弓骨化中心间距增宽，皮肤连续性中断伴囊样膨出。',
  },
  {
    id: 'malform-301',
    categoryId: 'malformation',
    level: 3,
    title: '颅脑切面显示双侧侧脑室融合为单一脑室，丘脑融合，大脑镰缺失，诊断为：',
    hint: '前脑未裂开形成两半球',
    viewType: '颅脑经丘脑横切面',
    standardAnswer: '全前脑',
    aliases: ['全前脑畸形', '前脑无裂畸形', 'Holoprosencephaly', 'HPE'],
    keywords: ['全前脑', '前脑无裂'],
    explanation: '大脑未分化为左右半球，单脑室，丘脑融合。',
  },
  {
    id: 'malform-401',
    categoryId: 'malformation',
    level: 4,
    title: '四肢长骨极度短小弯曲（电话听筒征），胸廓狭窄呈钟形，颅骨三叶草样变，诊断为：',
    hint: '最常见的致死性骨发育异常',
    viewType: '股骨与全身骨骼扫查',
    standardAnswer: '致死性侏儒',
    aliases: ['致死性骨发育不全', '致死性软骨发育不全', 'Thanatophoric Dysplasia', 'TD'],
    keywords: ['致死性', '骨发育不全'],
    explanation: '长骨严重短缩弯曲，胸腔容积严重受限导致肺发育不良。',
  },
  {
    id: 'malform-501',
    categoryId: 'malformation',
    level: 5,
    title: '腹壁脐带入口右侧见全层腹壁缺损，肠管等脏器脱出漂浮于羊水中，无疝囊包裹，诊断为：',
    hint: '与脐膨出相鉴别的腹壁畸形',
    viewType: '腹部横切面及脐带入口',
    standardAnswer: '腹裂',
    aliases: ['腹裂畸形', 'Gastroschisis', '先天性腹壁裂'],
    keywords: ['腹裂'],
    explanation: '缺损多位于脐带右侧，游离肠管暴露无外膜覆盖。',
  },

  // ================= 结构识别赛道 =================
  {
    id: 'struct-101',
    categoryId: 'structure',
    level: 1,
    title: '请识别经丘脑横切面中，双侧额角前方呈方形或圆形的无回声结构：',
    hint: '评价颅脑中线发育的关键标志物',
    viewType: '经丘脑横切面 (Trans-thalamic View)',
    standardAnswer: '透明隔腔',
    aliases: ['CSP', '第五脑室', '透明隔', 'Cave of septum pellucidum'],
    keywords: ['透明隔腔', 'CSP'],
    explanation: '透明隔腔是中孕期胎儿中线神经系统发育的重要声像学标志。',
  },
  {
    id: 'struct-201',
    categoryId: 'structure',
    level: 2,
    title: '在胎儿颅脑小脑横切面上，连接左右小脑半球的高回声结构为：',
    hint: '小脑中线结构',
    viewType: '经小脑横切面 (Trans-cerebellar View)',
    standardAnswer: '小脑蚓部',
    aliases: ['小脑蚓', 'Cerebellar Vermis', '蚓部'],
    keywords: ['小脑蚓'],
    explanation: '小脑蚓部缺损或向上旋转是 Dandy-Walker 畸形的重要征象。',
  },
  {
    id: 'struct-301',
    categoryId: 'structure',
    level: 3,
    title: '在胎儿上腹部标准腹围切面中，门静脉左支与腹侧脐静脉汇合处形成形似“J”或“C”字形的管道为：',
    hint: '测量腹围必须确认的标志性静脉结构',
    viewType: '腹围切面 (Abdominal Circumference)',
    standardAnswer: '门静脉窦',
    aliases: ['门静脉左支', '脐静脉门静脉窦', 'Portal Sinus'],
    keywords: ['门静脉窦', '门静脉'],
    explanation: '标准AC切面应显示胃泡、脊柱及门静脉窦，门静脉窦呈下勾状指向右侧。',
  },
  {
    id: 'struct-401',
    categoryId: 'structure',
    level: 4,
    title: '在胎儿腹部冠状/斜矢状切面上，连接脐静脉与下腔静脉、内径较窄呈高速血流通道的结构是：',
    hint: '胎儿血液循环中的重要分流通路',
    viewType: '静脉导管矢状切面 (Ductus Venosus)',
    standardAnswer: '静脉导管',
    aliases: ['DV', 'Ductus Venosus'],
    keywords: ['静脉导管'],
    explanation: '静脉导管是含氧量最高的动脉血直接注入下腔静脉的重要通路。',
  },
  {
    id: 'struct-501',
    categoryId: 'structure',
    level: 5,
    title: '在胎儿正中矢状切面上，连接两大脑半球呈“C”形拱桥状的低回声纤维板结构为：',
    hint: '大脑最大联络纤维束',
    viewType: '颅脑正中矢状切面 (Median Sagittal)',
    standardAnswer: '胼胝体',
    aliases: ['Corpus Callosum', 'CC'],
    keywords: ['胼胝体'],
    explanation: '胼胝体发育不全是胎儿中枢神经系统常见畸形之一。',
  },
];

// 核心要求：题库中所有题目均统一使用真实 Berry 综合征超声切面视频作为标准模板
QUESTION_POOL.forEach((q) => {
  q.videoUrl = DEFAULT_REAL_ULTRASOUND_VIDEO;
});

/**
 * 根据赛道与难度抽取题目（10道题）
 * 若池子不足则智能混合同赛道临近难度，确保挑战趣味与丰富度
 */
export function getQuestionsForQuiz(categoryId: CategoryId, level: DifficultyLevel, count: number = 10): Question[] {
  // 优先取本赛道 + 本难度题目
  const exact = QUESTION_POOL.filter((q) => q.categoryId === categoryId && q.level === level);
  // 同赛道其他难度
  const sameCategory = QUESTION_POOL.filter((q) => q.categoryId === categoryId && q.level !== level);
  // 全局备选
  const otherCategory = QUESTION_POOL.filter((q) => q.categoryId !== categoryId);

  // 乱序打乱
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const combined = [
    ...shuffle(exact),
    ...shuffle(sameCategory),
    ...shuffle(otherCategory),
  ];

  return combined.slice(0, count).map((q) => ({
    ...q,
    videoUrl: DEFAULT_REAL_ULTRASOUND_VIDEO,
  }));
}

