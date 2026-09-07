import type { CertGradeInfo, Question } from '../types';

/**
 * 文本清洗与归一化
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s\-_，。、；：;:,!?！？（）()【】[\]]/g, '')
    .replace(/[“”"']/g, '');
}

/**
 * 智能判分函数
 * 支持精准匹配、同义词库别名匹配、核心关键词命中
 */
export function evaluateAnswer(userAnswer: string, question: Question): boolean {
  if (!userAnswer || !userAnswer.trim()) {
    return false;
  }

  const cleanUser = normalizeText(userAnswer);
  const cleanStandard = normalizeText(question.standardAnswer);

  // 1. 完全或清洗后匹配标准答案
  if (cleanUser === cleanStandard) {
    return true;
  }

  // 2. 命中别名列表中的任意一个
  for (const alias of question.aliases) {
    if (cleanUser === normalizeText(alias)) {
      return true;
    }
  }

  // 3. 关键词匹配 (若定义了关键词，且用户答案包含了全部必须关键词)
  if (question.keywords && question.keywords.length > 0) {
    const allKeywordsMatched = question.keywords.every((kw) =>
      cleanUser.includes(normalizeText(kw))
    );
    if (allKeywordsMatched) {
      return true;
    }
  }

  return false;
}

/**
 * 证书评级计算 (满分 100 分)
 * ≥ 85: 优秀
 * 75 ~ 84: 良好
 * 60 ~ 74: 合格
 * < 60: 未达标
 */
export function getCertGrade(score: number): CertGradeInfo {
  if (score >= 85) {
    return {
      grade: 'EXCELLENT',
      name: '卓越优秀',
      title: '卓越',
      color: '#f59e0b', // 琥珀金
      minScore: 85,
      maxScore: 100,
    };
  }
  if (score >= 75) {
    return {
      grade: 'GOOD',
      name: '良好佳绩',
      title: '良好',
      color: '#06b6d4', // 科技青
      minScore: 75,
      maxScore: 84,
    };
  }
  if (score >= 60) {
    return {
      grade: 'PASS',
      name: '合格达标',
      title: '合格',
      color: '#10b981', // 翡翠绿
      minScore: 60,
      maxScore: 74,
    };
  }
  return {
    grade: 'UNQUALIFIED',
    name: '暂未达标',
    title: '未达标',
    color: '#ef4444', // 警示红
    minScore: 0,
    maxScore: 59,
  };
}

/**
 * 趣味医学彩蛋称号计算
 */
export function getFunTitles(score: number, avgTimeSec: number): string[] {
  const titles: string[] = [];

  if (score === 100) {
    titles.push('一目了然·超声圣手');
  }
  if (avgTimeSec <= 6 && score >= 70) {
    titles.push('闪电神眼·快枪手');
  }
  if (score >= 85 && avgTimeSec <= 8) {
    titles.push('火眼金睛·产超宗师');
  }
  if (score >= 60 && titles.length === 0) {
    titles.push('稳健探头·实战先锋');
  }
  if (score < 60) {
    titles.push('无畏勇者·蓄力破局');
  }

  return titles;
}

/**
 * 格式化秒数
 */
export function formatTime(seconds: number): string {
  return `${seconds.toFixed(1)}s`;
}
