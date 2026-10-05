<template>
  <div class="interactions">
    <template v-if="对象列表.length">
      <div v-for="对象项 in 对象列表" :key="对象项.名称" class="npc-card">
        <div class="npc-head">
          <span class="npc-name">{{ 对象项.名称 }}</span>
          <span class="npc-identity">{{ 对象项.身份 || '未知' }}</span>
          <span class="npc-phys">{{ 对象项.生理状态 || '健康' }}</span>
        </div>
        <div class="npc-affection">
          <span class="aff-label">好感度</span>
          <Bar :value="对象项.好感度" :max="100" :color="好感色(对象项.好感度)" :value-text="`${Math.round(对象项.好感度)}/100`" />
        </div>
        <div class="npc-line"><span class="k">服饰</span><span class="v">{{ 对象项.服饰 || '默认服饰' }}</span></div>
        <div class="npc-line"><span class="k">当前行为</span><span class="v">{{ 对象项.当前行为 || '无' }}</span></div>
      </div>
    </template>
    <span v-else class="empty">无</span>
  </div>
</template>

<script setup lang="ts">
import type { 交互对象组 } from '../types';
import Bar from './Bar.vue';

const props = defineProps<{ 对象: 交互对象组 }>();

const 对象列表 = computed(() => Object.entries(props.对象 ?? {}).map(([名称, 值]) => ({ 名称, ...值 })));

function 好感色(值: number): string {
  const 数字 = Number(值) || 0;
  if (数字 >= 80) return '#e04b6a';
  if (数字 >= 50) return '#e05297';
  if (数字 >= 20) return '#b06aa0';
  return 'var(--b-muted)';
}
</script>

<style scoped>
.interactions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.npc-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 9px 11px;
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.npc-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.npc-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--b-text);
}

.npc-identity {
  font-size: 11px;
  color: var(--b-accent-2);
}

.npc-phys {
  margin-left: auto;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 6px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
}

.npc-affection {
  display: flex;
  align-items: center;
  gap: 6px;
}

.aff-label {
  flex: 0 0 auto;
  font-size: 10px;
  color: var(--b-muted);
}

.npc-line {
  display: flex;
  gap: 8px;
  font-size: 11px;
}

.npc-line .k {
  flex: 0 0 58px;
  color: var(--b-muted);
}

.npc-line .v {
  color: var(--b-text);
}

.empty {
  font-size: 12px;
  color: var(--b-muted);
}
</style>
