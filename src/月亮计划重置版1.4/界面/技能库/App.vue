<template>
  <div class="skill-lib">
    <div class="lib-header">
      <b>技能库</b>
      <span class="lib-sub">默认库 + 全局覆盖 · 共 {{ 列表.length }} 项</span>
    </div>

    <div class="lib-toolbar">
      <button class="tbtn primary" @click="新建">＋ 新建技能</button>
      <button class="tbtn" @click="刷新">刷新</button>
      <button class="tbtn" @click="导出文件()">导出整库</button>
      <button class="tbtn" @click="显示导入 = !显示导入">导入 JSON</button>
      <button class="tbtn danger" @click="重置库">重置覆盖</button>
    </div>

    <div v-if="显示导入" class="import-box">
      <textarea v-model="导入文本" rows="5" placeholder="粘贴「技能名 -> 技能定义」的 JSON 对象；导入将替换整库覆盖层" />
      <div class="import-actions">
        <button class="tbtn primary" :disabled="!导入文本.trim()" @click="执行导入">确认导入</button>
        <button class="tbtn" @click="选择文件">从文件导入</button>
        <input ref="文件输入" type="file" accept=".json,application/json" class="hidden-file" @change="读文件" />
      </div>
    </div>

    <div class="lib-body">
      <aside class="lib-list">
        <div class="filters">
          <input v-model="关键字" class="filter-input" placeholder="搜索技能名" />
          <select v-model="筛选类别" class="filter-select">
            <option value="">全部类别</option>
            <option v-for="类别 in 类别选项" :key="类别" :value="类别">{{ 类别 }}</option>
          </select>
        </div>
        <div class="list-scroll">
          <button
            v-for="定义 in 过滤列表"
            :key="定义.名称"
            class="list-item"
            :class="{ active: 草稿 && 草稿.名称 === 定义.名称 }"
            @click="选中(定义.名称)"
          >
            <span class="dot" :style="{ background: 罪孽颜色[定义.罪孽 ?? ''] ?? '#3b303b' }" />
            <span class="item-name">{{ 定义.名称 }}</span>
            <span class="item-tag" :class="{ guard: 定义.类别 === '守备', ego: 定义.类别 === 'EGO' }">{{ 定义.类别 }}</span>
          </button>
          <div v-if="过滤列表.length === 0" class="list-empty">无匹配技能</div>
        </div>
      </aside>

      <section v-if="草稿" class="lib-editor">
        <div class="editor-title">
          <input v-model="草稿.名称" class="name-input" placeholder="技能名称" />
          <button class="tbtn primary" :disabled="!草稿.名称.trim()" @click="保存">保存</button>
          <button class="tbtn" @click="导出文件(草稿.名称)">导出此技能</button>
          <button class="tbtn danger" @click="删除">删除</button>
        </div>

        <div class="field-grid">
          <label class="field">
            <span>类别</span>
            <select v-model="草稿.类别">
              <option v-for="类别 in 类别选项" :key="类别" :value="类别">{{ 类别 }}</option>
            </select>
          </label>

          <template v-if="是拼点技能">
            <label class="field">
              <span>罪孽</span>
              <select v-model="草稿.罪孽">
                <option v-for="项 in 罪孽选项" :key="项" :value="项">{{ 项 }}</option>
              </select>
            </label>
            <label class="field">
              <span>攻击类型</span>
              <select v-model="草稿.攻击类型">
                <option v-for="项 in 攻击类型选项" :key="项" :value="项">{{ 项 }}</option>
              </select>
            </label>
            <label v-if="草稿.类别 === '守备'" class="field">
              <span>守备类型</span>
              <select v-model="草稿.守备类型">
                <option v-for="项 in 守备类型选项" :key="项" :value="项">{{ 项 }}</option>
              </select>
            </label>
            <label class="field">
              <span>基础威力</span>
              <input v-model.number="草稿.基础威力" type="number" />
            </label>
            <label class="field">
              <span>攻击等级修正 (-8~8)</span>
              <input v-model.number="草稿.攻击等级修正" type="number" min="-8" max="8" />
            </label>
            <label class="field">
              <span>攻击容量 (≥1)</span>
              <input v-model.number="草稿.攻击容量" type="number" min="1" />
            </label>
            <label v-if="草稿.类别 === 'EGO'" class="field">
              <span>SP消耗</span>
              <input v-model.number="草稿.SP消耗" type="number" min="0" />
            </label>
          </template>

          <template v-else>
            <label class="field">
              <span>时机</span>
              <select v-model="草稿.时机">
                <option v-for="项 in 时机选项" :key="项" :value="项">{{ 项 }}</option>
              </select>
            </label>
            <label class="field span-2">
              <span>条件 (可留空)</span>
              <input v-model="草稿.条件" placeholder="如：生命低于50%" />
            </label>
          </template>
        </div>

        <label class="field span-full">
          <span>效果说明</span>
          <textarea v-model="草稿.效果" rows="2" placeholder="技能 / 被动效果的简短说明" />
        </label>

        <div v-if="是拼点技能" class="coin-block">
          <div class="coin-head">
            <span>硬币 (每枚含 威力 / 类型 / 命中效果)</span>
            <button class="tbtn" @click="添加硬币">＋ 硬币</button>
          </div>
          <div v-for="(硬币, 下标) in 硬币列表" :key="下标" class="coin-row">
            <input v-model.number="硬币.威力" type="number" class="coin-power" placeholder="威力" />
            <select v-model="硬币.类型" class="coin-type">
              <option v-for="项 in 硬币类型选项" :key="项" :value="项">{{ 项 }}</option>
            </select>
            <input
              :value="效果文本(硬币)"
              class="coin-effect"
              placeholder="命中效果，如 施加1层流血，强度1；多条用；分隔"
              @change="写入命中效果(下标, ($event.target as HTMLInputElement).value)"
            />
            <button class="tbtn danger small" @click="删除硬币(下标)">×</button>
          </div>
          <div v-if="硬币列表.length === 0" class="hint">尚无硬币，可留空。</div>
        </div>

        <div v-if="是被动支援" class="effect-preview">
          <div class="preview-line">
            <span class="preview-label">规范化</span>
            <span class="preview-text">{{ 规范化预览 || '（暂无可识别效果）' }}</span>
          </div>
          <div v-for="(项, 下标) in 效果修复" :key="下标" class="preview-warn">⚠ {{ 项 }}</div>
        </div>
      </section>

      <section v-else class="lib-editor empty-editor">从左侧选择技能，或点击「新建技能」开始编辑。</section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  类别选项,
  罪孽选项,
  攻击类型选项,
  守备类型选项,
  时机选项,
  硬币类型选项,
  罪孽颜色,
  建草稿,
  规范化硬币,
  type 技能定义,
  type 技能库接口,
  type 战斗技能硬币,
  type 技能类别,
} from './types';
import { 规范化效果, 解析效果, 序列化效果 } from '../战斗/engine/效果解析';

