<template>
  <div class="equipment">
    <div v-for="项 in 条目" :key="项.名称" class="equip-item">
      <span class="equip-label">{{ 项.名称 }}</span>
      <span class="equip-value">{{ 项.值 || '无' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 穿着装备 } from '../types';

const props = defineProps<{ 装备: 穿着装备 }>();

const 条目 = computed(() => [
  { 名称: '上衣', 值: props.装备.上衣 },
  { 名称: '下装', 值: props.装备.下装 },
  { 名称: '武器', 值: props.装备.武器 },
  { 名称: '防具', 值: props.装备.防具 },
  { 名称: '物品', 值: props.装备.物品 },
]);
</script>

<style scoped>
.equipment {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.equip-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 9px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.equip-label {
  font-size: 10px;
  color: var(--b-muted);
}

.equip-value {
  font-size: 12px;
  color: var(--b-text);
  font-weight: 600;
  word-break: break-word;
}
</style>
