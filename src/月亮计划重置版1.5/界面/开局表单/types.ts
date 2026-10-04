import type { 技能编辑 } from '../共享/技能编辑';

export interface 装备槽表单 {
  名称: string;
  效果: string;
}

/**
 * 开局表单的技能卡片: 与技能库共用同一编辑模型 `技能编辑`,
 * 仅额外携带内部唯一 id `_id` 供 v-for 使用。
 */
export type 技能表单 = 技能编辑 & { _id: number };

export const 性别选项 = ['男', '女', '其他', '未知'];

export const 阶层选项 = ['普通', '稀有', '史诗', '传说', '神话'];

export const 罪孽列表 = ['暴怒', '色欲', '怠惰', '暴食', '忧郁', '傲慢', '嫉妒'];

export const 攻击类型列表 = ['斩击', '突刺', '打击'];

/** 生命成长表：生命上限 = 初始 + 成长 × 等级 + 生命加成 */
export const 阶层表: Record<string, { 初始: number; 成长: number }> = {
  普通: { 初始: 50, 成长: 5 },
  稀有: { 初始: 200, 成长: 10 },
  史诗: { 初始: 350, 成长: 17 },
  传说: { 初始: 500, 成长: 26 },
  神话: { 初始: 650, 成长: 37 },
};

export function 计算生命上限(阶层: string, 等级: number, 生命加成 = 0): number {
  const 条目 = 阶层表[阶层] ?? 阶层表['普通'];
  return Math.max(1, Math.round(条目.初始 + 条目.成长 * 等级 + 生命加成));
}

export const 罪孽颜色: Record<string, string> = {
  暴怒: '#e04b3a',
  色欲: '#e05297',
  怠惰: '#e0a53a',
  暴食: '#4fb04f',
  忧郁: '#3aa0e0',
  傲慢: '#8a5de0',
  嫉妒: '#e0d23a',
};