const 技能库 = ref<技能库接口 | null>(null);
const 列表 = ref<技能定义[]>([]);
const 关键字 = ref('');
const 筛选类别 = ref<'' | 技能类别>('');
const 草稿 = ref<技能定义 | null>(null);
const 显示导入 = ref(false);
const 导入文本 = ref('');
const 文件输入 = ref<HTMLInputElement | null>(null);

const 过滤列表 = computed(() => {
  const 词 = 关键字.value.trim().toLowerCase();
  return 列表.value.filter(定义 => {
    if (筛选类别.value && 定义.类别 !== 筛选类别.value) return false;
    if (词 && !定义.名称.toLowerCase().includes(词)) return false;
    return true;
  });
});

const 硬币列表 = computed<战斗技能硬币[]>({
  get: () => (草稿.value ? (草稿.value.硬币 ?? []) : []),
  set: 值 => {
    if (草稿.value) 草稿.value.硬币 = 值;
  },
});

const 是拼点技能 = computed(() => 草稿.value?.类别 === '战斗' || 草稿.value?.类别 === '守备' || 草稿.value?.类别 === 'EGO');
const 是被动支援 = computed(() => 草稿.value?.类别 === '被动' || 草稿.value?.类别 === '支援');
const 规范化预览 = computed(() => (是被动支援.value ? 规范化效果(草稿.value?.效果 ?? '') : ''));
const 效果修复 = computed(() => (是被动支援.value ? 解析效果(草稿.value?.效果 ?? '').修复 : []));

