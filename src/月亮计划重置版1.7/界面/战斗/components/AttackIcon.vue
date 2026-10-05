<template>
  <span class="atk-icon" :class="类型" :title="类型">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <template v-if="类型 === '斩击'">
        <path d="M4 20 L20 4" />
        <path d="M9 20 L20 9" />
      </template>
      <template v-else-if="类型 === '突刺'">
        <path d="M4 20 L18 6" />
        <path d="M18 6 H12" />
        <path d="M18 6 V12" />
      </template>
      <template v-else>
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 1.5 V5" />
        <path d="M12 19 V22.5" />
        <path d="M1.5 12 H5" />
        <path d="M19 12 H22.5" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
import type { 攻击类型名 } from '../engine/types';

defineProps<{ 类型: 攻击类型名 }>();
</script>

<style scoped>
.atk-icon {
  display: inline-flex;
  width: 1em;
  height: 1em;
  flex: 0 0 auto;
  vertical-align: middle;
}

.atk-icon svg {
  width: 100%;
  height: 100%;
}

.atk-icon.斩击 {
  color: #d8d8d8;
}

.atk-icon.突刺 {
  color: #7fd4a0;
}

.atk-icon.打击 {
  color: #e0b06a;
}
</style>
