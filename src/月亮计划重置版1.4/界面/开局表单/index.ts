import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { 绑定技能库, type 技能库接口 } from './技能库';

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
    绑定技能库(await waitGlobalInitialized<技能库接口>('技能库'));
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'));
    createApp(App).use(createPinia()).mount('#app');
    console.info('[开局表单] 已挂载');
  })();
});
