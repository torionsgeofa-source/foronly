<template>
  <div class="skill-lib">
    <div class="lib-header">
      <b>技能库</b>
      <span class="lib-sub">按角色归属 · 角色 {{ 角色列表.length }} 个 · 当前角色 {{ 技能列表.length }} 项</span>
    </div>

    <div class="lib-toolbar">
      <button class="tbtn" @click="导出文件()">导出整库</button>
      <button class="tbtn" :disabled="!当前角色" @click="导出文件(当前角色)">导出当前角色</button>
      <button class="tbtn" :disabled="!草稿" @click="导出单个技能">导出单个技能</button>
      <button class="tbtn" @click="显示导入 = !显示导入">导入 JSON</button>
      <button class="tbtn danger" @click="重置库">重置</button>
    </div>

    <div v-if="显示导入" class="import-box">
      <textarea v-model="导入文本" rows="5" placeholder="粘贴 JSON：支持「角色 -> 技能名 -> 定义」整库 / 单角色、或「技能名 -> 定义」单技能（按 所属 归入角色，缺省「通用」）" />
      <div class="import-actions">
        <button class="tbtn primary" :disabled="!导入文本.trim()" @click="执行导入">确认导入（合并）</button>
        <button class="tbtn" @click="选择文件">从文件导入</button>
        <input ref="文件输入" type="file" accept=".json,application/json" class="hidden-file" @change="读文件" />
      </div>
      <div class="hint">导入为合并写入：同名技能会被覆盖，未导入的角色 / 技能不会被删除。</div>
    </div>

    <div class="lib-body">
      <aside class="lib-roles">
        <div class="roles-head">
          <span>角色</span>
          <button class="tbtn small" @click="新建角色">＋</button>
        </div>
        <input v-model="角色关键字" class="filter-input" placeholder="搜索角色" />
        <div class="list-scroll">
          <div
            v-for="角色 in 过滤角色"
            :key="角色"
            class="role-item"
            :class="{ active: 角色 === 当前角色 }"
            @click="选中角色(角色)"
          >
            <span class="role-name">{{ 角色 }}</span>
            <span class="role-count">{{ 角色技能数(角色) }}</span>
            <button class="mini-del" title="删除角色" @click.stop="删除角色(角色)">×</button>
          </div>
          <div v-if="过滤角色.length === 0" class="list-empty">无角色</div>
        </div>
      </aside>

      <aside class="lib-list">
        <div class="filters">
          <input v-model="关键字" class="filter-input" placeholder="搜索技能名" />
          <select v-model="筛选类别" class="filter-select">
            <option value="">全部类别</option>
            <option v-for="类别 in 类别选项" :key="类别" :value="类别">{{ 类别 }}</option>
          </select>
        </div>
        <button class="tbtn primary" :disabled="!当前角色" @click="新建">＋ 新建技能</button>
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
          <span class="belong">归属：{{ 当前角色 || '—' }}</span>
          <button class="tbtn primary" :disabled="!草稿.名称.trim() || !当前角色" @click="保存">保存</button>
          <button class="tbtn danger" @click="删除">删除</button>
        </div>

        <SkillPanel v-model="草稿" :显示名称="false" />
      </section>

      <section v-else class="lib-editor empty-editor">
        {{ 当前角色 ? '从中间选择技能，或点击「新建技能」开始编辑。' : '请先在左侧选择角色，或点击「＋」新增角色。' }}
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkillPanel from '../共享/SkillPanel.vue';
import { 从技能定义, 空技能编辑, 到技能定义, type 技能编辑 } from '../共享/技能编辑';
import { 类别选项, 罪孽颜色, type 技能定义, type 技能库接口, type 技能类别 } from './types';

const 技能库 = ref<技能库接口 | null>(null);
const 角色列表 = ref<string[]>([]);
const 当前角色 = ref('');
const 技能列表 = ref<技能定义[]>([]);
const 角色关键字 = ref('');
const 关键字 = ref('');
const 筛选类别 = ref<'' | 技能类别>('');
const 草稿 = ref<技能编辑 | null>(null);
const 草稿原名称 = ref('');
const 显示导入 = ref(false);
const 导入文本 = ref('');
const 文件输入 = ref<HTMLInputElement | null>(null);

