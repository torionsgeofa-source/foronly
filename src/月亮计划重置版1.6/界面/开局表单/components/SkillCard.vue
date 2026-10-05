<template>
  <div class="skill-card" :class="{ 'is-invalid': 有错误, collapsed: !展开 }">
    <div class="skill-head" @click="展开 = !展开">
      <span class="chevron">{{ 展开 ? '▾' : '▸' }}</span>
      <span class="skill-index">#{{ 序号 }}</span>
      <span class="skill-name" :class="{ untitled: !model.名称 }">{{ model.名称 || '未命名技能' }}</span>
      <span class="skill-tags">
        <span v-if="!是被动支援" class="tag" :style="{ color: 罪孽颜色[model.罪孽] ?? 'var(--b-muted)' }">{{ model.罪孽 || '无' }}</span>
        <span v-if="!是被动支援" class="tag">{{ model.攻击类型 || '打击' }}</span>
        <span class="tag" :class="{ guard: model.类别 === '守备', ego: model.类别 === 'EGO' }">{{ model.类别 || '战斗' }}</span>
        <span v-if="model.类别 === '守备' && model.守备类型" class="tag guard">{{ model.守备类型 }}</span>
        <span v-if="是被动支援 && model.时机" class="tag">{{ model.时机 }}</span>
        <span class="tag">{{ 硬币总数 }}币</span>
      </span>
      <button type="button" class="del-btn" @click.stop="emit('删除')">删除</button>
    </div>

    <div v-show="展开" class="skill-body">
      <SkillPanel v-model="编辑" :错误="错误" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SkillPanel from '../../共享/SkillPanel.vue';
import { 罪孽颜色, type 技能表单 } from '../types';

const model = defineModel<技能表单>({ required: true });

const props = defineProps<{
  序号: number;
  错误: Record<string, string>;
}>();

const emit = defineEmits<{ 删除: [] }>();

const 展开 = ref(!model.value.名称);

/** 共享编辑面板需要 技能编辑 (不含内部 _id); 字段就地修改, _id 保持不变 */
const 编辑 = computed({
  get: () => model.value,
  set: 值 => {
    model.value = { ...值, _id: model.value._id };
  },
});

const 有错误 = computed(() => Object.values(props.错误).some(Boolean));

const 是被动支援 = computed(() => model.value.类别 === '被动' || model.value.类别 === '支援');
const 是拼点技能 = computed(() => model.value.类别 === '战斗' || model.value.类别 === '守备' || model.value.类别 === 'EGO');
const 硬币总数 = computed(() => (是拼点技能.value ? model.value.硬币.length : 0));
</script>

<style scoped>
.skill-card {
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-border);
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.22);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.skill-card.is-invalid {
  border-left-color: var(--b-accent);
  box-shadow: 0 0 0 1px rgba(200, 69, 47, 0.35);
}

.skill-head {
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

.skill-index {
  font-size: 11px;
  font-weight: 800;
  color: var(--b-muted);
  font-variant-numeric: tabular-nums;
}

.skill-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--b-text);
  max-width: 34%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-name.untitled {
  color: var(--b-muted);
  font-style: italic;
  font-weight: 500;
}

.skill-tags {
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

.tag.guard {
  border-style: dashed;
  color: #9fc6e0;
}

.tag.ego {
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
  transition: border-color 0.15s, background 0.15s;
}

.del-btn:hover {
  border-color: var(--b-accent);
  background: rgba(200, 69, 47, 0.15);
}

.skill-body {
  padding: 10px;
  border-top: 1px dashed var(--b-border);
}

@media (max-width: 520px) {
  .skill-tags {
    display: none;
  }
}
</style>
