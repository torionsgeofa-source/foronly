<template>
  <div class="equip-card" :class="{ collapsed: !展开 }">
    <div class="equip-head" @click="展开 = !展开">
      <span class="chevron">{{ 展开 ? '▾' : '▸' }}</span>
      <span class="equip-index">#{{ 序号 }}</span>
      <span class="equip-name" :class="{ untitled: !model.名称 }">{{ model.名称 || '未命名装备' }}</span>
      <span class="equip-tags">
        <span v-if="model.相关科技 && model.相关科技 !== '无'" class="tag tech">{{ model.相关科技 }}</span>
        <span v-if="model.战斗效果" class="tag">战斗效果</span>
      </span>
      <button type="button" class="del-btn" @click.stop="emit('删除')">删除</button>
    </div>

    <div v-show="展开" class="equip-body">
      <label class="equip-field">
        <span class="field-label">装备名称</span>
        <input v-model="model.名称" class="field-input" placeholder="例：赤色短刀" />
      </label>
      <label class="equip-field">
        <span class="field-label">相关科技</span>
        <input v-model="model.相关科技" class="field-input" placeholder="普通装备填「无」；如 K公司奇点科技 / E.G.O 装备" />
      </label>
      <label class="equip-field">
        <span class="field-label">战斗效果（规范效果）</span>
        <textarea v-model="model.战斗效果" class="field-input" rows="2" placeholder="施加2层强壮；获得5点护盾；生命加成+30 （多条用 ； 分隔；+N生命值 会规范成 生命加成+N）"></textarea>
        <span v-if="规范化" class="equip-norm">规范化：{{ 规范化 }}</span>
      </label>
      <label class="equip-field">
        <span class="field-label">叙事效果（仅剧情）</span>
        <textarea v-model="model.叙事效果" class="field-input" rows="2" placeholder="仅作用于剧情、不参与战斗结算的效果，如「佩者周身萦绕血雾，令人不安」"></textarea>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 规范化装备效果 } from '../../战斗/engine/效果解析';
import type { 装备表单 } from '../types';

const model = defineModel<装备表单>({ required: true });
defineProps<{ 序号: number }>();

const emit = defineEmits<{ 删除: [] }>();

const 展开 = ref(!model.value.名称);
const 规范化 = computed(() => (model.value.战斗效果.trim() ? 规范化装备效果(model.value.战斗效果) : ''));
</script>

<style scoped>
.equip-card {
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-border);
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.22);
  overflow: hidden;
}

.equip-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  user-select: none;
  background: rgba(36, 29, 36, 0.6);
}

.chevron {
  font-size: 11px;
  color: var(--b-accent-2);
  width: 12px;
  text-align: center;
}

.equip-index {
  font-size: 11px;
  font-weight: 800;
  color: var(--b-muted);
  font-variant-numeric: tabular-nums;
}

.equip-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--b-text);
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.equip-name.untitled {
  color: var(--b-muted);
  font-style: italic;
  font-weight: 500;
}

.equip-tags {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.tag {
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  border: 1px solid var(--b-border);
  color: var(--b-muted);
  white-space: nowrap;
}

.tag.tech {
  border-color: var(--b-accent-2);
  color: var(--b-accent-2);
}

.del-btn {
  flex: 0 0 auto;
  padding: 3px 10px;
  border: 1px solid var(--b-border);
  border-radius: 4px;
  background: transparent;
  color: #e88a7c;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.del-btn:hover {
  border-color: var(--b-accent);
  background: rgba(200, 69, 47, 0.15);
}

.equip-body {
  padding: 10px;
  border-top: 1px dashed var(--b-border);
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.equip-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  color: var(--b-muted);
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 8px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.3);
  color: var(--b-text);
  font-family: inherit;
  font-size: 12px;
  resize: vertical;
}

.equip-norm {
  font-size: 10px;
  color: var(--b-accent-2);
  line-height: 1.4;
  word-break: break-word;
}
</style>
