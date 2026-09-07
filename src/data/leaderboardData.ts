import type { CategoryId, DifficultyLevel, LeaderboardEntry } from '../types';

const STORAGE_KEY = 'ultrasound_game_leaderboard_v2';


// 知名妇产与超声医学中心样例库
const HOSPITALS = [
  '北京协和医院超声医学科',
  '复旦大学附属妇产科医院',
  '四川大学华西第二医院',
  '浙江大学医学院附属妇产科医院',
  '广州市妇女儿童医疗中心',
  '武汉同济医院超声科',
  '山东大学齐鲁医院',
  '中南大学湘雅二医院',
  '南京市妇幼保健院',
  '广东省妇幼保健院',
  '上海交通大学医学院附属新华医院',
  '中国医科大学附属盛京医院',
];

const DOCTORS = [
  '吴桂芳', '张建国', '林晓峰', '陈雨婷', '王馨怡',
  '刘嘉铭', '赵若冰', '孙浩然', '周子轩', '吴佩珊',
  '郑天成', '徐梦洁', '朱梓豪', '郭雅文', '宋佳琪',
  '李志勇', '黄海燕', '杨晨曦', '何明翰', '罗文婷'
];

/**
 * 姓名脱敏算法 (如: 吴*芳, 张*, 诸**明)
 */
export function maskUserName(name: string): string {
  if (!name) return '匿名*';
  // 去除可能携带的医师/博士后缀
  const clean = name.trim().split(' ')[0];
  const len = clean.length;
  if (len <= 1) {
    return `${clean}*`;
  }
  if (len === 2) {
    return `${clean[0]}*`;
  }
  if (len === 3) {
    return `${clean[0]}*${clean[2]}`;
  }
  // 4字及以上保留首尾，中间打星号
  const middleStars = '*'.repeat(len - 2);
  return `${clean[0]}${middleStars}${clean[len - 1]}`;
}

/**
 * 初始生成 Top 100 天梯榜初始数据（用于各赛道和难度）
 */
function generateSeedLeaderboard(categoryId: CategoryId, level: DifficultyLevel): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  
  // 难度越高，平均耗时与分数梯度更陡峭
  for (let i = 1; i <= 100; i++) {
    // 得分梯度：第1-15名 100分，16-45名 90分，46-75名 80分，76-100名 70分
    let score = 70;
    if (i <= 15) score = 100;
    else if (i <= 45) score = 90;
    else if (i <= 75) score = 80;

    // 耗时梯度：从 28.5s 到 120.0s 逐渐增加
    const baseTime = 25 + (i * 0.95) + Number((Math.random() * 1.5).toFixed(1));

    const doc = DOCTORS[(i * 3 + level * 5) % DOCTORS.length];
    const hosp = HOSPITALS[(i * 2 + level * 7) % HOSPITALS.length];

    entries.push({
      rank: i,
      id: `seed-${categoryId}-${level}-${i}`,
      userName: maskUserName(doc), // 精密脱敏 (如 吴*芳)
      hospital: hosp,
      score,
      timeSpentSec: Number(baseTime.toFixed(1)),
      date: '2026-09-07',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${categoryId}-${level}-${i}`,
      level,
      categoryId,
    });
  }


  // 严格按 分数降序 -> 用时升序 排列并纠正 rank
  return sortAndRank(entries);
}

function sortAndRank(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score; // 分数高的在前
    }
    return a.timeSpentSec - b.timeSpentSec; // 耗时短的在前
  });

  return sorted.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

/**
 * 获取指定赛道与难度的 Top 100 天梯榜
 */
export function getLeaderboard(categoryId: CategoryId, level: DifficultyLevel): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${categoryId}_${level}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to parse leaderboard from storage', e);
  }

  // 若无缓存，生成初始数据并保存
  const seed = generateSeedLeaderboard(categoryId, level);
  saveLeaderboard(categoryId, level, seed);
  return seed;
}

function saveLeaderboard(categoryId: CategoryId, level: DifficultyLevel, data: LeaderboardEntry[]) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${categoryId}_${level}`, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

export interface SubmitResultInfo {
  rank: number | null; // null 表示未进入前 100
  isTop100: boolean;
  estimatedRank: number; // 估算的全服排名
  diffScoreToTop100: number; // 距离第100名的分差
  diffTimeSecToTop100: number; // 距离第100名的时间差
  encouragementText: string;
}

/**
 * 插入选手的新挑战记录到天梯榜
 */
export function submitChallengeRecord(
  categoryId: CategoryId,
  level: DifficultyLevel,
  record: {
    userName: string;
    hospital: string;
    score: number;
    timeSpentSec: number;
  }
): SubmitResultInfo {
  const currentList = getLeaderboard(categoryId, level);

  const newEntry: LeaderboardEntry = {
    rank: 0,
    id: `user-${Date.now()}`,
    userName: maskUserName(record.userName),
    hospital: record.hospital,
    score: record.score,
    timeSpentSec: Number(record.timeSpentSec.toFixed(1)),
    date: new Date().toISOString().split('T')[0],
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${record.userName}`,

    level,
    categoryId,
  };

  const combined = [...currentList, newEntry];
  const reRanked = sortAndRank(combined);

  // 找到该用户排名的位置
  const myIndex = reRanked.findIndex((item) => item.id === newEntry.id);
  const myRank = myIndex + 1;

  if (myRank <= 100) {
    // 成功上榜 Top 100！更新持久化（保留前100）
    saveLeaderboard(categoryId, level, reRanked.slice(0, 100));
    return {
      rank: myRank,
      isTop100: true,
      estimatedRank: myRank,
      diffScoreToTop100: 0,
      diffTimeSecToTop100: 0,
      encouragementText: `🎉 恭喜晋级天梯榜！当前荣誉排位：第 ${myRank} 名！巅峰对决，光芒万丈！`,
    };
  } else {
    // 暂未上榜（在第 100 名以外）
    const rank100 = reRanked[99]; // 第 100 名的成绩
    const diffScore = Math.max(0, rank100.score - record.score);
    const diffTime = Number(Math.max(0, record.timeSpentSec - rank100.timeSpentSec).toFixed(1));

    return {
      rank: null,
      isTop100: false,
      estimatedRank: myRank,
      diffScoreToTop100: diffScore,
      diffTimeSecToTop100: diffTime,
      encouragementText: `💡 暂未上榜（当前全服估算：第 ${myRank} 名）—— 距离前 100 榜首仅差 ${diffScore > 0 ? `${diffScore}分` : ''}${diffTime > 0 ? ` ${diffTime}秒` : ''}！手感已火热，立即发起下一次冲击！`,
    };
  }
}
