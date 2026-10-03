<template>
  <div class="battle-summary">
    <div class="battle-head">
      <span class="round">第 {{ 战斗.回合 }} 回合</span>
      <span class="actor" :class="{ muted: !战斗.当前行动者 }">
        当前行动：{{ 战斗.当前行动者 || '—' }}
      </span>
      <span class="count">参战 {{ 单位列表.length }}</span>
    </div>

    <div v-if="战斗.速度顺序.length" class="speed-order">
      <span v-for="(名称, 下标) in 战斗.速度顺序" :key="`${名称}-${下标}`" class="speed-chip" :class="{ active: 名称 === 战斗.当前行动者 }">
        {{ 下标 + 1 }}. {{ 名称 }}
      </span>
    </div>

    <div v-if="单位列表.length" class="unit-list">
      <div v-for="单位 in 单位列表" :key="单位.名称" class="unit-card" :class="阵营类(单位)">
        <div class="unit-head">
          <span class="unit-name">{{ 单位.名称 }}</span>
          <span class="unit-camp">{{ 单位.阵营 }}</span>
          <span class="unit-lv">Lv.{{ 单位.等级 }}</span>
          <span class="unit-rank">{{ 单位._战力评级 }}</span>
        </div>
        <Bar
          label="HP"
          :value="单位.生命值"
          :max="单位.生命上限"
          color="var(--b-hp)"
          :value-text="`${Math.round(单位.生命值)}/${单位.生命上限}`"
        />
        <div v-if="单位.护盾 > 0" class="shield-line">
          <span class="shield-label">护盾</span>
          <span class="shield-num">{{ Math.round(单位.护盾) }}</span>
        </div>
        <Bar
          label="SP"
          :value="单位.理智值"
          :min="-45"
          :max="45"
          mid
          color="var(--b-sp)"
          :value-text="`${Math.round(单位.理智值)}`"
        />
        <Bar
          label="混乱"
          :value="单位.混乱值"
          :max="单位.混乱阈值"
          :color="单位.混乱阈值 > 0 && 单位.混乱值 >= 单位.混乱阈值 ? 'var(--b-accent)' : 'var(--b-chaos)'"
          :value-text="`${Math.round(单位.混乱值)}/${单位.混乱阈值}`"
        />
      </div>
    </div>
    <span v-else class="empty">无单位</span>
  </div>
</template>

<script setup lang="ts">
import type { 战斗, 战斗单位 } from '../types';
import Bar from './Bar.vue';

const props = defineProps<{ 战斗: 战斗 }>();

const 单位列表 = computed(() => Object.entries(props.战斗.单位 ?? {}).map(([名称, 值]) => ({ 名称, ...值 })));

function 阵营类(单位: 战斗单位 & { 名称: string }): string {
  return 单位.阵营 === '敌人' ? 'enemy' : 'ally';
}
</script>

<style scoped>
.battle-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.battle-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
}

.round {
  padding: 1px 8px;
  border: 1px solid var(--b-accent-2);
  border-radius: 10px;
  color: var(--b-accent-2);
}

.actor {
  color: var(--b-text);
}

.actor.muted,
.count {
  color: var(--b-muted);
}

.count {
  margin-left: auto;
  font-size: 11px;
}

.speed-order {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.speed-chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--b-border);
  background: var(--b-surface);
  color: var(--b-muted);
}

.speed-chip.active {
  border-color: var(--b-accent-2);
  color: var(--b-accent-2);
}

.unit-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.unit-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background: var(--b-surface);
}

.unit-card.ally {
  border-left: 3px solid var(--b-ally);
}

.unit-card.enemy {
  border-left: 3px solid var(--b-enemy);
}

.unit-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.unit-name {
  font-size: 13px;
  font-weight: 700;
}

.unit-camp,
.unit-lv {
  font-size: 10px;
  color: var(--b-muted);
}

.shield-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 1px 8px;
  border: 1px solid rgba(79, 163, 209, 0.7);
  border-radius: 8px;
  background: rgba(79, 163, 209, 0.12);
  font-size: 11px;
}

.shield-label {
  color: #9fc6e0;
  letter-spacing: 1px;
}

.shield-num {
  color: #cfe8f7;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.unit-rank {
  margin-left: auto;
  font-size: 10px;
  padding: 0 5px;
  border-radius: 4px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