const 过滤角色 = computed(() => {
  const 词 = 角色关键字.value.trim().toLowerCase();
  if (!词) return 角色列表.value;
  return 角色列表.value.filter(角色 => 角色.toLowerCase().includes(词));
});

const 过滤列表 = computed(() => {
  const 词 = 关键字.value.trim().toLowerCase();
  return 技能列表.value.filter(定义 => {
    if (筛选类别.value && 定义.类别 !== 筛选类别.value) return false;
    if (词 && !定义.名称.toLowerCase().includes(词)) return false;
    return true;
  });
});

function 角色技能数(角色: string): number {
  return Object.keys(技能库.value?.角色技能(角色) ?? {}).length;
}

function 刷新角色(保留当前 = true): void {
  if (!技能库.value) return;
  角色列表.value = 技能库.value.角色列表();
  if (!保留当前 || !角色列表.value.includes(当前角色.value)) {
    当前角色.value = 角色列表.value[0] ?? '';
  }
  刷新技能();
}

function 刷新技能(): void {
  技能列表.value = 当前角色.value ? Object.values(技能库.value?.角色技能(当前角色.value) ?? {}) : [];
}

function 刷新(): void {
  刷新角色(false);
}

function 选中角色(角色: string): void {
  当前角色.value = 角色;
  草稿.value = null;
  草稿原名称.value = '';
  刷新技能();
}

function 新建角色(): void {
  if (!技能库.value) return;
  const 名 = (prompt('请输入新角色名') ?? '').trim();
  if (!名) return;
  if (角色列表.value.includes(名)) {
    toastr.info(`角色「${名}」已存在`, '技能库');
    选中角色(名);
    return;
  }
  技能库.value.增角色(名);
  刷新角色(false);
  选中角色(名);
  toastr.success(`已新增角色「${名}」`, '技能库');
}

function 删除角色(角色: string): void {
  if (!技能库.value) return;
  if (!confirm(`确定删除角色「${角色}」及其名下全部技能吗？（内置角色可重置恢复）`)) return;
  技能库.value.删角色(角色);
  if (草稿.value && 当前角色.value === 角色) 草稿.value = null;
  刷新();
  toastr.info(`已删除角色「${角色}」`, '技能库');
}

function 选中(名称: string): void {
  const 定义 = 技能库.value?.查(当前角色.value, 名称);
  if (定义) {
    草稿.value = 从技能定义(定义);
    草稿原名称.value = 名称;
  }
}

function 新建(): void {
  if (!当前角色.value) {
    toastr.warning('请先选择或新增一个角色', '技能库');
    return;
  }
  草稿.value = 空技能编辑();
  草稿原名称.value = '';
}

function 保存(): void {
  const 编辑 = 草稿.value;
  if (!编辑 || !编辑.名称.trim() || !技能库.value || !当前角色.value) return;
  const 原定义 = 技能库.value.查(当前角色.value, 草稿原名称.value || 编辑.名称);
  const 结果: 技能定义 = { ...到技能定义(编辑, 原定义), 所属: 当前角色.value };
  // 名称被改动时先删旧名, 避免旧名残留
  if (草稿原名称.value && 草稿原名称.value !== 结果.名称) {
    技能库.value.删(当前角色.value, 草稿原名称.value);
  }
  if (技能库.value.查(当前角色.value, 结果.名称)) 技能库.value.改(当前角色.value, 结果.名称, 结果);
  else 技能库.value.增(当前角色.value, 结果.名称, 结果);
  草稿.value = 从技能定义(技能库.value.查(当前角色.value, 结果.名称) ?? 结果);
  草稿原名称.value = 结果.名称;
  刷新技能();
  toastr.success(`已保存技能「${结果.名称}」到「${当前角色.value}」`, '技能库');
}

function 删除(): void {
  const 定义 = 草稿.value;
  if (!定义 || !技能库.value || !当前角色.value) return;
  if (!confirm(`确定删除技能「${定义.名称}」吗？（内置技能可重置恢复）`)) return;
  技能库.value.删(当前角色.value, 定义.名称);
  草稿.value = null;
  草稿原名称.value = '';
  刷新技能();
  toastr.info(`已删除技能「${定义.名称}」`, '技能库');
}

