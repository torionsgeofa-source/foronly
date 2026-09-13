<template>
  <section class="section">
    <h3 class="section-head"><i class="fa fa-sack" /> 物品栏</h3>
    <div v-if="_.isEmpty(store.data.玩家.物品栏)" class="empty">暂无物品</div>
    <div v-for="(info, name) in store.data.玩家.物品栏" :key="name" class="item">
      <span class="item-name">{{ name }}</span>
      <span class="item-desc">{{ info.描述 }}</span>
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

.item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: var(--c-surface-raised);
  border-radius: 4px;
}

.item-name {
  font-weight: bold;
}

.item-desc {
  color: var(--c-text-muted);
  font-size: 12px;
}
</style>
