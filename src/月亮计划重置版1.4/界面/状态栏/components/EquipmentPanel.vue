<template>
  <div class="equipment">
    <div v-for="项 in 条目" :key="项.名称" class="equip-item">
      <span class="equip-label">{{ 项.名称 }}</span>
      <span class="equip-value">{{ 项.槽.名称 || '无' }}</span>
      <span v-if="项.槽.效果" class="equip-effect">{{ 项.槽.效果 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 穿着装备 } from '../types';

const props = defineProps<{ 装备: 穿着装备 }>();

interface 装备槽显示 {
  名称: string;
  效果: string;
}

function 读槽(值: unknown): 装备槽显示 {
  if (typeof 值 === 'string') return { 名称: 值, 效果: '' };
  const 对象 = (值 ?? {}) as { 名称?: unknown; 效果?: unknown };
  return { 名称: String(对象.名称 ?? ''), 效果: String(对象.效果 ?? '') };
}

const 条目 = computed(() => [
  { 名称: '上衣', 槽: 读槽(props.装备.上衣) },
  { 名称: '下装', 槽: 读槽(props.装备.下装) },
  { 名称: '武器', 槽: 读槽(props.装备.武器) },
  { 名称: '防具', 槽: 读槽(props.装备.防具) },
  { 名称: '物品', 槽: 读槽(props.装备.物品) },
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

.equip-effect {
  font-size: 10px;
  color: var(--b-muted);
  line-height: 1.4;
  word-break: break-word;
}
</style>
