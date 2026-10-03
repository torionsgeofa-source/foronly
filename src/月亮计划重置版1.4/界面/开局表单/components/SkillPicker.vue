<template>
  <div class="skill-picker">
    <div class="picker-filters">
      <input v-model="关键字" class="picker-input" placeholder="搜索技能库" />
      <select v-model="类别" class="picker-select">
        <option value="">全部类别</option>
        <option v-for="项 in 类别选项" :key="项" :value="项">{{ 项 }}</option>
      </select>
    </div>

    <div class="picker-body">
      <div class="picker-list">
        <label v-for="定义 in 过滤列表" :key="定义.名称" class="picker-item" :title="描述(定义)">
          <input type="checkbox" :checked="已选.includes(定义.名称)" @change="切换(定义.名称)" />
          <span class="dot" :style="{ background: 罪孽颜色[定义.罪孽 ?? ''] ?? '#3b303b' }" />
          <span class="name">{{ 定义.名称 }}</span>
          <span class="tag" :class="{ guard: 定义.类别 === '守备', ego: 定义.类别 === 'EGO' }">{{ 定义.类别 }}</span>
        </label>
        <div v-if="过滤列表.length === 0" class="empty">无匹配技能</div>
      </div>

      <div class="picker-selected">
        <div class="selected-title">已选 {{ 已选.length }} 个</div>
        <div class="chips">
          <span v-for="名 in 已选" :key="名" class="chip">
            {{ 名 }}
            <button type="button" class="chip-del" @click="移除(名)">×</button>
          </span>
          <span v-if="!已选.length" class="empty">尚未选择技能</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 罪孽颜色 } from '../types';
import type { 技能定义 } from '../技能库';

const model = defineModel<string[]>({ required: true });

const props = defineProps<{ 技能?: 技能定义[] }>();

const 关键字 = ref('');
const 类别 = ref('');

const 类别选项 = ['战斗', '守备', '被动', '支援', 'EGO'];

const 已选 = computed(() => model.value ?? []);

const 全部 = computed(() => props.技能 ?? []);

const 过滤列表 = computed(() => {
  const 词 = 关键字.value.trim().toLowerCase();
  return 全部.value.filter(定义 => {
    if (类别.value && 定义.类别 !== 类别.value) return false;
    if (词 && !定义.名称.toLowerCase().includes(词)) return false;
    return true;
  });
});

function 切换(名: string): void {
  model.value = 已选.value.includes(名) ? 已选.value.filter(项 => 项 !== 名) : [...已选.value, 名];
}

function 移除(名: string): void {
  model.value = 已选.value.filter(项 => 项 !== 名);
}

function 描述(定义: 技能定义): string {
  const 硬币 = (定义.硬币威力 ?? 定义.硬币?.map(项 => 项.威力) ?? []).join('/');
  const 基础 = 定义.基础威力 ?? '—';
  return `${定义.类别}｜${定义.罪孽 ?? '无'}｜${定义.攻击类型 ?? '—'}｜基础${基础}｜硬币[${硬币 || '无'}]${定义.效果 ? `｜${定义.效果}` : ''}`;
}
</script>

<style scoped>
.skill-picker {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.picker-filters {
  display: grid;
  grid-template-columns: 1fr 140px;
  gap: 8px;
}

.picker-input,
.picker-select {
  width: 100%;
  padding: 7px 9px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
}

.picker-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.picker-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 5px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.picker-item:hover {
  background: rgba(217, 164, 65, 0.08);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag {
  font-size: 10px;
  padding: 0 5px;
  border: 1px solid var(--b-border);
  border-radius: 3px;
  color: var(--b-muted);
}

.tag.guard {
  border-style: dashed;
  color: #9fc6e0;
}

.tag.ego {
  border-color: var(--b-accent-2);
  color: var(--b-accent-2);
}

.picker-selected {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px dashed var(--b-border);
  border-radius: 6px;
  background: rgba(217, 164, 65, 0.05);
  max-height: 240px;
  overflow-y: auto;
}

.selected-title {
  font-size: 11px;
  color: var(--b-muted);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 11px;
}

.chip-del {
  border: none;
  background: transparent;
  color: #e88a7c;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.empty {
  font-size: 11px;
  color: var(--b-muted);
}

@media (max-width: 520px) {
  .picker-body {
    grid-template-columns: 1fr;
  }
}
</style>
