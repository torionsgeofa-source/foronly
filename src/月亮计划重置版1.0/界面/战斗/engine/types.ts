export type 罪孽名 = '暴怒' | '色欲' | '怠惰' | '暴食' | '忧郁' | '傲慢' | '嫉妒';
export type 攻击类型名 = '斩击' | '突刺' | '打击';
export type 硬币类型 = '普通' | '不可摧毁' | '截除' | '无我';
export type 阵营名 = '玩家' | '盟友' | '敌人';
export type 技能类别 = '攻击' | '守备';

export const 罪孽列表: 罪孽名[] = ['暴怒', '色欲', '怠惰', '暴食', '忧郁', '傲慢', '嫉妒'];
export const 攻击类型列表: 攻击类型名[] = ['斩击', '突刺', '打击'];
export const 硬币类型列表: 硬币类型[] = ['普通', '不可摧毁', '截除', '无我'];

export const 罪孽颜色: Record<罪孽名, string> = {
  暴怒: '#e04b3a',
  色欲: '#e05297',
  怠惰: '#e0a53a',
  暴食: '#4fb04f',
  忧郁: '#3aa0e0',
  傲慢: '#8a5de0',
  嫉妒: '#e0d23a',
};

export const 攻击类型颜色: Record<攻击类型名, string> = {
  斩击: '#d8d8d8',
  突刺: '#7fd4a0',
  打击: '#e0b06a',
};

export interface 硬币 {
  id: number;
  威力: number;
  类型: 硬币类型;
  正面: boolean;
  /** 被拼点击碎后不再计算, 也无法继续攻击 */
  已摧毁: boolean;
  /** 不可摧毁硬币失败后转为破裂: 威力固定为 1 */
  已破碎: boolean;
}

export interface 技能 {
  名称: string;
  罪孽: 罪孽名;
  攻击类型: 攻击类型名;
  基础威力: number;
  硬币威力: number[];
  硬币类型: 硬币类型[];
  攻击等级修正: number;
  攻击容量: number;
  效果: string;
  类别: 技能类别;
}

export interface 状态效果 {
  强度: number;
  层数: number;
}

export interface 战斗单位 {
  名称: string;
  阵营: 阵营名;
  身份: string;
  等级: number;
  生命值: number;
  生命上限: number;
  理智值: number;
  混乱值: number;
  混乱阈值: number;
  攻击等级: number;
  防御等级: number;
  速度: number;
  罪孽抗性: Record<string, number>;
  物理抗性: Record<string, number>;
  罪孽资源: Record<string, number>;
  状态效果: Record<string, 状态效果>;
  技能: Record<string, 技能>;
  是否玩家: boolean;
  已选技能: string | null;
  已选目标: string | null;
  /** 本回合是否已经行动过 (含作为拼点防守方被消耗) */
  已行动: boolean;
}

export interface 拼点硬币记录 {
  id: number;
  威力: number;
  类型: 硬币类型;
  正面: boolean;
  固定: boolean;
}

export interface 拼点回合记录 {
  回合数: number;
  左侧威力: number;
  右侧威力: number;
  左侧硬币: 拼点硬币记录[];
  右侧硬币: 拼点硬币记录[];
  结果: '左胜' | '右胜' | '平局';
  摧毁: { 方: '左' | '右'; 硬币id: number } | null;
  额外击碎: { 方: '左' | '右'; 硬币id: number } | null;
}

export interface 拼点结果 {
  左侧名称: string;
  右侧名称: string;
  左侧技能: string;
  右侧技能: string;
  胜者: '左' | '右' | '无';
  记录: 拼点回合记录[];
  左侧初始硬币: 硬币[];
  右侧初始硬币: 硬币[];
  左侧剩余硬币: 硬币[];
  右侧剩余硬币: 硬币[];
  左侧攻击等级加成: number;
  右侧攻击等级加成: number;
  左侧拼点威力加成: number;
  右侧拼点威力加成: number;
}

export interface 追加伤害记录 {
  名称: string;
  数值: number;
  类型: '固定' | '理智';
}

export interface 伤害明细 {
  目标: string;
  数值: number;
  暴击: boolean;
  罪孽: 罪孽名;
  攻击类型: 攻击类型名;
  静态: number;
  动态: number;
  追加: 追加伤害记录[];
}

export interface 命中结果 {
  来源: string;
  目标: string;
  技能: string;
  拼点?: 拼点结果;
  伤害: 伤害明细[];
  追加: 追加伤害记录[];
  文本: string;
  目标死亡: boolean;
  目标混乱: boolean;
}

export interface 战斗状态 {
  单位: 战斗单位[];
  回合: number;
  速度顺序: string[];
  当前行动者: string;
  行动指针: number;
  日志: string[];
  结束: null | '玩家胜' | '敌人胜';
}
