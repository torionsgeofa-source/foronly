import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { 绑定技能库, type 技能库接口 } from './技能库';

/** 后台绑定技能库: 不阻塞界面挂载; 绑定后响应式变量会驱动技能面板刷新 */
function 后台绑定技能库(): void {
  waitGlobalInitialized<技能库接口>('技能库')
    .then(api => 绑定技能库(api))
    .catch(e => console.warn('[技能库] 初始化失败，已降级（界面照常挂载，仅技能库功能不可用）', e));
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
    后台绑定技能库();
    await waitUntil(() => _.has(getVariables({ type: 'message', message_id: getCurrentMessageId() }), 'stat_data'), { timeout: 3000 }).catch(() =>
      console.warn('[MVU] stat_data 未及时就绪，先以默认值挂载（随后会自动同步）'),
    );
    createApp(App).use(createPinia()).mount('#app');
    console.info('[状态栏] 已挂载');
  })();
});
