<template>
  <div class="opening-form">
    <div v-if="已提交" class="card done-card">
      <div class="done-icon">✦</div>
      <h1 class="card-title">档案已建立</h1>
      <p class="card-sub">角色初始化完成，正在由 AI 铺开你的开场场景……</p>
    </div>

    <div v-else class="card">
      <header class="card-head">
        <h1 class="card-title">月亮计划 · 角色初始化</h1>
        <p class="card-sub">填写你的角色档案，完成后将由 AI 为你铺开开场场景。</p>
      </header>

      <details class="guide">
        <summary class="guide-title">玩法说明</summary>
        <div class="guide-body">
          <p>这是游戏开始前的角色初始化界面。你在此填写的内容会作为玩家角色的初始设定写入变量，并作为你的发言发送给 AI。</p>
          <p>提交后，AI 将根据你的名称、种族、身份、称号与着装，为你铺开一段契合的开场剧情。初始化完成后本表单将被锁定，后续成长请在游戏中进行。</p>
        </div>
      </details>

      <section class="group">
        <h2 class="group-title">基本情报</h2>
        <div class="field-grid">
          <FormField v-model="表单.名称" label="名称" placeholder="你的名字" required :error="名称错误" />
          <FormField v-model="表单.种族" label="种族" placeholder="人类" :options="种族建议" :error="种族错误" />
          <FormField v-model="表单.身份" label="身份" placeholder="无" :options="身份建议" :error="身份错误" />
          <FormField v-model="表单.当前称号" label="当前称号" placeholder="无" :error="称号错误" />
          <div class="field level-field">
            <span class="field-label">等级（1-90）</span>
            <div class="level-control">
              <input v-model.number="表单.等级" type="range" min="1" max="90" step="1" class="level-range" />
              <span class="level-value">Lv.{{ 表单.等级 }}</span>
            </div>
            <span v-if="等级错误" class="field-error">{{ 等级错误 }}</span>
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="group-title">着装装备</h2>
        <div class="field-grid">
          <FormField v-model="表单.上衣" label="上衣" placeholder="自定义上衣" :error="上衣错误" />
          <FormField v-model="表单.下装" label="下装" placeholder="自定义下装" :error="下装错误" />
          <FormField v-model="表单.武器" label="武器" placeholder="无" :error="武器错误" />
          <FormField v-model="表单.防具" label="防具" placeholder="无" :error="防具错误" />
          <FormField v-model="表单.物品" label="随身物品" placeholder="无" :error="物品错误" />
        </div>
      </section>

      <section class="group">
        <h2 class="group-title">开局设定</h2>
        <div class="field-grid">
          <FormField v-model="表单.当前时间" label="当前时间" placeholder="都市历 984-10-31 15:53" />
          <FormField v-model="表单.当前地点" label="当前地点" placeholder="16区后巷，拉·曼却领外围" />
          <FormField v-model="表单.当前场景" label="当前场景" placeholder="日常" />
        </div>
      </section>

      <footer class="card-foot">
        <span v-if="已提交" class="foot-status done">已提交，正在生成…</span>
        <span v-else-if="提交中" class="foot-status">正在提交…</span>
        <span v-else-if="首个错误" class="foot-status">{{ 首个错误 }}</span>
        <button class="submit-btn" :disabled="!可提交" @click="提交">
          {{ 提交中 ? '提交中…' : 已提交 ? '已提交' : '确认并开始' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import FormField from './components/FormField.vue';

const store = useDataStore();
const data = store.data;

const 表单校验 = z.object({
  名称: z.string().trim().min(1, '请填写角色名称').max(40, '名称过长'),
  种族: z.string().trim(),
  身份: z.string().trim(),
  当前称号: z.string().trim(),
  等级: z.coerce.number().int('等级需为整数').min(1, '等级需在 1-90 之间').max(90, '等级需在 1-90 之间'),
  上衣: z.string().trim(),
  下装: z.string().trim(),
  武器: z.string().trim(),
  防具: z.string().trim(),
  物品: z.string().trim(),
  当前时间: z.string().trim(),
  当前地点: z.string().trim(),
  当前场景: z.string().trim(),
});

type 表单类型 = z.input<typeof 表单校验>;

const 提交中 = ref(false);
const 已提交 = ref(false);

const 种族建议 = ['人类', '血魔', '异想体', '黑兽', '半机械改造人', '其他'];
const 身份建议 = ['收尾人', '翼公司员工', '协会成员', '帮派成员', '事务所负责人', '自由职业者', '无'];

function 去宏(文本: string): string {
  if (!文本 || !文本.includes('{{')) return 文本;
  try {
    return substitudeMacros(文本);
  } catch {
    return 文本;
  }
}

const 表单 = reactive<表单类型>({
  名称: 去宏(data.玩家状态.基础信息.名称),
  种族: data.玩家状态.基础信息.种族,
  身份: data.玩家状态.基础信息.身份,
  当前称号: data.玩家状态.基础信息.当前称号,
  等级: data.玩家状态.基础信息.等级,
  上衣: data.玩家状态.穿着装备.上衣,
  下装: data.玩家状态.穿着装备.下装,
  武器: data.玩家状态.穿着装备.武器,
  防具: data.玩家状态.穿着装备.防具,
  物品: data.玩家状态.穿着装备.物品,
  当前时间: data.世界状态.当前时间,
  当前地点: data.世界状态.当前地点,
  当前场景: data.世界状态.当前场景,
});

function 字段错误(键: keyof 表单类型): string {
  const 结果 = 表单校验.shape[键].safeParse(表单[键]);
  return 结果.success ? '' : (z.prettifyError(结果.error).split('\n').pop() ?? '输入有误');
}

const 名称错误 = computed(() => 字段错误('名称'));
const 种族错误 = computed(() => 字段错误('种族'));
const 身份错误 = computed(() => 字段错误('身份'));
const 称号错误 = computed(() => 字段错误('当前称号'));
const 等级错误 = computed(() => 字段错误('等级'));
const 上衣错误 = computed(() => 字段错误('上衣'));
const 下装错误 = computed(() => 字段错误('下装'));
const 武器错误 = computed(() => 字段错误('武器'));
const 防具错误 = computed(() => 字段错误('防具'));
const 物品错误 = computed(() => 字段错误('物品'));

const 所有错误 = computed(() => [
  名称错误.value,
  种族错误.value,
  身份错误.value,
  称号错误.value,
  等级错误.value,
  上衣错误.value,
  下装错误.value,
  武器错误.value,
  防具错误.value,
  物品错误.value,
]);

const 首个错误 = computed(() => 所有错误.value.find(错误 => 错误) ?? '');

const 可提交 = computed(() => !提交中.value && !已提交.value && 名称错误.value === '' && 等级错误.value === '');

function 构建描述(值: z.output<typeof 表单校验>): string {
  const 行 = [
    '【玩家角色初始设定】',
    `名称：${值.名称}`,
    `种族：${值.种族 || '人类'}`,
    `身份：${值.身份 || '无'}`,
    `当前称号：${值.当前称号 || '无'}`,
    `等级：${值.等级}`,
    `着装：上衣「${值.上衣 || '无'}」，下装「${值.下装 || '无'}」，武器「${值.武器 || '无'}」，防具「${值.防具 || '无'}」，随身物品「${值.物品 || '无'}」`,
    '',
    '【开局世界坐标】',
    `当前时间：${值.当前时间 || '都市历 984-10-31 15:53'}`,
    `当前地点：${值.当前地点 || '16区后巷，拉·曼却领外围'}`,
    `当前场景：${值.当前场景 || '日常'}`,
    '',
    '以上为玩家角色初始设定与开局坐标，请据此铺开开场场景。',
  ];
  return 行.join('\n');
}

async function 提交(): Promise<void> {
  if (提交中.value || 已提交.value) return;
  const 结果 = 表单校验.safeParse(表单);
  if (!结果.success) {
    toastr.error(z.prettifyError(结果.error));
    return;
  }
  提交中.value = true;
  try {
    const 值 = 结果.data;
    data.玩家状态.基础信息.名称 = 值.名称;
    data.玩家状态.基础信息.种族 = 值.种族 || '人类';
    data.玩家状态.基础信息.身份 = 值.身份 || '无';
    data.玩家状态.基础信息.当前称号 = 值.当前称号 || '无';
    data.玩家状态.基础信息.等级 = 值.等级;
    data.玩家状态.穿着装备.上衣 = 值.上衣 || '自定义上衣';
    data.玩家状态.穿着装备.下装 = 值.下装 || '自定义下装';
    data.玩家状态.穿着装备.武器 = 值.武器 || '无';
    data.玩家状态.穿着装备.防具 = 值.防具 || '无';
    data.玩家状态.穿着装备.物品 = 值.物品 || '无';

    data.世界状态.当前时间 = 值.当前时间 || '都市历 984-10-31 15:53';
    data.世界状态.当前地点 = 值.当前地点 || '16区后巷，拉·曼却领外围';
    data.世界状态.当前场景 = 值.当前场景 || '日常';

    await nextTick();
    await createChatMessages([{ role: 'user', name: 值.名称, message: 构建描述(值) }]);
    await triggerSlash('/trigger');
    已提交.value = true;
    console.info('[开局表单] 已提交角色初始化');
  } catch (错误) {
    console.error('[开局表单] 提交失败', 错误);
    toastr.error('提交失败，请重试');
  } finally {
    提交中.value = false;
  }
}
</script>

<style scoped>
.opening-form {
  width: 100%;
  max-width: 640px;
  margin: 16px auto;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
  border-radius: 12px;
  background: linear-gradient(160deg, var(--b-surface), var(--b-bg));
  border: 1px solid var(--b-border);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55), inset 0 0 0 1px rgba(217, 164, 65, 0.05);
  color: var(--b-text);
}

.card-head {
  text-align: center;
  border-bottom: 1px solid var(--b-border);
  padding-bottom: 12px;
}

.card-title {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--b-accent-2);
}

