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
          <p>「技能设计」可自由添加或删除招式，数量不限；「开场情境」用于描述你期望的开场，会直接交给 AI 作为开局引导。</p>
          <p>装备效果中「+N生命值 / 生命值+N」会被规范化为「生命加成+N」，表示最大生命加成；治疗请写「恢复N点生命」，护盾请写「获得N点护盾」。</p>
          <p>提交后本表单将被锁定，后续成长请在游戏中进行。</p>
        </div>
      </details>

      <section class="group">
        <h2 class="group-title">基本情报</h2>
        <div class="field-grid">
          <FormField v-model="表单.名称" label="名称" placeholder="你的名字" required :error="名称错误" />
          <FormField v-model="表单.性别" label="性别" type="select" :options="性别选项" />
          <FormField v-model="表单.种族" label="种族" placeholder="人类" :options="种族建议" />
          <FormField v-model="表单.身份" label="身份" placeholder="无" :options="身份建议" />
          <FormField v-model="表单.当前称号" label="当前称号" placeholder="无" />
          <div class="field level-field">
            <span class="field-label">等级（1-90）</span>
            <div class="level-control">
              <input v-model.number="表单.等级" type="range" min="1" max="90" step="1" class="level-range" />
              <span class="level-value">Lv.{{ 表单.等级 }}</span>
            </div>
          </div>
          <div class="field rank-field">
            <span class="field-label">阶层（决定生命成长曲线）</span>
            <select v-model="表单.阶层" class="field-input">
              <option v-for="项 in 阶层选项" :key="项" :value="项">{{ 项 }}</option>
            </select>
            <span class="rank-current">当前生命上限：<b>{{ 当前生命上限 }}</b></span>
          </div>
        </div>
        <div class="life-table">
          <div v-for="条 in 生命表展示" :key="条.阶层" class="life-row" :class="{ active: 条.阶层 === 表单.阶层 }">
            <span class="life-rank">{{ 条.阶层 }}</span>
            <span class="life-formula">{{ 条.初始 }} + {{ 条.成长 }} × 等级</span>
            <span class="life-cap">90级 {{ 条.九十级 }}</span>
          </div>
        </div>
      </section>

      <section class="group">
        <h2 class="group-title">着装装备</h2>
        <p class="group-hint">每槽填写「名称 + 效果」。效果支持「施加N层状态 / 恢复N点生命 / 获得N点护盾 / 生命加成+N」，多条用 ； 分隔。</p>
        <div class="equip-list">
          <EquipCard v-for="槽 in 装备槽定义" :key="槽.键" v-model="表单.装备[槽.键]" :标签="槽.标签" />
        </div>
      </section>

      <section class="group">
        <h2 class="group-title">主角战斗数据</h2>
        <span class="sub-title">罪孽抗性（倍率）</span>
        <div class="resist-grid">
          <label v-for="罪孽 in 罪孽列表" :key="罪孽" class="resist-field">
            <span class="resist-label" :style="{ color: 罪孽颜色[罪孽] ?? 'var(--b-text)' }">{{ 罪孽 }}</span>
            <input v-model="表单.罪孽抗性[罪孽]" type="number" step="0.1" class="field-input mini" />
          </label>
        </div>
        <span class="sub-title">物理抗性（倍率）</span>
        <div class="resist-grid">
          <label v-for="类型 in 攻击类型列表" :key="类型" class="resist-field">
            <span class="resist-label">{{ 类型 }}</span>
            <input v-model="表单.物理抗性[类型]" type="number" step="0.1" class="field-input mini" />
          </label>
        </div>
        <div class="field-grid">
          <div class="field">
            <span class="field-label">混乱阈值（达到即混乱；勾选「无」写入 0，永不混乱）</span>
            <div class="chaos-control">
              <input v-model="表单.混乱阈值" type="number" min="0" class="field-input" :disabled="表单.混乱无" />
              <label class="checkbox"><input v-model="表单.混乱无" type="checkbox" /> 无</label>
            </div>
          </div>
          <div class="field">
            <span class="field-label">理智值（-45 ~ 45，默认 45）</span>
            <input v-model="表单.理智值" type="number" min="-45" max="45" class="field-input" />
            <span v-if="理智错误" class="field-error">{{ 理智错误 }}</span>
          </div>
        </div>
      </section>

      <section class="group">
        <div class="group-head">
          <h2 class="group-title">技能设计</h2>
          <span class="group-count">{{ 表单.技能.length }} 个技能</span>
        </div>
        <p class="group-hint">从技能库中选择技能名（战斗 / 守备 / 被动 / 支援 / EGO），数量不限。技能的具体数值与效果请在「技能库」设置界面中编辑。</p>
        <SkillPicker v-model="表单.技能" :技能="技能库列表" />
      </section>

      <section class="group">
        <h2 class="group-title">开局设定</h2>
        <div class="field-grid">
          <FormField v-model="表单.当前时间" label="当前时间" placeholder="都市历 984-10-31 15:53" />
          <FormField v-model="表单.当前地点" label="当前地点" placeholder="16区后巷，拉·曼却领外围" />
          <FormField v-model="表单.当前场景" label="当前场景" placeholder="日常" />
          <FormField
            v-model="表单.开场情境"
            class="span-2"
            label="开场情境（自由描述）"
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
import EquipCard from './components/EquipCard.vue';
import SkillPicker from './components/SkillPicker.vue';
import {
  性别选项,
  阶层选项,
  阶层表,
  罪孽列表,
  攻击类型列表,
  罪孽颜色,
  计算生命上限,
  type 装备槽表单,
} from './types';
import { 规范化装备效果, 解析装备效果 } from '../战斗/engine/效果解析';
import { 全部技能, type 技能定义 } from './技能库';

