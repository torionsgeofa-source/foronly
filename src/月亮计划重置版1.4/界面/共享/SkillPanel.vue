<template>
  <div class="skill-panel">
    <div class="skill-grid">
      <label v-if="显示名称" class="field span-2">
        <span class="field-label">名称<span class="req">*</span></span>
        <input v-model="model.名称" class="field-input" placeholder="技能名称" />
        <span v-if="错误.名称" class="field-error">{{ 错误.名称 }}</span>
      </label>

      <label class="field">
        <span class="field-label">类别</span>
        <select v-model="model.类别" class="field-input">
          <option v-for="项 in 技能类别选项" :key="项" :value="项">{{ 项 }}</option>
        </select>
      </label>

      <template v-if="!是被动支援">
        <label class="field">
          <span class="field-label">罪孽</span>
          <select v-model="model.罪孽" class="field-input">
            <option v-for="项 in 罪孽可选项" :key="项" :value="项">{{ 项 }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">攻击类型</span>
          <select v-model="model.攻击类型" class="field-input">
            <option v-for="项 in 攻击类型选项" :key="项" :value="项">{{ 项 }}</option>
          </select>
        </label>
        <label v-if="model.类别 === '守备'" class="field">
          <span class="field-label">守备类型</span>
          <select v-model="model.守备类型" class="field-input">
            <option v-for="项 in 守备类型选项" :key="项" :value="项">{{ 项 }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">攻击等级修正</span>
          <input v-model.number="model.攻击等级修正" type="number" class="field-input" placeholder="-8 ~ +8" />
          <span v-if="错误.攻击等级修正" class="field-error">{{ 错误.攻击等级修正 }}</span>
        </label>
        <label class="field">
          <span class="field-label">攻击容量</span>
          <input v-model.number="model.攻击容量" type="number" min="1" class="field-input" placeholder="≥1" />
          <span v-if="错误.攻击容量" class="field-error">{{ 错误.攻击容量 }}</span>
        </label>
        <label v-if="model.类别 === 'EGO'" class="field">
          <span class="field-label">SP消耗</span>
          <input v-model.number="model.SP消耗" type="number" min="0" class="field-input" placeholder="≥0" />
          <span v-if="错误.SP消耗" class="field-error">{{ 错误.SP消耗 }}</span>
        </label>
      </template>

      <template v-else>
        <label class="field">
          <span class="field-label">时机</span>
          <select v-model="model.时机" class="field-input">
            <option v-for="项 in 时机选项" :key="项" :value="项">{{ 项 }}</option>
          </select>
        </label>
        <label class="field">
          <span class="field-label">条件（可留空）</span>
          <input v-model="model.条件" class="field-input" placeholder="如：生命低于50%" />
        </label>
      </template>

      <label class="field span-2">
        <span class="field-label">描述（仅剧情，供 AI 描写，不参与运算）</span>
        <textarea
          v-model="model.描述"
          class="field-input"
          rows="2"
          placeholder="例：一记自下而上的斩击，带起一道血线。"
        />
      </label>
    </div>

    <div v-if="是拼点技能" class="coin-block">
      <div class="block-head">
        <span>硬币（每枚可独立设计命中效果）</span>
        <button type="button" class="mini-add" @click="添加硬币">＋ 添加硬币</button>
      </div>
      <div v-for="(硬币, 下标) in model.硬币" :key="下标" class="coin-card">
        <div class="coin-row">
          <span class="coin-no">#{{ 下标 + 1 }}</span>
          <input v-model.number="硬币.威力" type="number" class="coin-power" placeholder="威力" />
          <select v-model="硬币.类型" class="coin-type">
            <option v-for="项 in 硬币类型选项" :key="项" :value="项">{{ 项 }}</option>
          </select>
          <button type="button" class="mini-btn" @click="切换硬币(下标)">
            {{ 展开硬币[下标] ? '收起效果' : `命中效果 (${(硬币.命中效果 ?? []).length})` }}
          </button>
          <button type="button" class="mini-btn danger" @click="删除硬币(下标)">删除</button>
        </div>
        <div v-if="展开硬币[下标]" class="coin-effect">
          <EffectEditor v-model="硬币.命中效果" />
        </div>
      </div>
      <div v-if="model.硬币.length === 0" class="block-empty">尚无硬币，可留空（将默认 1 枚）。</div>
    </div>

    <div v-else class="effect-block">
      <div class="block-head">
        <span>效果（被动 / 支援，仅可作用于自己 / 盟友）</span>
      </div>
      <EffectEditor v-model="model.效果" :允许目标="被动支援目标" />
      <div v-if="model.效果.length" class="canonical">规范句：{{ model.效果.map(序列化效果).join('；') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import EffectEditor from './EffectEditor.vue';
import { 序列化效果 } from '../战斗/engine/效果解析';
import type { 效果目标 } from '../战斗/engine/types';
import {
  类别选项 as 技能类别选项,
  罪孽选项,
  攻击类型选项,
  守备类型选项,
  时机选项,
  硬币类型选项,
} from '../技能库/types';
import type { 技能编辑 } from './技能编辑';

/** 被动 / 支援仅可作用于自己或盟友, 禁用 敌人 / 全体敌人 目标 */
const 被动支援目标: 效果目标[] = ['自己', '随机盟友', '全体盟友'];

const model = defineModel<技能编辑>({ required: true });
withDefaults(defineProps<{ 错误?: Record<string, string>; 显示名称?: boolean }>(), {
  错误: () => ({}),
  显示名称: true,
});

const 罪孽可选项 = ['无', ...罪孽选项];

const 展开硬币 = ref<Record<number, boolean>>({});

const 是被动支援 = computed(() => model.value.类别 === '被动' || model.value.类别 === '支援');
const 是拼点技能 = computed(() => model.value.类别 === '战斗' || model.value.类别 === '守备' || model.value.类别 === 'EGO');

function 添加硬币(): void {
  model.value.硬币 = [...model.value.硬币, { 威力: 3, 类型: '普通', 命中效果: [] }];
}

function 删除硬币(下标: number): void {
  model.value.硬币 = model.value.硬币.filter((_, 序) => 序 !== 下标);
}

function 切换硬币(下标: number): void {
  展开硬币.value = { ...展开硬币.value, [下标]: !展开硬币.value[下标] };
}

watch(
  () => model.value.类别,
  (类别, 旧类别) => {
    if (类别 === 旧类别) return;
    if (类别 !== '守备') model.value.守备类型 = '';
    else if (!model.value.守备类型) model.value.守备类型 = '闪避';
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
.skill-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.span-2 {
  grid-column: span 2;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.req {
  color: var(--b-accent, #c8452f);
  margin-left: 2px;
}

.field-input {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
  outline: none;
}

.field-input:focus {
  border-color: var(--b-accent-2, #d9a441);
}

textarea.field-input {
  resize: vertical;
  min-height: 52px;
  line-height: 1.5;
}

.field-error {
  font-size: 10px;
  color: #e88a7c;
}

.coin-block,
.effect-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px dashed var(--b-border, #3b303b);
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.block-empty {
  font-size: 11px;
  color: var(--b-muted, #9a8f98);
}

.mini-add {
  padding: 3px 10px;
  border: 1px dashed var(--b-accent-2, #d9a441);
  border-radius: 4px;
  background: transparent;
  color: var(--b-accent-2, #d9a441);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.coin-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.18);
}

.coin-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.coin-no {
  font-size: 11px;
  color: var(--b-accent-2, #d9a441);
  font-variant-numeric: tabular-nums;
}

.coin-power,
.coin-type {
  padding: 5px 7px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text, #e8e0e4);
  font-family: inherit;
  font-size: 12px;
  outline: none;
}

.coin-power {
  width: 74px;
}

.coin-type {
  width: 104px;
}

.mini-btn {
  padding: 4px 9px;
  border: 1px solid var(--b-border, #3b303b);
  border-radius: 4px;
  background: transparent;
  color: var(--b-ally, #4fa3d1);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.mini-btn.danger {
  color: #e88a7c;
}

.canonical {
  padding: 5px 8px;
  border: 1px dashed var(--b-border, #3b303b);
  border-radius: 5px;
  background: rgba(217, 164, 65, 0.05);
  font-size: 11px;
  color: var(--b-text, #e8e0e4);
  line-height: 1.6;
}

@media (max-width: 520px) {
  .skill-grid {
    grid-template-columns: 1fr;
  }

  .span-2 {
    grid-column: auto;
  }
}
</style>
