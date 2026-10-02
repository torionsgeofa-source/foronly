<template>
  <div class="status-panel">
    <div class="panel-toolbar">
      <span class="toolbar-title">状态档案</span>
      <button class="toolbar-btn" @click="展开 = !展开">{{ 展开 ? '收起详情' : '展开详情' }}</button>
    </div>

    <StatusHeader
      :世界状态="data.世界状态"
      :基础信息="data.玩家状态.基础信息"
      :生命体征="data.玩家状态.生命体征"
      :战斗属性="data.玩家状态.战斗属性"
      :状态效果="data.玩家状态.状态效果"
    />

    <details class="section" :open="展开">
      <summary class="section-title">抗性</summary>
      <Resistances :罪孽抗性="data.玩家状态.罪孽抗性" :物理抗性="data.玩家状态.物理抗性" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">状态效果</summary>
      <StatusEffects :效果="data.玩家状态.状态效果" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">技能</summary>
      <SkillsPanel :技能="data.玩家状态.技能" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">着装装备</summary>
      <EquipmentPanel :装备="data.玩家状态.穿着装备" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">背包</summary>
      <InventoryPanel :背包="data.玩家状态.背包" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">交互对象</summary>
      <InteractionsPanel :对象="data.交互对象" />
    </details>

    <details class="section" :open="展开">
      <summary class="section-title">角色档案</summary>
      <RosterPanel :角色="data.角色" />
    </details>

    <details v-if="data.战斗.进行中" class="section battle-section" :open="展开">
      <summary class="section-title">战斗摘要 · 第 {{ data.战斗.回合 }} 回合</summary>
      <BattleSummary :战斗="data.战斗" />
    </details>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import StatusHeader from './components/StatusHeader.vue';
import Resistances from './components/Resistances.vue';
import StatusEffects from './components/StatusEffects.vue';
import SkillsPanel from './components/SkillsPanel.vue';
import EquipmentPanel from './components/EquipmentPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import InteractionsPanel from './components/InteractionsPanel.vue';
import RosterPanel from './components/RosterPanel.vue';
import BattleSummary from './components/BattleSummary.vue';

const store = useDataStore();
const data = store.data;

const 展开 = ref(false);
</script>

<style scoped>
.status-panel {
  width: 100%;
  max-width: 720px;
  margin: 16px auto;
  padding: 14px;
  border-radius: 10px;
  background: var(--b-bg);
  border: 1px solid var(--b-border);
  color: var(--b-text);
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  animation: panel-in 0.35s ease;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.panel-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px;
}

.toolbar-title {
  font-size: 11px;
  letter-spacing: 3px;
  color: var(--b-muted);
}

.toolbar-btn {
  padding: 3px 12px;
  border: 1px solid var(--b-accent-2);
  border-radius: 12px;
  background: rgba(217, 164, 65, 0.08);
  color: var(--b-accent-2);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.toolbar-btn:hover {
  background: rgba(217, 164, 65, 0.2);
  box-shadow: 0 0 10px rgba(217, 164, 65, 0.25);
}

.section {
  border: 1px solid var(--b-border);
  border-radius: 6px;
  background: rgba(27, 22, 27, 0.6);
}

.section-title {
  cursor: pointer;
  list-style: none;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--b-accent-2);
}

.section-title::-webkit-details-marker {
  display: none;
}

.section-title::before {
  content: '▸';
  display: inline-block;
  margin-right: 7px;
  color: var(--b-muted);
  transition: transform 0.2s;
}

.section[open] > .section-title::before {
  transform: rotate(90deg);
}

.section > :not(summary) {
  padding: 0 12px 12px;
}

.battle-section {
  border-color: rgba(200, 69, 47, 0.55);
}
</style>
