<template>
  <div class="card">
    <div class="title-bar" @click="expanded = !expanded">
      <span class="name">{{ store.data.玩家.角色名 || '未设定' }}</span>
      <span class="identity">{{ store.data.玩家.身份来源 }}</span>
      <span class="meta">{{ store.data.世界.当前时间节点 }} · {{ store.data.世界.当前区域 }}</span>
      <i :class="expanded ? 'fa fa-chevron-up' : 'fa fa-chevron-down'" />
    </div>

    <div v-if="expanded" class="panel">
      <GuardianPanel />
      <AbilityPanel />
      <InventoryPanel />
      <NpcPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDataStore } from '../store';
import GuardianPanel from './components/GuardianPanel.vue';
import AbilityPanel from './components/AbilityPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import NpcPanel from './components/NpcPanel.vue';

const store = useDataStore();
const expanded = ref(false);
</script>

<style lang="scss" scoped>
.card {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  color: var(--c-text);
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
}

.title-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  background: var(--c-surface-raised);
  border-bottom: 1px solid var(--c-border);
}

.name {
  font-weight: bold;
  color: var(--c-primary);
}

.identity {
  padding: 1px 8px;
  border: 1px solid var(--c-accent);
  border-radius: 10px;
  color: var(--c-accent);
  font-size: 11px;
}

.meta {
  flex: 1;
  color: var(--c-text-muted);
  font-size: 12px;
  text-align: right;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
}
</style>
