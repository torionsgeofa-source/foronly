<template>
  <div class="equip-card">
    <div class="equip-head">
      <span class="equip-tag">{{ 标签 }}</span>
      <input v-model="model.名称" class="equip-name" placeholder="装备名称" />
    </div>
    <textarea
      v-model="model.效果"
      class="equip-effect"
      :rows="2"
      placeholder="效果，如：生命加成+300；施加2层守护；获得10点护盾"
    />
    <div v-if="规范化" class="effect-preview">
      <div class="preview-line">
        <span class="preview-label">规范化</span>
        <span class="preview-text">{{ 规范化 }}</span>
      </div>
      <div v-for="(项, 下标) in 修复" :key="下标" class="preview-warn">⚠ {{ 项 }}</div>
      <div v-if="生命加成" class="preview-bonus">最大生命 +{{ 生命加成 }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 装备槽表单 } from '../types';
import { 规范化装备效果, 解析装备效果 } from '../../战斗/engine/效果解析';

defineProps<{ 标签: string }>();

const model = defineModel<装备槽表单>({ required: true });

const 解析结果 = computed(() => 解析装备效果(model.value.效果 || ''));
const 规范化 = computed(() => (model.value.效果.trim() ? 规范化装备效果(model.value.效果) : ''));
const 修复 = computed(() => 解析结果.value.修复);
const 生命加成 = computed(() =>
  解析结果.value.效果.reduce((和, 项) => (项.type === '生命加成' ? 和 + 项.数值 : 和), 0),
);
</script>

<style scoped>
.equip-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px 10px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.2);
}

.equip-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.equip-tag {
  flex: 0 0 auto;
  min-width: 52px;
  font-size: 11px;
  color: var(--b-accent-2);
  letter-spacing: 1px;
}

.equip-name {
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.equip-name:focus,
.equip-effect:focus {
  border-color: var(--b-accent-2);
  box-shadow: 0 0 0 2px rgba(217, 164, 65, 0.15);
}

.equip-effect {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  min-height: 44px;
  outline: none;
}

.effect-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 8px;
  border: 1px dashed var(--b-border);
  border-radius: 5px;
  background: rgba(217, 164, 65, 0.06);
  font-size: 11px;
  line-height: 1.6;
}

.preview-line {
  display: flex;
  gap: 6px;
  align-items: baseline;
}

.preview-label {
  flex: 0 0 auto;
  padding: 0 5px;
  border-radius: 3px;
  background: rgba(217, 164, 65, 0.18);
  color: var(--b-accent-2);
  font-size: 10px;
}

.preview-text {
  color: var(--b-text);
  word-break: break-all;
}

.preview-warn {
  color: #e88a7c;
}

.preview-bonus {
  color: var(--b-player);
}
</style>