function 效果文本(硬币: 战斗技能硬币): string {
  return (硬币.命中效果 ?? []).map(序列化效果).join('；');
}

function 写入命中效果(下标: number, 文本: string): void {
  const 当前 = 硬币列表.value;
  if (!当前[下标]) return;
  当前[下标].命中效果 = 解析效果(文本).效果;
  草稿.value = { ...草稿.value!, 硬币: [...当前] };
}

function 刷新(): void {
  if (!技能库.value) return;
  列表.value = 技能库.value.内存列表();
}

function 选中(名称: string): void {
  const 定义 = 技能库.value?.查(名称);
  if (定义) 草稿.value = 建草稿(定义);
}

function 新建(): void {
  草稿.value = 建草稿();
}

function 添加硬币(): void {
  if (!草稿.value) return;
  const 当前 = 硬币列表.value;
  硬币列表.value = [...当前, { 威力: 1, 类型: '普通' }];
}

function 删除硬币(下标: number): void {
  const 当前 = 硬币列表.value;
  硬币列表.value = 当前.filter((_, 序) => 序 !== 下标);
}

function 保存(): void {
  const 定义 = 草稿.value;
  if (!定义 || !定义.名称.trim() || !技能库.value) return;
  const 硬币 = 规范化硬币(定义);
  const 结果: 技能定义 = {
    ...定义,
    名称: 定义.名称.trim(),
    硬币: 是拼点技能.value ? 硬币 : undefined,
    硬币威力: 是拼点技能.value ? 硬币.map(项 => 项.威力) : undefined,
    硬币类型: 是拼点技能.value ? 硬币.map(项 => 项.类型) : undefined,
  };
  if (技能库.value.查(结果.名称)) 技能库.value.改(结果.名称, 结果);
  else 技能库.value.增(结果.名称, 结果);
  草稿.value = 建草稿(结果);
  刷新();
  toastr.success(`已保存技能「${结果.名称}」`, '技能库');
}

function 删除(): void {
  const 定义 = 草稿.value;
  if (!定义 || !技能库.value) return;
  if (!confirm(`确定删除技能「${定义.名称}」吗？（内置技能可重置恢复）`)) return;
  技能库.value.删(定义.名称);
  草稿.value = null;
  刷新();
  toastr.info(`已删除技能「${定义.名称}」`, '技能库');
}

function 重置库(): void {
  if (!技能库.value) return;
  if (!confirm('确定清空所有覆盖改动，恢复内置默认库吗？')) return;
  技能库.value.重置();
  草稿.value = null;
  刷新();
  toastr.info('技能库已重置为内置默认库', '技能库');
}

function 执行导入(): void {
  if (!技能库.value) return;
  try {
    技能库.value.导入(导入文本.value);
    显示导入.value = false;
    导入文本.value = '';
    草稿.value = null;
    刷新();
    toastr.success('技能库导入成功', '技能库');
  } catch (错误) {
    toastr.error(`导入失败：${(错误 as Error).message}`, '技能库');
  }
}

function 选择文件(): void {
  文件输入.value?.click();
}

function 读文件(事件: Event): void {
  const 文件 = (事件.target as HTMLInputElement).files?.[0];
  if (!文件) return;
  const 读取器 = new FileReader();
  读取器.onload = () => {
    导入文本.value = String(读取器.result ?? '');
  };
  读取器.readAsText(文件, 'utf-8');
}

function 导出文件(名称?: string): void {
  if (!技能库.value) return;
  const 文本 = 技能库.value.导出(名称);
  if (!文本) {
    toastr.warning('没有可导出的技能', '技能库');
    return;
  }
  const 文件名 = 名称 ? `${名称}.json` : '技能库.json';
  const 链接 = document.createElement('a');
  链接.href = URL.createObjectURL(new Blob([文本], { type: 'application/json' }));
  链接.download = 文件名;
  链接.click();
  URL.revokeObjectURL(链接.href);
  void navigator.clipboard?.writeText(文本).catch(() => undefined);
  toastr.success(`已导出 ${文件名}（并尝试复制到剪贴板）`, '技能库');
}

