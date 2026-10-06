import type { 技能库接口 } from './技能常量';

/**
 * 等待并读取共享的「技能库」全局接口。
 *
 * 注意: tavern_helper 的 `waitGlobalInitialized` 只返回 `void`(不是接口值) ——
 * 正确姿势是等待之后从**全局变量**读取接口(iframe 会在 `window` 上为其安装 getter)。
 * 之前误把它的返回值当接口 (`const api = await waitGlobalInitialized('技能库')`),
 * 结果 api 恒为 undefined, 导致技能库永远「未就绪」、自定义技能只存名字。
 */
export async function 取技能库全局(): Promise<技能库接口 | null> {
  try {
    await waitGlobalInitialized('技能库');
  } catch (e) {
    console.warn('[技能库] waitGlobalInitialized 失败', e);
  }
  return (window as unknown as { 技能库?: 技能库接口 }).技能库 ?? null;
}
