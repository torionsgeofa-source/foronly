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
  全部(): Record<string, 技能定义>;
  内存列表(): 技能定义[];
  增(名: string, 定义: 技能定义): void;
  改(名: string, 定义: 技能定义): void;
}

let 共享技能库: 技能库接口 | null = null;

export function 绑定技能库(api: 技能库接口 | null): void {
  共享技能库 = api;
}

export function 技能库就绪(): boolean {
  return 共享技能库 !== null;
}

export function 查技能(名: string): 技能定义 | undefined {
  return 共享技能库?.查(名);
}

export function 全部技能(): 技能定义[] {
  return 共享技能库?.内存列表() ?? [];
}

/**
 * 将自定义技能写入技能库 (存在则覆盖, 否则新增)。
 * 技能库未就绪时返回 false, 由调用方决定降级处理。
 */
export function 写入技能(名: string, 定义: 技能定义): boolean {
  if (!共享技能库 || !名) return false;
  if (共享技能库.查(名)) 共享技能库.改(名, 定义);
  else 共享技能库.增(名, 定义);
  return true;
}
