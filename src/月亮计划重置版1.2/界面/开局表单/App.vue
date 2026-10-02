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
          <p>「技能设计」可自由添加或删除招式，数量不限；「开场情境」用于描述你期望的开场，不会写入固定字段，而是直接交给 AI 作为开局引导。</p>
          <p>提交后本表单将被锁定，后续成长请在游戏中进行。</p>
        </div>
      </details>

      <section class="group">
        <h2 class="group-title">基本情报</h2>
        <div class="field-grid">
          <FormField v-model="表单.名称" label="名称" placeholder="你的名字" required :error="名称错误" />
          <FormField v-model="表单.性别" label="性别" type="select" :options="性别选项" />
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
        <div class="group-head">
          <h2 class="group-title">技能设计</h2>
          <span class="group-count">{{ 表单.技能.length }} 个技能</span>
        </div>
        <p class="group-hint">数量不限。技能名称必填且不可重复；硬币威力用逗号或空格分隔多枚硬币的数值。</p>
        <div v-if="表单.技能.length" class="skill-list">
          <SkillCard
            v-for="(技, 下标) in 表单.技能"
            :key="技._id"
            v-model="表单.技能[下标]"
            :序号="下标 + 1"
            :错误="技能错误表[下标] ?? {}"
            @删除="删除技能(下标)"
          />
        </div>
        <div v-else class="skill-empty">尚未添加技能，可留空直接开始。</div>
        <button type="button" class="add-skill-btn" @click="添加技能">＋ 添加技能</button>
      </section>

      <section class="group">
        <h2 class="group-title">开局设定</h2>
        <div class="field-grid">
          <FormField v-model="表单.当前时间" label="当前时间" placeholder="都市历 984-10-31 15:53" />
          <FormField v-model="表单.当前地点" label="当前地点" placeholder="16区后巷，拉·曼却领外围" />
          <FormField v-model="表单.当前场景" label="当前场景" placeholder="日常" />
          <FormField
            v-model="表单.开局引导"
            class="span-2"
            label="开场情境 / 开局引导（自由描述）"
            type="textarea"
            :rows="4"
            placeholder="描述你希望的开场：地点、氛围、正在发生的事……（可留空）"
          />
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
import SkillCard from './components/SkillCard.vue';
import { 性别选项, 解析硬币威力, type 技能表单 } from './types';

const store = useDataStore();
const data = store.data;

const 技能校验 = z.object({
  名称: z.string().trim().min(1, '请填写技能名称').max(40, '技能名称过长'),
  罪孽: z.string().trim(),
  攻击类型: z.string().trim(),
  类别: z.string().trim(),
  守备类型: z.string().trim(),
  基础威力: z.coerce.number(),
  硬币威力: z.string().transform((文本, ctx) => {
    const 解析 = 解析硬币威力(文本);
    if (解析.错误) {
      ctx.addIssue({ code: 'custom', message: 解析.错误 });
      return z.NEVER;
    }
    return 解析.列表;
  }),
  攻击等级修正: z.coerce.number(),
  攻击容量: z.coerce.number().int('攻击容量需为整数').min(1, '攻击容量需 ≥1'),
  SP消耗: z.coerce.number().min(0, 'SP消耗需 ≥0'),
  效果: z.string().trim(),
});

const 表单校验 = z.object({
  名称: z.string().trim().min(1, '请填写角色名称').max(40, '名称过长'),
  性别: z.string().trim(),
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
  开局引导: z.string().trim(),
  技能: z.array(技能校验).superRefine((列表, ctx) => {
    const 已见 = new Map<string, number>();
    列表.forEach((技, 下标) => {
      if (!技.名称) return;
      if (已见.has(技.名称)) {
        ctx.addIssue({ code: 'custom', message: `技能名称「${技.名称}」重复`, path: [下标, '名称'] });
      } else {
        已见.set(技.名称, 下标);
      }
    });
  }),
});

type 技能输出 = z.output<typeof 技能校验>;

