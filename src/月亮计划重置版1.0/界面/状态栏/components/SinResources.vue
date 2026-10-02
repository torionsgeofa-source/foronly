<template>
  <div class="sin-resources">
    <div class="group-title">罪孽资源</div>
    <div class="sin-grid">
      <span v-for="罪孽 in 罪孽列表" :key="罪孽" class="sin-chip" :style="{ borderColor: 罪孽颜色[罪孽] }">
        <span class="sin-dot" :style="{ background: 罪孽颜色[罪孽] }" />
        <span class="sin-name">{{ 罪孽 }}</span>
        <span class="sin-val">{{ 资源[罪孽] ?? 0 }}</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 罪孽资源 } from '../types';
import { 罪孽列表, 罪孽颜色 } from '../constants';

defineProps<{ 资源: 罪孽资源 }>();
</script>

<style scoped>
.sin-resources {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--b-accent-2);
  letter-spacing: 1px;
}

.sin-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.sin-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border: 1px solid var(--b-border);
  border-left-width: 3px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.25);
  font-size: 11px;
}

.sin-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex: 0 0 auto;
}

.sin-name {
  color: var(--b-muted);
}

.sin-val {
  margin-left: auto;
  font-weight: 800;
  color: var(--b-text);
  font-variant-numeric: tabular-nums;
}
</style>
