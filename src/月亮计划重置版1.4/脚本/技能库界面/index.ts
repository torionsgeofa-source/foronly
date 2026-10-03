/**
 * 技能库界面 (独立脚本)
 *
 * - 负责创建「技能库」悬浮窗与脚本按钮那部分界面逻辑;
 * - 先 `await waitGlobalInitialized('技能库')` 等待核心脚本暴露共享接口, 再挂载;
 * - Vue / pinia / App.vue 等重依赖只存在于本脚本, 不会影响核心脚本的初始化。
 */
import { teleportStyle } from '@util/script';
import 技能库设置界面 from '../../界面/技能库/App.vue';

function 挂载悬浮窗(): void {
  const { destroy } = teleportStyle();

  // 悬浮窗外壳（固定定位、可拖动、可关闭），挂到主界面 body 上
  const $窗 = $('<div id="moon-skill-lib-window">')
    .css({
      position: 'fixed',
      top: '90px',
      right: '24px',
      width: '580px',
      height: '640px',
      display: 'none',
      zIndex: 2147483000,
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#100d10',
      border: '1px solid #3b303b',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)',
      color: '#e8e0e4',
    })
    .appendTo($('body'));

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

  const app = createApp(技能库设置界面).use(createPinia());
  app.mount($内容[0]);

  try {
    const 可拖 = ($窗 as unknown as { draggable?: (opt: unknown) => void }).draggable;
    if (typeof 可拖 === 'function') 可拖.call($窗, { handle: $标题栏[0] });
  } catch (e) {
    console.warn('[技能库界面] 悬浮窗拖动不可用', e);
  }

  const 切换 = () => $窗.toggle();

  try {
    replaceScriptButtons([{ name: '技能库', visible: true }]);
    eventOn(getButtonEvent('技能库'), 切换);
  } catch (e) {
    console.warn('[技能库界面] 注册按钮失败', e);
  }

  $(window).on('pagehide', () => {
    app.unmount();
    $窗.remove();
    destroy();
  });
}

$(() => {
  errorCatched(async () => {
    await waitGlobalInitialized('技能库');
    挂载悬浮窗();
    console.info('[技能库界面] 已挂载');
  })();
});
