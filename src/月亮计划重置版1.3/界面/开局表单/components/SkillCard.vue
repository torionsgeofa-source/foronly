<template>
  <div class="skill-card" :class="{ 'is-invalid': 有错误, collapsed: !展开 }">
    <div class="skill-head" @click="展开 = !展开">
      <span class="chevron">{{ 展开 ? '▾' : '▸' }}</span>
      <span class="skill-index">#{{ 序号 }}</span>
      <span class="skill-name" :class="{ untitled: !model.名称 }">{{ model.名称 || '未命名技能' }}</span>
      <span class="skill-tags">
        <span class="tag" :style="{ color: 罪孽颜色[model.罪孽] ?? 'var(--b-muted)' }">{{ model.罪孽 || '无' }}</span>
        <span class="tag">{{ model.攻击类型 || '打击' }}</span>
        <span class="tag" :class="{ guard: model.类别 === '守备', ego: model.类别 === 'EGO' }">{{ model.类别 || '战斗' }}</span>
        <span v-if="model.类别 === '守备' && model.守备类型" class="tag guard">{{ model.守备类型 }}</span>
        <span v-if="(model.类别 === '被动' || model.类别 === '支援') && model.时机" class="tag">{{ model.时机 }}</span>
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
        <FormField
          v-if="model.类别 === '被动' || model.类别 === '支援'"
          v-model="model.时机"
          label="时机"
          type="select"
          :options="时机选项"
        />
        <FormField
          v-if="model.类别 === '被动' || model.类别 === '支援'"
          v-model="model.条件"
          label="条件"
          placeholder="如：生命低于50%（可留空）"
        />
        <FormField v-model="model.基础威力" label="基础威力" type="number" placeholder="0" :error="错误.基础威力" />
        <FormField
          v-model="model.硬币威力"
          label="硬币威力"
          placeholder="逗号/空格分隔，如 3, 3, 4"
          :error="错误.硬币威力"
        />
        <FormField
          v-model="model.攻击等级修正"
          label="攻击等级修正"
          type="number"
          placeholder="-8 ~ +8"
          hint="使用该技能时的攻击等级增减：该技能拼点时的有效攻击等级 = 角色攻击等级 + 此值。范围 -8 ~ +8，越高越容易拼赢、伤害越高；填 0 表示不加不减。"
          :error="错误.攻击等级修正"
        />
        <FormField v-model="model.攻击容量" label="攻击容量" type="number" placeholder="≥1" :error="错误.攻击容量" />
        <FormField v-model="model.SP消耗" label="SP消耗" type="number" placeholder="≥0" :error="错误.SP消耗" />
        <FormField
          v-model="model.效果"
          class="span-2"
          label="效果"
          type="textarea"
          :rows="2"
          :placeholder="是被动支援 ? '如：施加2层迅捷；恢复5点SP' : '技能效果描述'"
          :error="错误.效果"
        />
        <div v-if="是被动支援" class="effect-preview span-2">
          <div class="preview-line">
            <span class="preview-label">规范化</span>
            <span class="preview-text">{{ 规范化预览 || '（暂无可识别效果）' }}</span>
          </div>
          <div v-for="(项, 下标) in 效果修复" :key="下标" class="preview-warn">⚠ {{ 项 }}</div>
        </div>
        <div v-if="是被动支援" class="preset-row span-2">
          <span class="preset-label">常用</span>
          <button v-for="预设 in 效果预设" :key="预设" type="button" class="preset-btn" @click="插入预设(预设)">
            {{ 预设 }}
          </button>
        </div>
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
import { 罪孽选项, 攻击类型选项, 技能类别选项, 时机选项, 守备类型选项, 罪孽颜色, 解析硬币威力, type 技能表单 } from '../types';
import { 规范化效果, 解析效果 } from '../../战斗/engine/效果解析';

const model = defineModel<技能表单>({ required: true });

const props = defineProps<{
  序号: number;
  错误: Record<string, string>;
}>();

const emit = defineEmits<{ 删除: [] }>();

const 展开 = ref(!model.value.名称);

const 有错误 = computed(() => Object.values(props.错误).some(Boolean));

const 硬币列表 = computed(() => 解析硬币威力(model.value.硬币威力).列表);

const 是被动支援 = computed(() => model.value.类别 === '被动' || model.value.类别 === '支援');
const 规范化预览 = computed(() => (是被动支援.value ? 规范化效果(model.value.效果) : ''));
const 效果修复 = computed(() => (是被动支援.value ? 解析效果(model.value.效果).修复 : []));
const 效果预设 = ['施加1层迅捷', '施加1层攻击等级提升', '恢复5点SP', '恢复10点生命', '施加1层守护', '震颤引爆'];

function 插入预设(文本: string): void {
  const 当前 = model.value.效果.trim();
  model.value.效果 = 当前 ? `${当前}；${文本}` : 文本;
}

watch(
  () => model.value.类别,
  类别 => {
    if (类别 !== '守备') {
      model.value.守备类型 = '';
    } else if (!model.value.守备类型) {
      model.value.守备类型 = '闪避';
    }
    if (类别 === '被动' || 类别 === '支援') {
      if (!model.value.时机) model.value.时机 = '回合开始时';
    } else {
      model.value.时机 = '';
      model.value.条件 = '';
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

.effect-preview {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
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

.preset-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.preset-label {
  font-size: 10px;
  color: var(--b-muted);
}

.preset-btn {
  padding: 2px 7px;
  border: 1px solid var(--b-border);
  border-radius: 4px;
  background: transparent;
  color: var(--b-ally);
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.preset-btn:hover {
  border-color: var(--b-ally);
  background: rgba(80, 140, 200, 0.12);
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
