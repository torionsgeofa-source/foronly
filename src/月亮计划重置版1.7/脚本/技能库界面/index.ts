/**
 * 技能库界面 (独立脚本)
 *
 * - 负责创建「技能库」悬浮窗与脚本按钮那部分界面逻辑;
 * - 悬浮窗固定定位、可拖动、可关闭, 挂到主界面 body 上 (脚本 iframe 内 `$` 通常等于 parent.$);
 * - 启动默认隐藏: 通过脚本按钮「技能库」或屏幕角落小浮标开合;
 * - Vue / pinia / App.vue 等重依赖只存在于本脚本, 不会影响核心脚本的初始化。
 */
import { teleportStyle } from '@util/script';
import 技能库设置界面 from '../../界面/技能库/App.vue';

const 窗口Id = 'moon-skill-lib-window';
const 浮标Id = 'moon-skill-lib-toggle';

/** 与三个前端界面一致: 缺失 SVGElement / MathMLElement 时补 shim, 保证 Vue 正常挂载 */
function ensureDomGlobals(): void {
  const g = window as unknown as Record<string, unknown>;
  try {
    if (typeof g.SVGElement !== 'function') {
      g.SVGElement = typeof g.Element === 'function' ? class SVGElement extends (g.Element as typeof Element) {} : class SVGElement {};
    }
    if (typeof g.MathMLElement !== 'function') {
      g.MathMLElement = class MathMLElement {};
    }
  } catch (e) {
    console.warn('[技能库界面] DOM 全局检测失败', e);
  }
}

/** 取主界面 document: 优先 parent.document, 跨域等异常时退回自身 document */
function 取主文档(): Document {
  try {
    const 父 = window.parent as Window | null;
    if (父 && 父 !== window && 父.document?.body) return 父.document;
  } catch (e) {
    console.warn('[技能库界面] 无法访问主界面 document, 退回脚本自身文档', e);
  }
  return document;
}