const store = useDataStore();
const data = store.data;

const 技能库列表 = ref<技能定义[]>(全部技能());

const 装备槽定义 = [
  { 键: '上衣', 标签: '上衣' },
  { 键: '下装', 标签: '下装' },
  { 键: '武器', 标签: '武器' },
  { 键: '防具', 标签: '防具' },
  { 键: '物品', 标签: '随身物品' },
] as const;

type 装备槽键 = (typeof 装备槽定义)[number]['键'];

const 装备槽校验 = z.object({
  名称: z.string().trim(),
  效果: z.string().trim(),
});

const 表单校验 = z.object({
  名称: z.string().trim().min(1, '请填写角色名称').max(40, '名称过长'),
  性别: z.string().trim(),
  种族: z.string().trim(),
  身份: z.string().trim(),
  当前称号: z.string().trim(),
  等级: z.coerce.number().int('等级需为整数').min(1, '等级需在 1-90 之间').max(90, '等级需在 1-90 之间'),
  阶层: z.enum(['普通', '稀有', '史诗', '传说', '神话']),
  装备: z.record(z.string(), 装备槽校验),
  罪孽抗性: z.record(z.string(), z.coerce.number()),
  物理抗性: z.record(z.string(), z.coerce.number()),
  混乱阈值: z.coerce.number().min(0, '混乱阈值需 ≥0'),
  混乱无: z.boolean(),
  理智值: z.coerce.number().int('理智值需为整数').min(-45, '理智值需在 -45 ~ 45').max(45, '理智值需在 -45 ~ 45'),
  当前时间: z.string().trim(),
  当前地点: z.string().trim(),
  当前场景: z.string().trim(),
  开场情境: z.string().trim(),
  技能: z.array(z.string().trim()).superRefine((列表, ctx) => {
    const 已见 = new Set<string>();
    列表.forEach((名, 下标) => {
      if (!名) return;
      if (已见.has(名)) {
        ctx.addIssue({ code: 'custom', message: `技能名「${名}」重复`, path: [下标] });
      } else {
        已见.add(名);
      }
    });
  }),
});

