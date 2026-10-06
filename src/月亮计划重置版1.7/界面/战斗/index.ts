import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';
import { 绑定技能库 } from './engine/units';
import { 取技能库全局 } from '../共享/技能库全局';
import { 迁移旧技能 } from '../共享/技能迁移';

/** 后台绑定技能库: 不阻塞界面挂载; 战斗引擎解析技能时按角色查库 */
function 后台绑定技能库(): void {
  取技能库全局()
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
    // 旧存档兼容: 在 schema 解析前把对象式技能并入库并收敛为名字数组
    try {
      const api = await 取技能库全局();
      if (api) {
        const 迁移数 = 迁移旧技能(api);
        if (迁移数 > 0) console.info('[战斗面板] 已迁移旧格式技能', 迁移数, '条');
      }
    } catch (e) {
      console.warn('[战斗面板] 旧技能迁移跳过（技能库未就绪）', e);
    }
    createApp(App).use(createPinia()).mount('#app');
    console.info('[战斗面板] 已挂载');
  })();
});