interface 表单数据 {
  名称: string;
  性别: string;
  种族: string;
  身份: string;
  当前称号: string;
  等级: number;
  上衣: string;
  下装: string;
  武器: string;
  防具: string;
  物品: string;
  当前时间: string;
  当前地点: string;
  当前场景: string;
  开局引导: string;
  技能: 技能表单[];
}

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

let 技能序号 = 0;

function 生成技能表单(名称: string, 值?: Record<string, unknown>): 技能表单 {
  const 类别 = (值?.类别 as string) || '攻击';
  return {
    _id: ++技能序号,
    名称,
    罪孽: (值?.罪孽 as string) || '无',
    攻击类型: (值?.攻击类型 as string) || '打击',
    类别,
    守备类型: 类别 === '守备' ? ((值?.守备类型 as string) || '闪避') : '',
    基础威力: String(值?.基础威力 ?? 0),
    硬币威力: Array.isArray(值?.硬币威力) ? (值.硬币威力 as number[]).join(', ') : '',
    攻击等级修正: String(值?.攻击等级修正 ?? 0),
    攻击容量: String(值?.攻击容量 ?? 1),
    SP消耗: String(值?.SP消耗 ?? 0),
    效果: (值?.效果 as string) || '',
  };
}

function 载入技能(): 技能表单[] {
  const 来源 = data.玩家状态.技能 as unknown as Record<string, Record<string, unknown>>;
  return Object.entries(来源 ?? {}).map(([名称, 值]) => 生成技能表单(名称, 值));
}

const 表单 = reactive<表单数据>({
  名称: 去宏(data.玩家状态.基础信息.名称),
  性别: 性别选项.includes(data.玩家状态.基础信息.性别) ? data.玩家状态.基础信息.性别 : '未知',
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
  开局引导: '',
  技能: 载入技能(),
});

function 添加技能(): void {
  表单.技能.push(生成技能表单(''));
}

function 删除技能(下标: number): void {
  表单.技能.splice(下标, 1);
}

