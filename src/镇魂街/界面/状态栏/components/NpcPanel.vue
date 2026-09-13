<template>
  <section class="section">
    <h3 class="section-head"><i class="fa fa-users" /> 结识的角色</h3>
    <div v-if="_.isEmpty(store.data.NPC)" class="empty">暂无结识的角色</div>
    <div v-for="(info, name) in store.data.NPC" :key="name" class="npc-item">
      <div class="npc-head">
        <span class="item-name">{{ name }}</span>
        <span class="favor"><i class="fa fa-heart" /> {{ info.好感度 }}</span>
      </div>
      <div class="favor-track">
        <div class="favor-fill" :style="{ width: info.好感度 + '%' }" />
      </div>
      <span class="item-desc">{{ info.与主角关系 }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { useDataStore } from '../../store';

const store = useDataStore();
</script>

<style lang="scss" scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-head {
  font-size: 12px;
  color: var(--c-accent);
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 4px;
}

.section-head i {
  margin-right: 6px;
}

.empty {
  color: var(--c-text-muted);
  font-size: 12px;
}

.npc-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: var(--c-surface-raised);
  border-radius: 4px;
}

.npc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-name {
  font-weight: bold;
}

.favor {
  color: var(--c-primary);
  font-size: 12px;
}

.favor-track {
  height: 6px;
  border-radius: 3px;
  background: var(--c-surface);
  overflow: hidden;
}

.favor-fill {
  height: 100%;
  background: var(--c-primary);
  transition: width 0.25s ease;
}

.item-desc {
  color: var(--c-text-muted);
  font-size: 12px;
}
</style>
