/**
 * 技能定义 / 技能库接口 / 技能效果 / 效果目标 统一复用 `界面/共享/技能常量.ts` 的权威类型,
 * 归一化角色键也统一从该模块导入, 消除与技能库界面 / 战斗 bridge 之间的重复实现。
 */
import type { 技能定义, 技能库接口 } from '../共享/技能常量';
import { 归一化角色键 } from '../共享/技能常量';

export type { 技能定义, 技能库接口, 技能效果, 效果目标 } from '../共享/技能常量';
export { 归一化角色键 };

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
