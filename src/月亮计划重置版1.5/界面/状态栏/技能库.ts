/**
 * 状态栏技能查询层: 类型统一复用 `界面/共享/技能常量.ts`, 仅保留最小查询接口与响应式绑定。
 */
import type { 技能定义 } from '../共享/技能常量';

export type { 技能定义, 技能效果, 效果目标, 战斗技能硬币 } from '../共享/技能常量';

export interface 技能库接口 {
  查(角色: string, 技能名: string): 技能定义 | undefined;
}

/**
 * 响应式持有技能库共享接口: 界面挂载时技能库可能尚未就绪,
 * 绑定后 `.value` 变化会自动触发依赖它的 computed (技能面板)。
 */
export const 共享技能库 = shallowRef<技能库接口 | null>(null);

export function 绑定技能库(api: 技能库接口 | null): void {
  共享技能库.value = api;
}

export function 查技能(角色: string, 名: string): 技能定义 | undefined {
  return 共享技能库.value?.查(角色, 名);
}
