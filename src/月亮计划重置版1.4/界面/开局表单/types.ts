export interface 装备槽表单 {
  名称: string;
  效果: string;
}

export interface 技能表单 {
  _id: number;
  名称: string;
  罪孽: string;
  攻击类型: string;
  类别: string;
  时机: string;
  条件: string;
  守备类型: string;
  基础威力: string;
  硬币威力: string;
  攻击等级修正: string;
  攻击容量: string;
  SP消耗: string;
  效果: string;
}

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

export const 罪孽选项 = ['无', '暴怒', '色欲', '怠惰', '暴食', '忧郁', '傲慢', '嫉妒'];

export const 攻击类型选项 = ['斩击', '突刺', '打击'];

export const 技能类别选项 = ['战斗', '守备', '被动', '支援', 'EGO'];

export const 时机选项 = ['战斗开始时', '回合开始时', '回合结束时', '命中时', '受击时', '击杀时', '常驻'];

export const 守备类型选项 = ['闪避', '防御', '强化防御', '反击', '强化反击'];

export const 罪孽颜色: Record<string, string> = {
  暴怒: '#e04b3a',
  色欲: '#e05297',
  怠惰: '#e0a53a',
  暴食: '#4fb04f',
  忧郁: '#3aa0e0',
  傲慢: '#8a5de0',
  嫉妒: '#e0d23a',
};

export function 解析硬币威力(文本: string): { 列表: number[]; 错误: string } {
  const 令牌 = 文本.split(/[,\s，、;；/|]+/).filter(Boolean);
  const 列表: number[] = [];
  for (const 项 of 令牌) {
    const 数 = Number(项);
    if (!Number.isFinite(数)) {
      return { 列表: [], 错误: `硬币威力「${项}」不是有效数字` };
    }
    列表.push(数);
  }
  return { 列表, 错误: '' };
}
