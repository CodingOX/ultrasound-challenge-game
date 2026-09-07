/**
 * 产前超声闯关大挑战 - 核心数据类型定义
 */

// 赛道分类
export type CategoryId = 'cardiac' | 'malformation' | 'structure';

export interface Category {
  id: CategoryId;
  title: string;
  subtitle: string;
  tag: string;
  icon: string;
  description: string;
}

// 难度等级定义 (1~5级)
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyConfig {
  level: DifficultyLevel;
  name: string;
  subName: string;
  badge: string;
  isPaid: boolean;
  price?: number;
  description: string;
}

// 题目定义
export interface Question {
  id: string;
  categoryId: CategoryId;
  level: DifficultyLevel;
  title: string;
  hint: string;
  // 超声切面视频或模拟流媒体地址
  videoUrl?: string;
  // 模拟切面类型 (如 4-Chamber, LVOT, Spine, Face)
  viewType: string;
  standardAnswer: string;
  aliases: string[]; // 别名/同义词匹配
  keywords?: string[]; // 核心关键词
  explanation: string;
}

// 答题记录条目
export interface AnswerRecord {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpentMs: number; // 耗时（毫秒）
  isSkipped: boolean; // 是否主动放弃
}

// 选手信息
export interface UserProfile {
  name: string;
  hospital: string;
  phone: string;
  hasCameraAuth: boolean;
  isRegistered: boolean;
}

// 证书评定等级
export type CertGrade = 'EXCELLENT' | 'GOOD' | 'PASS' | 'UNQUALIFIED';

export interface CertGradeInfo {
  grade: CertGrade;
  name: string;
  title: string;
  color: string;
  badgeUrl?: string;
  minScore: number;
  maxScore: number;
}

// 天梯榜记录条目
export interface LeaderboardEntry {
  rank: number;
  id: string;
  userName: string;
  hospital: string;
  score: number;
  timeSpentSec: number;
  date: string;
  avatar: string;
  level: DifficultyLevel;
  categoryId: CategoryId;
}

// 页面路由状态
export type PageStep = 
  | 'welcome'     // 第1页：欢迎页
  | 'category'    // 第2页：赛道与难度
  | 'register'    // 第3页：报名与监考
  | 'rules'       // 第4页：规则说明
  | 'quiz'        // 第5页：核心答题
  | 'result';     // 第6页：结算、天梯榜与证书
