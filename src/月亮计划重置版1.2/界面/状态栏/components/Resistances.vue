<template>
  <div class="resistances">
    <div class="group-title">抗性 <span class="hint">（1 为基准 / &gt;1 抗性 / &lt;1 弱点）</span></div>
    <div class="res-block">
      <div class="res-subtitle">罪孽抗性</div>
      <div class="res-grid">
        <span v-for="罪孽 in 罪孽列表" :key="罪孽" class="res-chip" :class="抗性类(罪孽抗性[罪孽])">
          <span class="res-name">{{ 罪孽 }}</span>
          <span class="res-val">{{ 格式(罪孽抗性[罪孽]) }}</span>
        </span>
      </div>
    </div>
    <div class="res-block">
      <div class="res-subtitle">物理抗性</div>
      <div class="res-grid">
        <span v-for="(值, 名称) in 物理抗性" :key="名称" class="res-chip" :class="抗性类(值)">
          <span class="res-name">{{ 名称 }}</span>
          <span class="res-val">{{ 格式(值) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 罪孽抗性, 物理抗性 } from '../types';
import { 罪孽列表 } from '../constants';

defineProps<{ 罪孽抗性: 罪孽抗性; 物理抗性: 物理抗性 }>();

function 抗性类(值: number): string {
  if (值 > 1) return 'strong';
  if (值 < 1) return 'weak';
  return 'base';
}

function 格式(值: number): string {
  const 数字 = Number(值);
  return Number.isFinite(数字) ? `${数字.toFixed(2)}×` : '1.00×';
}
</script>

<style scoped>
.resistances {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--b-accent-2);
  letter-spacing: 1px;
}

.hint {
  font-size: 10px;
  font-weight: 400;
  color: var(--b-muted);
  letter-spacing: 0;
}

.res-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.res-subtitle {
  font-size: 11px;
  color: var(--b-muted);
}

.res-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.res-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid var(--b-border);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 11px;
}

.res-name {
  color: var(--b-muted);
}

.res-val {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.res-chip.base .res-val {
  color: var(--b-text);
}

.res-chip.strong {
  border-color: rgba(79, 163, 209, 0.7);
}

.res-chip.strong .res-val {
  color: #7fc6e0;
}

.res-chip.weak {
  border-color: rgba(200, 69, 47, 0.7);
}

.res-chip.weak .res-val {
  color: #e88a7c;
}
</style>
