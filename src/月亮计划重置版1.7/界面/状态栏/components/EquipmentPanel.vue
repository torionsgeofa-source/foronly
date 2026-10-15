<template>
  <div class="equipment">
    <div v-if="条目.length === 0" class="equip-empty">无</div>
    <div v-for="项 in 条目" :key="项.名称" class="equip-item">
      <div class="equip-head">
        <span class="equip-name">{{ 项.名称 }}</span>
        <span v-if="项.相关科技 && 项.相关科技 !== '无'" class="equip-tech">{{ 项.相关科技 }}</span>
      </div>
      <p v-if="项.战斗效果" class="equip-line"><span class="k">战斗</span>{{ 项.战斗效果 }}</p>
      <p v-if="项.叙事效果" class="equip-line"><span class="k">叙事</span>{{ 项.叙事效果 }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 装备组 } from '../types';

const props = defineProps<{ 装备: 装备组 }>();

interface 装备项显示 {
  名称: string;
  叙事效果: string;
  战斗效果: string;
  相关科技: string;
}

const 条目 = computed<装备项显示[]>(() =>
  Object.entries(props.装备 ?? {}).map(([名称, 值]) => ({
    名称,
    叙事效果: String((值 as { 叙事效果?: unknown })?.叙事效果 ?? ''),
    战斗效果: String((值 as { 战斗效果?: unknown })?.战斗效果 ?? ''),
    相关科技: String((值 as { 相关科技?: unknown })?.相关科技 ?? '无'),
  })),
);
</script>

<style scoped>
.equipment {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.equip-empty {
  font-size: 11px;
  color: var(--b-muted);
}

.equip-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 9px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.equip-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.equip-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--b-text);
}

.equip-tech {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--b-accent-2);
  color: var(--b-accent-2);
}

.equip-line {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--b-muted);
  word-break: break-word;
}

.equip-line .k {
  display: inline-block;
  margin-right: 4px;
  color: var(--b-text);
  opacity: 0.7;
}
</style>
