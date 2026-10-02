<template>
  <div class="skill-bar">
    <button
      v-for="技能 in 技能列表"
      :key="技能.名称"
      class="skill-chip"
      :class="{ selected: 技能.名称 === selected, defense: 技能.类别 === '守备', ego: 技能.类别 === 'EGO', unusable: !可用(技能) }"
      :disabled="disabled || !可用(技能)"
      :style="{ borderColor: 罪孽色(技能.罪孽) }"
      :title="技能.类别 === 'EGO' && !可用(技能) ? '罪孽资源不足或 SP ≤ -45，无法发动 E.G.O' : ''"
      @click="emit('select', 技能.名称)"
    >
      <span class="skill-name">
        <span v-if="槽位文本(技能)" class="slot-tag" :class="{ guard: 技能.槽位 === '守备' }">{{ 槽位文本(技能) }}</span>
        {{ 技能.名称 }}
        <span v-if="技能.类别 === 'EGO'" class="ego-tag">E.G.O</span>
      </span>
      <span class="skill-meta">
        <span class="sin" :style="{ background: 罪孽色(技能.罪孽) }" />
        {{ 技能.罪孽 }}
        <span class="meta-sep">·</span>
        <AttackIcon :类型="技能.攻击类型" class="meta-atk" />
        {{ 技能.攻击类型 }}
        <span v-if="技能.守备类型" class="defense-tag" :class="{ counter: 技能.守备类型 === '反击' || 技能.守备类型 === '强化反击' }">
          {{ 技能.守备类型 }}
        </span>
        <span v-else-if="技能.类别 === '守备'" class="defense-tag">守备</span>
      </span>
      <span v-if="技能.类别 === 'EGO'" class="ego-cost">消耗 资源{{ 资源消耗(技能) }} · SP{{ 理智消耗(技能) }}</span>
      <span class="skill-power">
        <span class="base-power">基础 {{ 技能.基础威力 }}</span>
        <span class="meta-sep">·</span>
        <span class="coin-minis">
          <span v-for="(威力, 下标) in 技能.硬币威力" :key="下标" class="coin-mini" :class="硬币类(技能.硬币类型[下标])">
            {{ 威力 }}
          </span>
        </span>
        <template v-if="技能.攻击容量 >= 1"><span class="meta-sep">·</span><span class="capacity-tag">容量 {{ 技能.攻击容量 }}</span></template>
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
  资源?: Record<string, number>;
  理智值?: number;
}>();

const emit = defineEmits<{ (e: 'select', 技能名: string): void }>();

const 技能列表 = computed(() => Object.values(props.skills));

/** 标准模板派生出的战斗技能槽位标签; 非标准技能回退到守备/空 */
function 槽位文本(技能: 技能): string {
  if (技能.槽位 !== undefined) return 技能.槽位 === '守备' ? '守备' : `${技能.槽位}`;
  return 技能.类别 === '守备' ? '守备' : '';
}

function 资源消耗(技能: 技能): number {
  return 技能.类别 === 'EGO' ? (技能.资源消耗 ?? 3) : 0;
}

function 理智消耗(技能: 技能): number {
  return 技能.类别 === 'EGO' ? (技能.SP消耗 ?? 10) : 0;
}

/** E.G.O 需对应罪孽资源足够且 SP > -45 才可选 */
function 可用(技能: 技能): boolean {
  if (技能.类别 !== 'EGO') return true;
  const 足够 = (props.资源?.[技能.罪孽] ?? 0) >= 资源消耗(技能);
  const 清醒 = (props.理智值 ?? 0) > -45;
  return 足够 && 清醒;
}

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

.skill-chip.ego {
  border-color: #d9a441;
  background: linear-gradient(150deg, rgba(61, 44, 18, 0.9), rgba(16, 13, 16, 0.9));
}

.skill-chip.unusable {
  opacity: 0.4;
  filter: grayscale(0.6);
}

.skill-name {
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.slot-tag {
  font-size: 9px;
  font-weight: 800;
  line-height: 1.6;
  padding: 0 4px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
  background: rgba(0, 0, 0, 0.3);
}

.slot-tag.guard {
  border-style: dashed;
  color: #9fc6e0;
}

.ego-tag {
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 0 4px;
  border-radius: 3px;
  color: #1b1207;
  background: linear-gradient(90deg, #d9a441, #f0d48a);
}

.ego-cost {
  font-size: 10px;
  color: var(--b-accent-2);
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

.defense-tag.counter {
  border-color: var(--b-accent);
  color: var(--b-accent);
}

.capacity-tag {
  color: var(--b-accent-2);
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