onMounted(async () => {
  技能库.value = await waitGlobalInitialized<技能库接口>('技能库');
  刷新();
});
</script>

<style scoped>
.skill-lib {
  --b-bg: var(--b-bg, #100d10);
  --b-surface: var(--b-surface, #1b161b);
  --b-surface-2: var(--b-surface-2, #241d24);
  --b-border: var(--b-border, #3b303b);
  --b-text: var(--b-text, #e8e0e4);
  --b-muted: var(--b-muted, #9a8f98);
  --b-accent: var(--b-accent, #c8452f);
  --b-accent-2: var(--b-accent-2, #d9a441);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 10px;
  background: var(--b-bg, #100d10);
  color: var(--b-text, #e8e0e4);
  font-size: 13px;
}

.lib-header {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.lib-sub {
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.lib-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tbtn {
  padding: 5px 12px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: transparent;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.tbtn.primary {
  border-color: var(--b-accent-2, #d9a441);
  color: var(--b-accent-2, #d9a441);
}

.tbtn.danger {
  border-color: var(--b-accent, #c8452f);
  color: var(--b-accent, #c8452f);
}

.tbtn.small {
  padding: 2px 8px;
}

.tbtn:hover {
  background: rgba(217, 164, 65, 0.12);
}

.import-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px dashed var(--b-border, #3b303b);
  border-radius: 6px;
}

.import-box textarea {
  width: 100%;
  resize: vertical;
  padding: 6px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
}

.import-actions {
  display: flex;
  gap: 6px;
}

.hidden-file {
  display: none;
}

.lib-body {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
  min-height: 300px;
}

.lib-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 7px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-input,
.filter-select,
.field input,
.field select,
.field textarea,
.name-input,
.coin-power,
.coin-type,
.coin-effect {
  width: 100%;
  padding: 5px 7px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
  outline: none;
}

.list-scroll {
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow-y: auto;
  max-height: 460px;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
}

.list-item:hover {
  background: rgba(217, 164, 65, 0.08);
}

.list-item.active {
  border-color: var(--b-accent-2, #d9a441);
  background: rgba(217, 164, 65, 0.12);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-tag {
  font-size: 10px;
  padding: 0 5px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 3px;
  color: var(--b-muted, #9a8f98);
}

.item-tag.guard {
  border-style: dashed;
  color: #9fc6e0;
}

.item-tag.ego {
  border-color: var(--b-accent-2, #d9a441);
  color: var(--b-accent-2, #d9a441);
}

.list-empty {
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
  padding: 6px;
}

.lib-editor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 7px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
}

.empty-editor {
  align-items: center;
  justify-content: center;
  color: var(--b-muted, #9a8f98);
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.name-input {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.field.span-2 {
  grid-column: span 2;
}

.field.span-full {
  grid-column: 1 / -1;
}

.coin-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px dashed var(--b-border, #3b303b);
  padding-top: 8px;
}

.coin-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.coin-row {
  display: grid;
  grid-template-columns: 70px 110px 1fr 30px;
  gap: 6px;
  align-items: center;
}

.effect-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  border: 1px dashed var(--b-border, #3b303b);
  border-radius: 5px;
  background: rgba(217, 164, 65, 0.06);
  font-size: 11px;
  line-height: 1.6;
}

.preview-line {
  display: flex;
  gap: 6px;
  align-items: baseline;
}

.preview-label {
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(217, 164, 65, 0.18);
  color: var(--b-accent-2, #d9a441);
  font-size: 10px;
}

.preview-warn,
.hint {
  color: #e88a7c;
  font-size: 11px;
}

@media (max-width: 720px) {
  .lib-body {
    grid-template-columns: 1fr;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .coin-row {
    grid-template-columns: 60px 1fr 30px;
  }

  .coin-effect {
    grid-column: 1 / -1;
  }
}
</style>
