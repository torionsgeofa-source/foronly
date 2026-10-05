<template>
  <div class="effect-editor">
    <div v-if="modelValue.length" class="effect-list">
      <div v-for="(效果, 下标) in modelValue" :key="下标" class="effect-item">
        <span class="effect-sentence">{{ 序列化效果(效果) }}</span>
        <button type="button" class="effect-del" title="删除该效果" @click="删除(下标)">×</button>
      </div>
    </div>
    <div v-else class="effect-empty">暂无效果</div>

    <div v-if="展开" class="effect-add">
      <div class="add-row">
        <select v-model="句式" class="add-select">
          <option v-for="项 in 效果句式选项" :key="项" :value="项">{{ 项 }}</option>
        </select>

        <template v-if="需要目标">
          <select v-model="目标" class="add-select small">
            <option v-for="项 in 可选目标" :key="项" :value="项">{{ 项 }}</option>
          </select>
        </template>

        <template v-if="句式 === '施加状态（层数）' || 句式 === '施加状态（强度）'">
          <input v-model="状态" class="add-input" :list="状态列表Id" placeholder="状态" />
          <input v-model.number="数量" type="number" class="add-input num" placeholder="数量" />
        </template>

        <template v-else-if="句式 === '调整生命' || 句式 === '调整SP'">
          <select v-model="正负" class="add-select small">
            <option value="恢复">恢复</option>
            <option value="失去">失去</option>
          </select>
          <input v-model.number="数量" type="number" min="0" class="add-input num" placeholder="数值" />
        </template>

        <template v-else-if="句式 === '获得护盾'">
          <input v-model.number="数量" type="number" min="0" class="add-input num" placeholder="护盾值" />
        </template>

        <template v-else-if="句式 === '条件增伤'">
          <input v-model="条件" class="add-input" :list="条件列表Id" placeholder="条件" />
          <input v-model.number="数量" type="number" min="0" class="add-input num" placeholder="增伤%" />
        </template>

        <template v-else>
          <input v-model="条件" class="add-input" :list="条件列表Id" placeholder="条件(可选)" title="仅当条件成立时结算本条效果；留空为无条件" />
        </template>

        <button type="button" class="add-btn" @click="添加">添加</button>
        <button type="button" class="add-btn ghost" @click="展开 = false">收起</button>
      </div>
      <div class="add-hint">
        目标「敌人」落在受击 / 指定目标；「自己」落在来源；盟友类目标需要战斗上下文（缺省时安全回退）。
        「条件(可选)」仅当条件成立时结算本条效果（以落点判定），留空为无条件；
        「条件增伤」以受击方判定条件；被动 / 支援仅可选择自己 / 盟友类目标。
      </div>
      <datalist :id="状态列表Id">
        <option v-for="项 in 合法状态名" :key="项" :value="项" />
      </datalist>
      <datalist :id="条件列表Id">
        <option v-for="项 in 条件列表" :key="项" :value="项" />
      </datalist>
    </div>

    <button v-else type="button" class="add-toggle" @click="展开 = true">＋ 添加效果</button>
  </div>
</template>

<script setup lang="ts">
import { 序列化效果, 合法状态名 } from '../战斗/engine/效果解析';
import { 效果目标列表, 条件列表, type 技能效果, type 效果目标 } from '../战斗/engine/types';

const modelValue = defineModel<技能效果[]>({ required: true });

const props = defineProps<{ 允许目标?: 效果目标[] }>();

const 效果句式选项 = ['施加状态（层数）', '施加状态（强度）', '调整生命', '调整SP', '获得护盾', '震颤引爆', '条件增伤'] as const;
type 效果句式 = (typeof 效果句式选项)[number];

/** 多实例唯一 id: 避免同页面多个 EffectEditor 的 datalist id 冲突 (Vue useId 每个实例唯一) */
const 实例号 = useId();
const 状态列表Id = `effect-state-list-${实例号}`;
const 条件列表Id = `effect-condition-list-${实例号}`;

/** 可选落点: 传入 允许目标 时仅展示白名单项 (如 被动 / 支援 禁用 敌人 类目标) */
const 可选目标 = computed<效果目标[]>(() => {
  const 白名单 = props.允许目标;
  return 白名单 && 白名单.length > 0 ? 效果目标列表.filter(项 => 白名单.includes(项)) : 效果目标列表;
});