function 重置库(): void {
  if (!技能库.value) return;
  if (!confirm('确定清空所有覆盖改动，恢复内置默认库吗？')) return;
  技能库.value.重置();
  当前角色.value = '';
  草稿.value = null;
  草稿原名称.value = '';
  刷新();
  toastr.info('技能库已重置为内置默认库', '技能库');
}

function 执行导入(): void {
  if (!技能库.value) return;
  if (!confirm('导入以「合并」方式写入：同名技能会被覆盖，未导入的角色 / 技能不会被删除。是否继续？')) return;
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

function 下载(文本: string, 文件名: string): void {
  const 链接 = document.createElement('a');
  const 地址 = URL.createObjectURL(new Blob([文本], { type: 'application/json' }));
  链接.href = 地址;
  链接.download = 文件名;
  链接.click();
  // 延迟撤销, 避免部分浏览器在下载真正开始前就释放 URL 导致下载失败
  setTimeout(() => URL.revokeObjectURL(地址), 1000);
  void navigator.clipboard?.writeText(文本).catch(() => undefined);
}

function 导出文件(角色?: string): void {
  if (!技能库.value) return;
  const 文本 = 技能库.value.导出(角色);
  if (!文本 || 文本 === '{}') {
    toastr.warning('没有可导出的技能', '技能库');
    return;
  }
  const 文件名 = 角色 ? `${角色}.json` : '技能库.json';
  下载(文本, 文件名);
  toastr.success(`已导出 ${文件名}（并尝试复制到剪贴板）`, '技能库');
}

function 导出单个技能(): void {
  const 编辑 = 草稿.value;
  if (!编辑) return;
  const 名称 = 编辑.名称 || '技能';
  const 原定义 = 技能库.value?.查(当前角色.value, 草稿原名称.value || 名称);
  // 输出 { [技能名]: 定义 }, 可被单技能导入规则识别
  const 文本 = JSON.stringify({ [名称]: { ...到技能定义(编辑, 原定义), 所属: 当前角色.value } }, null, 2);
  下载(文本, `${名称}.json`);
  toastr.success('已导出单个技能（并尝试复制到剪贴板）', '技能库');
}

onMounted(async () => {
  try {
    技能库.value = await waitGlobalInitialized<技能库接口>('技能库');
  } catch (e) {
    console.warn('[技能库] 未就绪，界面功能不可用', e);
    return;
  }
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

.skill-lib,
.skill-lib * {
  box-sizing: border-box;
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

.tbtn:hover:not(:disabled) {
  background: rgba(217, 164, 65, 0.12);
}

.tbtn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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
  grid-template-columns: 150px 210px 1fr;
  gap: 10px;
  min-height: 320px;
}

.lib-roles,
.lib-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 7px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.2);
}

.roles-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
  letter-spacing: 1px;
}

.role-item {
  display: flex;
  align-items: center;
  gap: 5px;
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

.role-item:hover {
  background: rgba(217, 164, 65, 0.08);
}

.role-item.active {
  border-color: var(--b-accent-2, #d9a441);
  background: rgba(217, 164, 65, 0.12);
}

.role-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-count {
  font-size: 10px;
  color: var(--b-muted, #9a8f98);
  font-variant-numeric: tabular-nums;
}

.mini-del {
  border: none;
  background: transparent;
  color: #e88a7c;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filter-input,
.filter-select,
.name-input {
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
  max-height: min(460px, 42vh);
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
  text-align: center;
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

.belong {
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.hint {
  color: #e88a7c;
  font-size: 11px;
}

@media (max-width: 760px) {
  .skill-lib {
    padding: 8px;
    gap: 8px;
    font-size: 12px;
  }

  .lib-body {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .lib-toolbar {
    gap: 4px;
  }

  .tbtn {
    padding: 6px 10px;
  }

  .role-item,
  .list-item {
    padding: 8px 9px;
  }

  .list-scroll {
    max-height: 30vh;
  }

  .editor-title {
    flex-wrap: wrap;
  }

  .belong {
    flex-basis: 100%;
  }
}
</style>
