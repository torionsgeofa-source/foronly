<template>
  <div class="status-panel">
    <StatusHeader
      :世界状态="data.世界状态"
      :基础信息="data.玩家状态.基础信息"
      :生命体征="data.玩家状态.生命体征"
      :战斗属性="data.玩家状态.战斗属性"
    />

    <details class="section" open>
      <summary class="section-title">资源与抗性</summary>
      <div class="resource-grid">
        <SinResources :资源="data.玩家状态.罪孽资源" />
        <Resistances :罪孽抗性="data.玩家状态.罪孽抗性" :物理抗性="data.玩家状态.物理抗性" />
      </div>
    </details>

    <details class="section">
      <summary class="section-title">状态效果</summary>
      <StatusEffects :效果="data.玩家状态.状态效果" />
    </details>

    <details class="section">
      <summary class="section-title">技能</summary>
      <SkillsPanel :技能="data.玩家状态.技能" />
    </details>

    <details class="section">
      <summary class="section-title">着装装备</summary>
      <EquipmentPanel :装备="data.玩家状态.穿着装备" />
    </details>

    <details class="section">
      <summary class="section-title">背包</summary>
      <InventoryPanel :背包="data.玩家状态.背包" />
    </details>

    <details class="section">
      <summary class="section-title">交互对象</summary>
      <InteractionsPanel :对象="data.交互对象" />
    </details>

    <details v-if="data.战斗.进行中" class="section battle-section" open>
      <summary class="section-title">战斗摘要 · 第 {{ data.战斗.回合 }} 回合</summary>
      <BattleSummary :战斗="data.战斗" />
    </details>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import StatusHeader from './components/StatusHeader.vue';
import SinResources from './components/SinResources.vue';
import Resistances from './components/Resistances.vue';
import StatusEffects from './components/StatusEffects.vue';
import SkillsPanel from './components/SkillsPanel.vue';
import EquipmentPanel from './components/EquipmentPanel.vue';
import InventoryPanel from './components/InventoryPanel.vue';
import InteractionsPanel from './components/InteractionsPanel.vue';
import BattleSummary from './components/BattleSummary.vue';

const store = useDataStore();
const data = store.data;
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

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.battle-section {
  border-color: rgba(200, 69, 47, 0.55);
}
</style>
