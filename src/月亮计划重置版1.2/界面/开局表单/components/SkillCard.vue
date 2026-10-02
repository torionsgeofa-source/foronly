<template>
  <div class="skill-card" :class="{ 'is-invalid': 有错误, collapsed: !展开 }">
    <div class="skill-head" @click="展开 = !展开">
      <span class="chevron">{{ 展开 ? '▾' : '▸' }}</span>
      <span class="skill-index">#{{ 序号 }}</span>
      <span class="skill-name" :class="{ untitled: !model.名称 }">{{ model.名称 || '未命名技能' }}</span>
      <span class="skill-tags">
        <span class="tag" :style="{ color: 罪孽颜色[model.罪孽] ?? 'var(--b-muted)' }">{{ model.罪孽 || '无' }}</span>
        <span class="tag">{{ model.攻击类型 || '打击' }}</span>
        <span class="tag" :class="{ guard: model.类别 === '守备', ego: model.类别 === 'EGO' }">{{ model.类别 || '攻击' }}</span>
        <span v-if="model.类别 === '守备' && model.守备类型" class="tag guard">{{ model.守备类型 }}</span>
      </span>
      <button type="button" class="del-btn" @click.stop="emit('删除')">删除</button>
    </div>

    <div v-show="展开" class="skill-body">
      <div class="skill-grid">
        <FormField v-model="model.名称" class="span-2" label="名称" placeholder="技能名称" required :error="错误.名称" />
        <FormField v-model="model.罪孽" label="罪孽" type="select" :options="罪孽选项" />
        <FormField v-model="model.攻击类型" label="攻击类型" type="select" :options="攻击类型选项" />
        <FormField v-model="model.类别" label="类别" type="select" :options="技能类别选项" />
        <FormField v-if="model.类别 === '守备'" v-model="model.守备类型" label="守备类型" type="select" :options="守备类型选项" />
        <FormField v-model="model.基础威力" label="基础威力" type="number" placeholder="0" :error="错误.基础威力" />
        <FormField
          v-model="model.硬币威力"
          label="硬币威力"
          placeholder="逗号/空格分隔，如 3, 3, 4"
          :error="错误.硬币威力"
        />
        <FormField v-model="model.攻击等级修正" label="攻击等级修正" type="number" placeholder="可为负，如 -2" :error="错误.攻击等级修正" />
        <FormField v-model="model.攻击容量" label="攻击容量" type="number" placeholder="≥1" :error="错误.攻击容量" />
        <FormField v-model="model.SP消耗" label="SP消耗" type="number" placeholder="≥0" :error="错误.SP消耗" />
        <FormField
          v-model="model.效果"
          class="span-2"
          label="效果"
          type="textarea"
          :rows="2"
          placeholder="技能效果描述"
          :error="错误.效果"
        />
      </div>
      <div class="coin-row">
        <span class="coin-label">硬币威力解析：</span>
        <template v-if="硬币列表.length">
          <span v-for="(威力, 下标) in 硬币列表" :key="下标" class="coin">{{ 威力 }}</span>
          <span class="coin-count">共 {{ 硬币列表.length }} 枚</span>
        </template>
        <span v-else class="coin-empty">无（可留空）</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import FormField from './FormField.vue';
import { 罪孽选项, 攻击类型选项, 技能类别选项, 守备类型选项, 罪孽颜色, 解析硬币威力, type 技能表单 } from '../types';

const model = defineModel<技能表单>({ required: true });

const props = defineProps<{
  序号: number;
  错误: Record<string, string>;
}>();

const emit = defineEmits<{ 删除: [] }>();

const 展开 = ref(!model.value.名称);

const 有错误 = computed(() => Object.values(props.错误).some(Boolean));

const 硬币列表 = computed(() => 解析硬币威力(model.value.硬币威力).列表);

watch(
  () => model.value.类别,
  类别 => {
    if (类别 !== '守备') {
      model.value.守备类型 = '';
    } else if (!model.value.守备类型) {
      model.value.守备类型 = '闪避';
    }
  },
);
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
  max-width: 42%;
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

.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.span-2 {
  grid-column: span 2;
}

.coin-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--b-border);
  font-size: 11px;
}

.coin-label {
  color: var(--b-muted);
}

.coin {
  padding: 0 6px;
  border: 1px solid var(--b-accent-2);
  border-radius: 3px;
  background: rgba(217, 164, 65, 0.1);
  color: var(--b-accent-2);
  font-variant-numeric: tabular-nums;
}

.coin-count {
  color: var(--b-muted);
}

.coin-empty {
  color: var(--b-muted);
}

@media (max-width: 520px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }

  .skill-tags {
    display: none;
  }
}
</style>
