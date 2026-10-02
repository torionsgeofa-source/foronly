<template>
  <div class="status-effects">
    <template v-if="条目.length">
      <span v-for="项 in 条目" :key="项.名称" class="effect-chip">
        <span class="effect-name">{{ 项.名称 }}</span>
        <span v-if="项.强度" class="effect-num">强度 {{ 项.强度 }}</span>
        <span v-if="项.层数" class="effect-stack">层数 {{ 项.层数 }}</span>
      </span>
    </template>
    <span v-else class="empty">无</span>
  </div>
</template>

<script setup lang="ts">
import type { 状态效果组 } from '../types';

const props = defineProps<{ 效果: 状态效果组 }>();

const 条目 = computed(() =>
  Object.entries(props.效果)
    .filter(([, 值]) => (值?.强度 ?? 0) !== 0 || (值?.层数 ?? 0) !== 0)
    .map(([名称, 值]) => ({ 名称, 强度: 值?.强度 ?? 0, 层数: 值?.层数 ?? 0 })),
);
</script>

<style scoped>
.status-effects {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.effect-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border: 1px solid rgba(200, 69, 47, 0.6);
  border-left-width: 3px;
  border-radius: 4px;
  background: rgba(200, 69, 47, 0.08);
  font-size: 11px;
  color: #e8b7ae;
}

.effect-name {
  font-weight: 700;
}

.effect-num,
.effect-stack {
  color: var(--b-muted);
  font-variant-numeric: tabular-nums;
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