function 挂载悬浮窗(): void {
  const 主文档 = 取主文档();
  const $主body = $(主文档.body);
  const { destroy } = teleportStyle(主文档.head);

  // 避免热重载/重复挂载产生多个窗口
  $(`#${窗口Id}, #${浮标Id}`, 主文档).remove();

  // 视口自适应: 桌面保持 600×660, 移动端收缩到视口内 (至少 280×320, 四周留 16px)
  const 取视口 = () => {
    const 视 = 主文档.defaultView ?? window;
    return { 宽: 视.innerWidth || 1024, 高: 视.innerHeight || 768 };
  };
  const 计算尺寸 = () => {
    const { 宽, 高 } = 取视口();
    return {
      窗宽: Math.min(600, Math.max(280, 宽 - 16)),
      窗高: Math.min(660, Math.max(320, 高 - 16)),
      视口宽: 宽,
      视口高: 高,
    };
  };
  const 初始 = 计算尺寸();

  const $窗 = $('<div>')
    .attr('id', 窗口Id)
    .css({
      position: 'fixed',
      top: `${Math.max(8, Math.min(90, 初始.视口高 - 初始.窗高 - 8))}px`,
      left: `${Math.max(8, 初始.视口宽 - 初始.窗宽 - 16)}px`,
      width: `${初始.窗宽}px`,
      height: `${初始.窗高}px`,
      maxWidth: 'calc(100vw - 16px)',
      maxHeight: 'calc(100vh - 16px)',
      display: 'none',
      zIndex: 2147483600,
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#100d10',
      border: '1px solid #3b303b',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
      color: '#e8e0e4',
    })
    .appendTo($主body);

  const $标题栏 = $('<div>')
    .css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '8px 12px',
      cursor: 'move',
      background: '#1b161b',
      borderBottom: '1px solid #3b303b',
      color: '#d9a441',
      fontSize: '13px',
      letterSpacing: '1px',
      userSelect: 'none',
      touchAction: 'none',
    })
    .appendTo($窗);
  $标题栏.append($('<span>').text('月亮计划 · 技能库'));
  $标题栏.append(
    $('<button type="button">')
      .text('✕')
      .css({
        cursor: 'pointer',
        border: '1px solid #3b303b',
        background: 'transparent',
        color: '#e88a7c',
        borderRadius: '4px',
        padding: '2px 8px',
        fontFamily: 'inherit',
      })
      .on('click', () => $窗.hide()),
  );

  const $内容 = $('<div>').css({ width: '100%', height: 'calc(100% - 37px)', overflow: 'auto' }).appendTo($窗);

  // 自实现拖动 (不依赖 jQuery UI): 标题栏 pointerdown 后, 在「主文档」级别监听 move/up,
  // 避免跨文档 setPointerCapture 失败导致指针一移出标题栏就收不到事件 (拖不动)。
  const 标题 = $标题栏[0];
  let 起点X = 0;
  let 起点Y = 0;
  let 起始左 = 0;
  let 起始上 = 0;

  const 移动中 = (事件: Event) => {
    const 事件对象 = 事件 as PointerEvent;
    $窗.css({
      left: `${起始左 + (事件对象.clientX - 起点X)}px`,
      top: `${起始上 + (事件对象.clientY - 起点Y)}px`,
      right: 'auto',
    });
    事件对象.preventDefault();
  };
  const 结束拖动 = () => {
    主文档.removeEventListener('pointermove', 移动中, true);
    主文档.removeEventListener('pointerup', 结束拖动, true);
    主文档.removeEventListener('pointercancel', 结束拖动, true);
  };

  标题.addEventListener('pointerdown', 事件 => {
    const 事件对象 = 事件 as PointerEvent;
    if ((事件对象.target as HTMLElement | null)?.closest?.('button')) return;
    const 矩形 = $窗[0].getBoundingClientRect();
    起始左 = 矩形.left;
    起始上 = 矩形.top;
    起点X = 事件对象.clientX;
    起点Y = 事件对象.clientY;
    主文档.addEventListener('pointermove', 移动中, true);
    主文档.addEventListener('pointerup', 结束拖动, true);
    主文档.addEventListener('pointercancel', 结束拖动, true);
    事件对象.preventDefault();
  });

  const 切换 = () => $窗.toggle();

  // 视口变化 (旋转屏幕 / 软键盘) 时重新夹取窗口进视口并自适应尺寸。
  // 监听主界面窗口 (窗口挂在主文档, 主页面 resize 不会触发脚本 iframe 的 window.resize)。
  const 主视窗 = 主文档.defaultView ?? window;
  const 重排 = () => {
    const { 宽, 高 } = 取视口();
    const 窗宽 = Math.min(600, Math.max(280, 宽 - 16));
    const 窗高 = Math.min(660, Math.max(320, 高 - 16));
    const 矩形 = $窗[0].getBoundingClientRect();
    const 左 = Math.min(Math.max(8, 矩形.left), Math.max(8, 宽 - 窗宽 - 8));
    const 顶 = Math.min(Math.max(8, 矩形.top), Math.max(8, 高 - 窗高 - 8));
    $窗.css({ width: `${窗宽}px`, height: `${窗高}px`, left: `${左}px`, top: `${顶}px`, right: 'auto' });
  };
  主视窗.addEventListener('resize', 重排);
  主视窗.addEventListener('orientationchange', 重排);

  // 屏幕角落小浮标: 始终提供, 作为脚本按钮不可用时的兜底
  const $浮标 = $('<button type="button">')
    .attr('id', 浮标Id)
    .text('技能库')
    .css({
      position: 'fixed',
      right: '14px',
      bottom: '14px',
      zIndex: 2147483600,
      padding: '6px 12px',
      border: '1px solid #d9a441',
      borderRadius: '14px',
      background: 'rgba(27, 22, 27, 0.9)',
      color: '#d9a441',
      fontFamily: 'inherit',
      fontSize: '12px',
      letterSpacing: '1px',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
    })
    .on('click', 切换)
    .appendTo($主body);

  // 先注册脚本按钮事件, 再挂载 Vue: 即使 Vue 挂载失败, 浮标 / 按钮仍存在、可点
  let 按钮监听: EventOnReturn | null = null;
  try {
    replaceScriptButtons([{ name: '技能库', visible: true }]);
    按钮监听 = eventOn(getButtonEvent('技能库'), 切换);
  } catch (e) {
    console.warn('[技能库界面] 注册脚本按钮失败, 已保留角落浮标', e);
  }

  let app: ReturnType<typeof createApp> | null = null;
  try {
    ensureDomGlobals();
    app = createApp(技能库设置界面).use(createPinia());
    app.mount($内容[0]);
    console.info('[技能库界面] Vue 已挂载');
  } catch (e) {
    app = null;
    console.error('[技能库界面] Vue 挂载失败, 已保留角落浮标与脚本按钮', e);
  }

  $(window).on('pagehide', () => {
    try {
      按钮监听?.stop();
      // 注销脚本按钮, 避免热重载 / 重复挂载时按钮叠加
      replaceScriptButtons([]);
    } catch (e) {
      console.warn('[技能库界面] 注销脚本按钮失败', e);
    }
    try {
      app?.unmount();
    } catch (e) {
      console.warn('[技能库界面] 卸载 Vue 失败', e);
    }
    主视窗.removeEventListener('resize', 重排);
    主视窗.removeEventListener('orientationchange', 重排);
    $窗.remove();
    $浮标.remove();
    destroy();
  });
}

$((): void => {
  errorCatched(() => 挂载悬浮窗())();
  console.info('[技能库界面] 已挂载');
});
