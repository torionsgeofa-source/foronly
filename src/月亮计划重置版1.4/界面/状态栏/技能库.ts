export interface 技能定义 {
  名称: string;
  类别: string;
  罪孽?: string;
  攻击类型?: string;
  守备类型?: string;
  时机?: string;
  条件?: string;
  基础威力?: number;
  硬币威力?: number[];
  硬币?: { 威力: number }[];
  攻击等级修正?: number;
  攻击容量?: number;
  效果?: string;
  SP消耗?: number;
}

export interface 技能库接口 {
  查(名: string): 技能定义 | undefined;
}

let 共享技能库: 技能库接口 | null = null;

export function 绑定技能库(api: 技能库接口 | null): void {
  共享技能库 = api;
}

export function 查技能(名: string): 技能定义 | undefined {
  return 共享技能库?.查(名);
}