const 展开 = ref(false);
const 句式 = ref<效果句式>('施加状态（层数）');
const 目标 = ref<效果目标>(可选目标.value[0] ?? '敌人');
const 状态 = ref('破裂');
const 条件 = ref('生命低于50%');
const 正负 = ref<'恢复' | '失去'>('恢复');
const 数量 = ref(1);

watch(可选目标, 列表 => {
  if (!列表.includes(目标.value)) 目标.value = 列表[0] ?? '敌人';
});

const 需要目标 = computed(() => 句式.value !== '条件增伤');

function 添加(): void {
  const 效果 = 生成效果();
  if (!效果) return;
  modelValue.value = [...modelValue.value, 效果];
}

function 删除(下标: number): void {
  modelValue.value = modelValue.value.filter((_, 序) => 序 !== 下标);
}

/** 可选条件属性: 非空时注入 条件 (条件增伤自带 条件, 由调用处另行处理) */
function 可选条件属性(): { 条件?: string } {
  const 值 = 条件.value.trim();
  return 值 ? { 条件: 值 } : {};
}

function 生成效果(): 技能效果 | null {
  const 状态名 = 状态.value.trim();
  switch (句式.value) {
    case '施加状态（层数）':
      if (!状态名) return null;
      return { type: '施加状态', 目标: 目标.value, 状态: 状态名, 层数: Math.max(0, Math.round(数量.value || 0)), 强度: 0, ...可选条件属性() };
    case '施加状态（强度）':
      if (!状态名) return null;
      return { type: '施加状态', 目标: 目标.value, 状态: 状态名, 层数: 1, 强度: Math.max(0, Math.round(数量.value || 0)), ...可选条件属性() };
    case '调整生命':
      return { type: '调整数值', 目标: 目标.value, 生命: (正负.value === '恢复' ? 1 : -1) * Math.abs(Math.round(数量.value || 0)), ...可选条件属性() };
    case '调整SP':
      return { type: '调整数值', 目标: 目标.value, SP: (正负.value === '恢复' ? 1 : -1) * Math.abs(Math.round(数量.value || 0)), ...可选条件属性() };
    case '获得护盾':
      return { type: '获得护盾', 目标: 目标.value, 数值: Math.max(0, Math.round(数量.value || 0)), ...可选条件属性() };
    case '震颤引爆':
      return { type: '震颤引爆', 目标: 目标.value, ...可选条件属性() };
    case '条件增伤':
      if (!条件.value.trim()) return null;
      return { type: '条件增伤', 条件: 条件.value.trim(), 数值: Math.max(0, Math.round(数量.value || 0)) };
    default:
      return null;
  }
}
</script>

<style scoped>
.effect-editor {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.effect-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 7px;
  border: 1px solid var(--b-border);
  border-left: 3px solid var(--b-accent-2);
  border-radius: 4px;
  background: rgba(217, 164, 65, 0.06);
  font-size: 11px;
}

.effect-sentence {
  flex: 1;
  color: var(--b-text);
  word-break: break-all;
}

.effect-del {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  color: #e88a7c;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.effect-empty {
  font-size: 11px;
  color: var(--b-muted);
}

.effect-add {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px;
  border: 1px dashed var(--b-border);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.2);
}

.add-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
}

.add-select,
.add-input {
  padding: 4px 6px;
  border: 1px solid var(--b-border);
  border-radius: 4px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 11px;
  outline: none;
}

.add-select.small {
  max-width: 96px;
}

.add-input {
  min-width: 72px;
}

.add-input.num {
  width: 66px;
}

.add-btn {
  padding: 4px 10px;
  border: 1px solid var(--b-accent-2);
  border-radius: 4px;
  background: rgba(217, 164, 65, 0.1);
  color: var(--b-accent-2);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.add-btn.ghost {
  border-color: var(--b-border);
  background: transparent;
  color: var(--b-muted);
}

.add-toggle {
  align-self: flex-start;
  padding: 3px 10px;
  border: 1px dashed var(--b-accent-2);
  border-radius: 4px;
  background: transparent;
  color: var(--b-accent-2);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.add-hint {
  font-size: 10px;
  color: var(--b-muted);
  line-height: 1.5;
}
</style>