interface 表单数据 {
  名称: string;
  性别: string;
  种族: string;
  身份: string;
  当前称号: string;
  等级: number;
  阶层: string;
  装备: Record<装备槽键, 装备槽表单>;
  罪孽抗性: Record<string, string>;
  物理抗性: Record<string, string>;
  混乱阈值: string;
  混乱无: boolean;
  理智值: string;
  当前时间: string;
  当前地点: string;
  当前场景: string;
  开场情境: string;
  技能: string[];
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

function 读装备槽(值: unknown): 装备槽表单 {
  if (typeof 值 === 'string') return { 名称: 值, 效果: '' };
  const 对象 = (值 ?? {}) as { 名称?: unknown; 效果?: unknown };
  return { 名称: String(对象.名称 ?? ''), 效果: String(对象.效果 ?? '') };
}

function 载入装备(): Record<装备槽键, 装备槽表单> {
  const 结果 = {} as Record<装备槽键, 装备槽表单>;
  for (const { 键 } of 装备槽定义) 结果[键] = 读装备槽(data.玩家状态.穿着装备[键]);
  return 结果;
}

const 表单 = reactive<表单数据>({
  名称: 去宏(data.玩家状态.基础信息.名称),
  性别: 性别选项.includes(data.玩家状态.基础信息.性别) ? data.玩家状态.基础信息.性别 : '未知',
  种族: data.玩家状态.基础信息.种族,
  身份: data.玩家状态.基础信息.身份,
  当前称号: data.玩家状态.基础信息.当前称号,
  等级: data.玩家状态.基础信息.等级,
  阶层: 阶层选项.includes(data.玩家状态.基础信息.阶层) ? data.玩家状态.基础信息.阶层 : '普通',
  装备: 载入装备(),
  罪孽抗性: Object.fromEntries(罪孽列表.map(名 => [名, String(data.玩家状态.罪孽抗性[名 as '暴怒'] ?? 1)])),
  物理抗性: Object.fromEntries(攻击类型列表.map(名 => [名, String(data.玩家状态.物理抗性[名 as '斩击'] ?? 1)])),
  混乱阈值: String(data.玩家状态.生命体征.混乱.阈值 ?? 50),
  混乱无: (data.玩家状态.生命体征.混乱.阈值 ?? 50) <= 0,
  理智值: String(data.玩家状态.生命体征.理智值.数值 ?? 45),
  当前时间: data.世界状态.当前时间,
  当前地点: data.世界状态.当前地点,
  当前场景: data.世界状态.当前场景,
  开场情境: '',
  技能: Array.isArray(data.玩家状态.技能) ? [...data.玩家状态.技能] : [],
});

const 装备生命加成 = computed(() =>
  装备槽定义.reduce((总和, { 键 }) => {
    const 解析 = 解析装备效果(表单.装备[键].效果);
    return 总和 + 解析.效果.reduce((和, 项) => (项.type === '生命加成' ? 和 + 项.数值 : 和), 0);
  }, 0),
);

const 当前生命上限 = computed(() => 计算生命上限(表单.阶层, 表单.等级, 装备生命加成.value));

const 生命表展示 = computed(() =>
  阶层选项.map(阶层 => ({
    阶层,
    初始: 阶层表[阶层].初始,
    成长: 阶层表[阶层].成长,
    九十级: 计算生命上限(阶层, 90),
  })),
);

function 字段错误(键: '名称' | '等级'): string {
  const 结果 = 表单校验.shape[键].safeParse(表单[键]);
  return 结果.success ? '' : (z.prettifyError(结果.error).split('\n').pop() ?? '输入有误');
}

const 名称错误 = computed(() => 字段错误('名称'));
const 等级错误 = computed(() => 字段错误('等级'));
const 理智错误 = computed(() => {
  const 结果 = 表单校验.shape.理智值.safeParse(表单.理智值);
  return 结果.success ? '' : (z.prettifyError(结果.error).split('\n').pop() ?? '输入有误');
});

const 技能有错误 = computed(() => {
  const 已见 = new Set<string>();
  return 表单.技能.some(名 => {
    const 键 = 名.trim();
    if (!键) return false;
    if (已见.has(键)) return true;
    已见.add(键);
    return false;
  });
});

const 首个错误 = computed(() => {
  if (名称错误.value) return 名称错误.value;
  if (等级错误.value) return 等级错误.value;
  if (理智错误.value) return 理智错误.value;
  if (技能有错误.value) return '存在重复的技能名';
  return '';
});

const 可提交 = computed(
  () => !提交中.value && !已提交.value && 名称错误.value === '' && 等级错误.value === '' && 理智错误.value === '' && !技能有错误.value,
);

function 装备效果文本(键: 装备槽键): string {
  return 规范化装备效果(表单.装备[键].效果);
}

function 构建描述(值: z.output<typeof 表单校验>): string {
  const 行 = [
    '【玩家角色初始设定】',
    `名称：${值.名称}`,
    `性别：${值.性别 || '未知'}`,
    `种族：${值.种族 || '人类'}`,
    `身份：${值.身份 || '无'}`,
    `当前称号：${值.当前称号 || '无'}`,
    `阶层：${值.阶层}`,
    `等级：${值.等级}`,
    `生命上限：${当前生命上限.value}`,
    '',
    '【着装装备】',
    `上衣：${值.装备.上衣?.名称 || '无'}（效果：${装备效果文本('上衣') || '无'}）`,
    `下装：${值.装备.下装?.名称 || '无'}（效果：${装备效果文本('下装') || '无'}）`,
    `武器：${值.装备.武器?.名称 || '无'}（效果：${装备效果文本('武器') || '无'}）`,
    `防具：${值.装备.防具?.名称 || '无'}（效果：${装备效果文本('防具') || '无'}）`,
    `随身物品：${值.装备.物品?.名称 || '无'}（效果：${装备效果文本('物品') || '无'}）`,
    '',
    '【主角战斗数据】',
    `罪孽抗性：${罪孽列表.map(名 => `${名} ${值.罪孽抗性[名] ?? 1}`).join('，')}`,
    `物理抗性：${攻击类型列表.map(名 => `${名} ${值.物理抗性[名] ?? 1}`).join('，')}`,
    `混乱阈值：${值.混乱无 ? '无（0，永不混乱）' : 值.混乱阈值}`,
    `理智值：${值.理智值}`,
    '',
    '【技能】',
    值.技能.length ? 值.技能.map(名 => `- ${名}（定义见技能库）`).join('\n') : '无',
    '',
    '【开局世界坐标】',
    `当前时间：${值.当前时间 || '都市历 984-10-31 15:53'}`,
    `当前地点：${值.当前地点 || '16区后巷，拉·曼却领外围'}`,
    `当前场景：${值.当前场景 || '日常'}`,
  ];
  if (值.开场情境) {
    行.push('', '【开场情境】', 值.开场情境);
  }
  行.push('', '以上为玩家角色初始设定与开场情境，请据此铺开开场场景。');
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
    data.玩家状态.基础信息.阶层 = 值.阶层;
    data.玩家状态.基础信息.等级 = 值.等级;

    const 槽 = (键: 装备槽键) => 值.装备[键] ?? { 名称: '', 效果: '' };
    const 建槽 = (键: 装备槽键) => ({ 名称: 槽(键).名称 || '无', 效果: 规范化装备效果(槽(键).效果) });
    data.玩家状态.穿着装备.上衣 = 建槽('上衣');
    data.玩家状态.穿着装备.下装 = 建槽('下装');
    data.玩家状态.穿着装备.武器 = 建槽('武器');
    data.玩家状态.穿着装备.防具 = 建槽('防具');
    data.玩家状态.穿着装备.物品 = 建槽('物品');

    data.玩家状态.罪孽抗性.暴怒 = Number(值.罪孽抗性.暴怒);
    data.玩家状态.罪孽抗性.色欲 = Number(值.罪孽抗性.色欲);
    data.玩家状态.罪孽抗性.怠惰 = Number(值.罪孽抗性.怠惰);
    data.玩家状态.罪孽抗性.暴食 = Number(值.罪孽抗性.暴食);
    data.玩家状态.罪孽抗性.忧郁 = Number(值.罪孽抗性.忧郁);
    data.玩家状态.罪孽抗性.傲慢 = Number(值.罪孽抗性.傲慢);
    data.玩家状态.罪孽抗性.嫉妒 = Number(值.罪孽抗性.嫉妒);
    data.玩家状态.物理抗性.斩击 = Number(值.物理抗性.斩击);
    data.玩家状态.物理抗性.突刺 = Number(值.物理抗性.突刺);
    data.玩家状态.物理抗性.打击 = Number(值.物理抗性.打击);

    data.玩家状态.生命体征.护盾 = 0;
    data.玩家状态.生命体征.理智值.数值 = 值.理智值;
    data.玩家状态.生命体征.混乱.数值 = 0;
    data.玩家状态.生命体征.混乱.阈值 = 值.混乱无 ? 0 : 值.混乱阈值;
    data.玩家状态.生命体征.生命值.数值 = -1;

    data.玩家状态.技能 = [...值.技能];

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

.sub-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--b-muted);
  letter-spacing: 1px;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.field {
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
  padding: 7px 9px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: #0b080b;
  color: var(--b-text);
  font-family: inherit;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
  border-color: var(--b-accent-2);
  box-shadow: 0 0 0 2px rgba(217, 164, 65, 0.15);
}

.field-input.mini {
  padding: 5px 7px;
  font-size: 12px;
}

.span-2 {
  grid-column: span 2;
}

.level-field,
.rank-field {
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

.rank-current {
  font-size: 11px;
  color: var(--b-muted);
}

.rank-current b {
  color: var(--b-player);
  font-variant-numeric: tabular-nums;
}

.life-table {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 9px;
  border: 1px dashed var(--b-border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
}

.life-row {
  display: grid;
  grid-template-columns: 52px 1fr auto;
  gap: 8px;
  align-items: baseline;
  font-size: 11px;
  color: var(--b-muted);
  padding: 1px 4px;
  border-radius: 4px;
}

.life-row.active {
  color: var(--b-text);
  background: rgba(217, 164, 65, 0.1);
}

.life-rank {
  color: var(--b-accent-2);
  font-weight: 700;
}

.life-cap {
  font-variant-numeric: tabular-nums;
}

.field-error {
  font-size: 10px;
  color: #e88a7c;
}

.equip-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resist-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}

.resist-field {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 7px;
  border: 1px solid var(--b-border);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.18);
}

.resist-label {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 700;
}

.chaos-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--b-accent-2);
  cursor: pointer;
  white-space: nowrap;
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

  .span-2,
  .level-field,
  .rank-field {
    grid-column: auto;
  }

  .resist-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
