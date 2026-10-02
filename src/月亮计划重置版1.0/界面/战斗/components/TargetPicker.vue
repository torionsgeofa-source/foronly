<template>
  <div class="target-picker">
    <span class="hint">选择攻击目标</span>
    <button
      v-for="目标 in targets"
      :key="目标.名称"
      class="target-btn"
      :class="{ enemy: 目标.阵营 === '敌人' }"
      :disabled="!存活(目标)"
      @click="emit('pick', 目标.名称)"
    >
      <span class="target-name">{{ 目标.名称 }}</span>
      <span class="target-bar"><span class="target-bar-fill" :style="{ width: 血比(目标) }" /></span>
      <small>HP {{ Math.round(目标.生命值) }}/{{ 目标.生命上限 }}</small>
    </button>
    <button class="target-btn cancel" @click="emit('cancel')">取消</button>
  </div>
</template>

<script setup lang="ts">
import type { 战斗单位 } from '../engine/types';
import { 存活 } from '../engine/battle';

defineProps<{ targets: 战斗单位[] }>();
const emit = defineEmits<{ (e: 'pick', 名称: string): void; (e: 'cancel'): void }>();

function 血比(目标: 战斗单位): string {
  return `${Math.max(0, Math.min(100, (目标.生命值 / Math.max(1, 目标.生命上限)) * 100))}%`;
}
</script>

<style scoped>
.target-picker {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--b-accent-2);
  border-radius: 8px;
  background: linear-gradient(150deg, var(--b-surface-2), rgba(16, 13, 16, 0.9));
  box-shadow: 0 0 16px rgba(217, 164, 65, 0.15) inset;
}

.hint {
  font-size: 12px;
  font-weight: 700;
  color: var(--b-accent-2);
  margin-right: 4px;
}

.target-btn {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: stretch;
  min-width: 96px;
  padding: 5px 10px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: var(--b-surface);
  color: var(--b-text);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
  transition:
    border-color 0.15s,
    transform 0.12s,
    background 0.15s;
}

.target-btn:hover:not(:disabled) {
  border-color: var(--b-accent);
  transform: translateY(-1px);
}

.target-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.target-name {
  font-weight: 700;
}

.target-bar {
  height: 4px;
  border-radius: 2px;
  background: #0b080b;
  overflow: hidden;
}

.target-bar-fill {
  display: block;
  height: 100%;
  background: var(--b-hp);
  transition: width 0.5s ease;
}

.target-btn small {
  font-size: 10px;
  color: var(--b-muted);
}

.target-btn.cancel {
  border-color: var(--b-muted);
  color: var(--b-muted);
  align-items: center;
  justify-content: center;
}
</style>