function 字段错误(键: '名称' | '种族' | '身份' | '当前称号' | '等级' | '上衣' | '下装' | '武器' | '防具' | '物品'): string {
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

const 技能错误表 = computed<Record<string, string>[]>(() => {
  const 同名计数 = new Map<string, number>();
  表单.技能.forEach(技 => {
    const 名 = 技.名称.trim();
    if (!名) return;
    同名计数.set(名, (同名计数.get(名) ?? 0) + 1);
  });
  return 表单.技能.map(技 => {
    const 错误: Record<string, string> = {};
    const 结果 = 技能校验.safeParse(技);
    if (!结果.success) {
      for (const 问题 of 结果.error.issues) {
        const 键 = String(问题.path[0] ?? '');
        if (键 && !错误[键]) 错误[键] = 问题.message;
      }
    }
    const 名 = 技.名称.trim();
    if (名 && (同名计数.get(名) ?? 0) > 1) {
      错误.名称 = `技能名称「${名}」重复`;
    }
    return 错误;
  });
});

const 技能有错误 = computed(() => 技能错误表.value.some(错误 => Object.keys(错误).length > 0));

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

const 首个错误 = computed(() => {
  const 基础错误 = 所有错误.value.find(错误 => 错误);
  if (基础错误) return 基础错误;
  for (const 错误 of 技能错误表.value) {
    const 值 = Object.values(错误)[0];
    if (值) return 值;
  }
  return '';
});

const 可提交 = computed(() => !提交中.value && !已提交.value && 名称错误.value === '' && 等级错误.value === '' && !技能有错误.value);

function 构建技能行(技: 技能输出): string {
  const 硬币 = 技.硬币威力.length ? 技.硬币威力.join(' / ') : '无';
  const 守备 = 技.类别 === '守备' ? `，守备类型「${技.守备类型 || '无'}」` : '';
  return `- ${技.名称}：罪孽「${技.罪孽 || '无'}」，攻击类型「${技.攻击类型 || '打击'}」，类别「${技.类别 || '攻击'}」${守备}，基础威力 ${技.基础威力}，硬币威力 [${硬币}]，攻击等级修正 ${技.攻击等级修正 >= 0 ? '+' : ''}${技.攻击等级修正}，攻击容量 ${技.攻击容量}，SP消耗 ${技.SP消耗}，效果：${技.效果 || '无'}`;
}

function 构建描述(值: z.output<typeof 表单校验>): string {
  const 行 = [
    '【玩家角色初始设定】',
    `名称：${值.名称}`,
    `性别：${值.性别 || '未知'}`,
    `种族：${值.种族 || '人类'}`,
    `身份：${值.身份 || '无'}`,
    `当前称号：${值.当前称号 || '无'}`,
    `等级：${值.等级}`,
    '',
    '【着装装备】',
    `上衣：${值.上衣 || '无'}`,
    `下装：${值.下装 || '无'}`,
    `武器：${值.武器 || '无'}`,
    `防具：${值.防具 || '无'}`,
    `随身物品：${值.物品 || '无'}`,
    '',
    '【技能】',
    值.技能.length ? 值.技能.map(构建技能行).join('\n') : '无',
    '',
    '【开局世界坐标】',
    `当前时间：${值.当前时间 || '都市历 984-10-31 15:53'}`,
    `当前地点：${值.当前地点 || '16区后巷，拉·曼却领外围'}`,
    `当前场景：${值.当前场景 || '日常'}`,
  ];
  if (值.开局引导) {
    行.push('', '【开局引导】', 值.开局引导);
  }
  行.push('', '以上为玩家角色初始设定与开局引导，请据此铺开开场场景。');
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
    data.玩家状态.基础信息.性别 = 值.性别 || '未知';
    data.玩家状态.基础信息.种族 = 值.种族 || '人类';
    data.玩家状态.基础信息.身份 = 值.身份 || '无';
    data.玩家状态.基础信息.当前称号 = 值.当前称号 || '无';
    data.玩家状态.基础信息.等级 = 值.等级;
    data.玩家状态.穿着装备.上衣 = 值.上衣 || '自定义上衣';
    data.玩家状态.穿着装备.下装 = 值.下装 || '自定义下装';
    data.玩家状态.穿着装备.武器 = 值.武器 || '无';
    data.玩家状态.穿着装备.防具 = 值.防具 || '无';
    data.玩家状态.穿着装备.物品 = 值.物品 || '无';

    const 记录: Record<string, 技能输出> = {};
    for (const 技 of 值.技能) {
      记录[技.名称] = {
        罪孽: 技.罪孽 || '无',
        攻击类型: 技.攻击类型 || '打击',
        类别: 技.类别 || '攻击',
        守备类型: 技.类别 === '守备' ? 技.守备类型 || '' : '',
        基础威力: 技.基础威力,
        硬币威力: 技.硬币威力,
        攻击等级修正: 技.攻击等级修正,
        攻击容量: 技.攻击容量,
        效果: 技.效果,
        SP消耗: 技.SP消耗,
      };
    }
    data.玩家状态.技能 = 记录;

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
  max-width: 680px;
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

.group-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
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

.group-count {
  font-size: 11px;
  color: var(--b-muted);
  font-variant-numeric: tabular-nums;
}

.group-hint {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--b-muted);
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.span-2 {
  grid-column: span 2;
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

.field-error {
  font-size: 10px;
  color: #e88a7c;
}

.skill-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-empty {
  padding: 10px;
  border: 1px dashed var(--b-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--b-muted);
  text-align: center;
}

.add-skill-btn {
  align-self: flex-start;
  padding: 7px 16px;
  border: 1px dashed var(--b-accent-2);
  border-radius: 6px;
  background: rgba(217, 164, 65, 0.08);
  color: var(--b-accent-2);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.add-skill-btn:hover {
  background: rgba(217, 164, 65, 0.18);
  box-shadow: 0 0 12px rgba(217, 164, 65, 0.25);
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

  .span-2 {
    grid-column: auto;
  }
}
</style>
