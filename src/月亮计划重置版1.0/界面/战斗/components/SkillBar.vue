<template>
  <div class="skill-bar">
    <button
      v-for="技能 in 技能列表"
      :key="技能.名称"
      class="skill-chip"
      :class="{ selected: 技能.名称 === selected, defense: 技能.类别 === '守备' }"
      :disabled="disabled"
      :style="{ borderColor: 罪孽色(技能.罪孽) }"
      @click="emit('select', 技能.名称)"
    >
      <span class="skill-name">{{ 技能.名称 }}</span>
      <span class="skill-meta">
        <span class="sin" :style="{ background: 罪孽色(技能.罪孽) }" />
        {{ 技能.罪孽 }}
        <span class="meta-sep">·</span>
        <AttackIcon :类型="技能.攻击类型" class="meta-atk" />
        {{ 技能.攻击类型 }}
        <span v-if="技能.类别 === '守备'" class="defense-tag">守备</span>
      </span>
      <span class="skill-power">
        <span class="base-power">基础 {{ 技能.基础威力 }}</span>
        <span class="meta-sep">·</span>
        <span class="coin-minis">
          <span v-for="(威力, 下标) in 技能.硬币威力" :key="下标" class="coin-mini" :class="硬币类(技能.硬币类型[下标])">
            {{ 威力 }}
          </span>
        </span>
        <template v-if="技能.攻击容量 > 1"><span class="meta-sep">·</span>容量 {{ 技能.攻击容量 }}</template>
      </span>
      <span v-if="技能.效果" class="skill-effect">{{ 技能.效果 }}</span>
    </button>
    <div v-if="技能列表.length === 0" class="empty">没有可用技能</div>
  </div>
</template>

<script setup lang="ts">
import type { 技能, 罪孽名, 硬币类型 } from '../engine/types';
import { 罪孽颜色 } from '../engine/types';
import AttackIcon from './AttackIcon.vue';

const props = defineProps<{
  skills: Record<string, 技能>;
  selected: string | null;
  disabled?: boolean;
}>();

const emit = defineEmits<{ (e: 'select', 技能名: string): void }>();

const 技能列表 = computed(() => Object.values(props.skills));

function 罪孽色(罪孽: string): string {
  return 罪孽颜色[罪孽 as 罪孽名] ?? '#888';
}

function 硬币类(类型: 硬币类型 | undefined): string {
  switch (类型) {
    case '不可摧毁':
      return 'red';
    case '截除':
      return 'green';
    case '无我':
      return 'purple';
    default:
      return 'normal';
  }
}
</script>

<style scoped>
.skill-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  padding: 6px 10px;
  border: 1px solid var(--b-border);
  border-left-width: 3px;
  border-radius: 5px;
  background: linear-gradient(150deg, var(--b-surface), rgba(16, 13, 16, 0.85));
  color: var(--b-text);
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.12s,
    box-shadow 0.15s;
  font-family: inherit;
}

.skill-chip:hover:not(:disabled) {
  background: var(--b-surface-2);
  transform: translateY(-1px);
}

.skill-chip.selected {
  box-shadow: 0 0 0 2px var(--b-accent-2), 0 0 14px rgba(217, 164, 65, 0.3);
  background: var(--b-surface-2);
}

.skill-chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.skill-chip.defense {
  border-style: dashed;
}

.skill-name {
  font-weight: 700;
  font-size: 13px;
}

.skill-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--b-muted);
}

.sin {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.meta-sep {
  color: var(--b-border);
}

.meta-atk {
  font-size: 12px;
}

.defense-tag {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 3px;
  border: 1px dashed var(--b-muted);
  color: var(--b-muted);
}

.skill-power {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: var(--b-muted);
}

.base-power {
  color: var(--b-text);
  font-weight: 700;
}

.coin-minis {
  display: inline-flex;
  gap: 3px;
}

.coin-mini {
  padding: 0 3px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  background: rgba(0, 0, 0, 0.3);
  color: var(--b-text);
}

.coin-mini.normal {
  border-color: #c8c8d0;
}

.coin-mini.red {
  border-color: #e0503a;
  color: #f0a090;
}

.coin-mini.green {
  border-color: #4fbf6a;
  color: #a0e0b0;
}

.coin-mini.purple {
  border-color: #a05de0;
  color: #c8a0f0;
}

.skill-effect {
  font-size: 10px;
  color: var(--b-accent-2);
  opacity: 0.85;
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
