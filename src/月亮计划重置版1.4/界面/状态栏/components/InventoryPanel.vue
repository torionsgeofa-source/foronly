<template>
  <div class="inventory">
    <div class="money-row">
      <span class="money-icon">👁</span>
      <span class="money-label">钱财 · 眼</span>
      <span class="money-val">{{ 背包.钱财_眼 }}</span>
    </div>
    <div class="item-list">
      <template v-if="物品列表.length">
        <div v-for="物品 in 物品列表" :key="物品.名称" class="item-row">
          <span class="item-name">{{ 物品.名称 }}</span>
          <span class="item-count">×{{ 物品.数量 }}</span>
        </div>
      </template>
      <span v-else class="empty">无</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 背包 } from '../types';

const props = defineProps<{ 背包: 背包 }>();

const 物品列表 = computed(() =>
  Object.entries(props.背包.拥有的物品 ?? {})
    .filter(([, 值]) => (值?.数量 ?? 0) > 0)
    .map(([名称, 值]) => ({ 名称, 数量: 值.数量 })),
);
</script>

<style scoped>
.inventory {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.money-row {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 9px;
  border: 1px solid var(--b-border);
  border-radius: 4px;
  background: rgba(217, 164, 65, 0.07);
}

.money-icon {
  color: var(--b-accent-2);
}

.money-label {
  font-size: 11px;
  color: var(--b-muted);
}

.money-val {
  margin-left: auto;
  font-size: 13px;
  font-weight: 800;
  color: var(--b-accent-2);
  font-variant-numeric: tabular-nums;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 9px;
  border-bottom: 1px dashed var(--b-border);
  font-size: 12px;
}

.item-name {
  color: var(--b-text);
}

.item-count {
  color: var(--b-muted);
  font-variant-numeric: tabular-nums;
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
