import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { 绑定技能库, type 技能库接口 } from './engine/units';

async function 等待技能库(超时 = 3000): Promise<技能库接口 | null> {
  try {
    const 结果 = await Promise.race([
      waitGlobalInitialized<技能库接口>('技能库'),
      new Promise<null>(r => setTimeout(() => r(null), 超时)),
    ]);
    if (!结果) console.warn('[技能库] 未在超时内初始化，已降级（界面照常挂载，仅技能库功能不可用）');
    return 结果 ?? null;
  } catch (e) {
    console.warn('[技能库] 初始化失败，已降级', e);
    return null;
  }
}

function ensureDomGlobals(): void {
  const g = window as unknown as Record<string, unknown>;
  try {
    if (typeof g.SVGElement !== 'function') {
      g.SVGElement = typeof g.Element === 'function' ? class SVGElement extends (g.Element as typeof Element) {} : class SVGElement {};
    }
    if (typeof g.MathMLElement !== 'function') {
      g.MathMLElement = class MathMLElement {};
    }
    console.info('[TH环境] SVGElement=%s MathMLElement=%s Element=%s', typeof g.SVGElement, typeof g.MathMLElement, typeof g.Element);
  } catch (e) {
    console.warn('[TH环境] DOM 全局检测失败', e);
  }
}

$(() => {
  errorCatched(async () => {
    ensureDomGlobals();
    await waitGlobalInitialized('Mvu');
    绑定技能库(await 等待技能库());
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'), { timeout: 3000 }).catch(() =>
      console.warn('[MVU] stat_data 未及时就绪，先以默认值挂载（随后会自动同步）'),
    );
    createApp(App).use(createPinia()).mount('#app');
    console.info('[战斗面板] 已挂载');
  })();
});