.card-sub {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--b-muted);
}

.done-card {
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 40px 24px;
}

.done-icon {
  font-size: 34px;
  color: var(--b-accent-2);
  text-shadow: 0 0 18px rgba(217, 164, 65, 0.6);
  animation: done-pop 0.6s ease;
}

@keyframes done-pop {
  0% {
    transform: scale(0.4);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.guide {
  border: 1px dashed var(--b-border);
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.2);
}

.guide-title {
  cursor: pointer;
  list-style: none;
  padding: 8px 12px;
  font-size: 12px;
  color: var(--b-ally);
  letter-spacing: 1px;
}

.guide-title::-webkit-details-marker {
  display: none;
}

.guide-title::before {
  content: '❔ ';
}

.guide-body {
  padding: 0 12px 10px;
  font-size: 11px;
  line-height: 1.7;
  color: var(--b-muted);
}

.guide-body p {
  margin: 4px 0;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  color: var(--b-accent);
  border-left: 3px solid var(--b-accent);
  padding-left: 8px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.level-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  grid-column: span 2;
}

.level-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.level-range {
  flex: 1;
  height: 4px;
  accent-color: var(--b-accent);
  cursor: pointer;
}

.level-value {
  flex: 0 0 auto;
  min-width: 52px;
  text-align: right;
  font-size: 13px;
  font-weight: 800;
  color: var(--b-accent-2);
  font-variant-numeric: tabular-nums;
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--b-border);
  padding-top: 12px;
}

.foot-status {
  font-size: 11px;
  color: #e88a7c;
}

.foot-status.done {
  color: var(--b-player);
}

.submit-btn {
  padding: 9px 26px;
  border: 1px solid var(--b-accent);
  border-radius: 6px;
  background: linear-gradient(150deg, rgba(200, 69, 47, 0.35), rgba(200, 69, 47, 0.1));
  color: var(--b-text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
}

.submit-btn:hover:not(:disabled) {
  background: var(--b-accent);
  box-shadow: 0 0 16px rgba(200, 69, 47, 0.45);
}

.submit-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  border-color: var(--b-border);
  background: transparent;
  color: var(--b-muted);
}

@media (max-width: 520px) {
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
