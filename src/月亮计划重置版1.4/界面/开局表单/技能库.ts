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
  硬币类型?: string[];
  硬币?: { 威力: number; 类型?: string }[];
  攻击等级修正?: number;
  攻击容量?: number;
  效果?: string;
  SP消耗?: number;
  所属?: string;
}

export interface 技能库接口 {
  查(角色: string, 技能名: string): 技能定义 | undefined;
  角色列表(): string[];
  角色技能(角色: string): Record<string, 技能定义>;
  增(角色: string, 技能名: string, 定义: 技能定义): void;
  改(角色: string, 技能名: string, 定义: 技能定义): void;
  删(角色: string, 技能名: string): void;
  删角色(角色: string): void;
}

/**
 * 响应式持有技能库共享接口: 界面挂载时技能库可能尚未就绪,
 * 绑定后 `.value` 变化会自动触发依赖它的 computed (技能回填等)。
 */
export const 共享技能库 = shallowRef<技能库接口 | null>(null);

export function 绑定技能库(api: 技能库接口 | null): void {
  共享技能库.value = api;
}

export function 技能库就绪(): boolean {
  return 共享技能库.value !== null;
}

export function 查技能(角色: string, 名: string): 技能定义 | undefined {
  return 共享技能库.value?.查(角色, 名);
}

export function 角色技能列表(角色: string): 技能定义[] {
  const 表 = 共享技能库.value?.角色技能(角色) ?? {};
  return Object.values(表);
}

/**
 * 将自定义技能写入技能库指定角色 (存在则覆盖, 否则新增)。
 * 技能库未就绪时返回 false, 由调用方决定降级处理。
 */
export function 写入技能(角色: string, 名: string, 定义: 技能定义): boolean {
  if (!共享技能库.value || !角色 || !名) return false;
  if (共享技能库.value.查(角色, 名)) 共享技能库.value.改(角色, 名, 定义);
  else 共享技能库.value.增(角色, 名, 定义);
  return true;
}
