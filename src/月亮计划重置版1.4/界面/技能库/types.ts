export type 罪孽名 = '暴怒' | '色欲' | '怠惰' | '暴食' | '忧郁' | '傲慢' | '嫉妒';
export type 攻击类型名 = '斩击' | '突刺' | '打击';
export type 硬币类型 = '普通' | '不可摧毁' | '截除' | '无我';
export type 技能类别 = '战斗' | '守备' | '被动' | '支援' | 'EGO';
export type 守备类型名 = '闪避' | '防御' | '强化防御' | '反击' | '强化反击';
export type 技能时机 = '战斗开始时' | '回合开始时' | '回合结束时' | '命中时' | '受击时' | '击杀时' | '常驻';

export type 数值调整 = { 生命?: number; SP?: number; 攻击等级?: number; 防御等级?: number };

export type 技能效果 =
  | { type: '施加状态'; 状态: string; 强度?: number; 层数?: number }
  | { type: '调整数值'; 数值: 数值调整 }
  | { type: '震颤引爆' }
  | { type: '获得护盾'; 数值: number }
  | { type: '条件增伤'; 条件: string; 数值: number };

export interface 战斗技能硬币 {
  威力: number;
  类型: 硬币类型;
  命中效果?: 技能效果[];
}

export interface 技能定义 {
  名称: string;
  类别: 技能类别;
  罪孽?: 罪孽名;
  攻击类型?: 攻击类型名;
  守备类型?: 守备类型名;
  时机?: 技能时机;
  条件?: string;
  基础威力?: number;
  硬币威力?: number[];
  硬币类型?: 硬币类型[];
  硬币?: 战斗技能硬币[];
  攻击等级修正?: number;
  攻击容量?: number;
  效果?: string;
  SP消耗?: number;
  effects?: 技能效果[];
  所属?: string;
}

/** 角色名 -> (技能名 -> 技能定义) */
export type 技能库数据 = Record<string, Record<string, 技能定义>>;

export interface 技能库接口 {
  查(角色: string, 技能名: string): 技能定义 | undefined;
  全部(): 技能库数据;
  角色列表(): string[];
  角色技能(角色: string): Record<string, 技能定义>;
  增角色(角色: string): void;
  增(角色: string, 技能名: string, 定义: 技能定义): void;
  改(角色: string, 技能名: string, 定义: 技能定义): void;
  删(角色: string, 技能名: string): void;
  删角色(角色: string): void;
  导入(json: string): void;
  导出(角色?: string): string;
  重置(): void;
}

export const 罪孽选项 = ['暴怒', '色欲', '怠惰', '暴食', '忧郁', '傲慢', '嫉妒'];
export const 攻击类型选项 = ['斩击', '突刺', '打击'];
export const 类别选项: 技能类别[] = ['战斗', '守备', '被动', '支援', 'EGO'];
export const 守备类型选项 = ['闪避', '防御', '强化防御', '反击', '强化反击'];
export const 时机选项 = ['战斗开始时', '回合开始时', '回合结束时', '命中时', '受击时', '击杀时', '常驻'];
export const 硬币类型选项: 硬币类型[] = ['普通', '不可摧毁', '截除', '无我'];

export const 罪孽颜色: Record<string, string> = {
  暴怒: '#e04b3a',
  色欲: '#e05297',
  怠惰: '#e0a53a',
  暴食: '#4fb04f',
  忧郁: '#3aa0e0',
  傲慢: '#8a5de0',
  嫉妒: '#e0d23a',
};

/** 依据模板与用户输入, 创建一份可编辑的技能草稿 (深拷贝) */
export function 建草稿(定义?: 技能定义): 技能定义 {
  if (!定义) {
    return { 名称: '', 类别: '战斗', 罪孽: '暴怒', 攻击类型: '打击', 基础威力: 0, 硬币: [], 攻击等级修正: 0, 攻击容量: 1, 效果: '' };
  }
  return klona(定义);
}

/** 将 硬币 派生字段与现有 硬币威力 / 硬币类型 数组同步 */
export function 规范化硬币(定义: 技能定义): 战斗技能硬币[] {
  if (Array.isArray(定义.硬币) && 定义.硬币.length) {
    return 定义.硬币.map((项, 下标) => ({
      威力: 项.威力 ?? 定义.硬币威力?.[下标] ?? 0,
      类型: 项.类型 ?? 定义.硬币类型?.[下标] ?? '普通',
      命中效果: 项.命中效果,
    }));
  }
  const 威力表 = 定义.硬币威力 ?? [];
  const 类型表 = 定义.硬币类型 ?? [];
  return 威力表.map((威力, 下标) => ({ 威力, 类型: 类型表[下标] ?? '普通' }));
}
