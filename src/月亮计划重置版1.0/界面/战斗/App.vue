<template>
  <div class="battle-panel" :class="{ shaking: 震动中 }" @pointerdown="初始化音频">
    <header class="panel-head">
      <span class="title">边狱战斗面板</span>
      <span class="round">第 {{ 回合数 }} 回合</span>
      <span v-if="当前行动单位" class="current">当前行动：{{ 当前行动单位.名称 }}</span>
      <span v-else class="current muted">战斗结束</span>
      <button class="head-btn" :class="{ off: 静音 }" @click="切换静音">{{ 静音 ? '音效关' : '音效开' }}</button>
      <button class="head-btn" @click="重开">重开</button>
    </header>

    <div class="speed-order">
      <span
        v-for="(名称, 下标) in 战斗 ? 战斗.速度顺序 : []"
        :key="名称"
        class="speed-chip"
        :class="{ active: 战斗 && 下标 === 战斗.行动指针, dead: !单位存活(名称) }"
      >
        {{ 下标 + 1 }}. {{ 名称 }}
      </span>
    </div>

    <div class="columns">
      <section class="side">
        <h3>我方小队</h3>
        <UnitCard
          v-for="单位 in 我方单位"
          :key="单位.名称"
          :unit="单位"
          :is-current="当前行动单位?.名称 === 单位.名称"
          :is-targetable="可标靶(单位)"
          :is-target="已选目标列表.includes(单位.名称)"
          @click="单位点击(单位)"
        />
      </section>

      <section class="side">
        <h3>敌方小队</h3>
        <UnitCard
          v-for="单位 in 敌方单位"
          :key="单位.名称"
          :unit="单位"
          :is-current="当前行动单位?.名称 === 单位.名称"
          :is-targetable="可标靶(单位)"
          :is-target="已选目标列表.includes(单位.名称)"
          @click="单位点击(单位)"
        />
      </section>
    </div>

    <div v-if="模式 === '选目标'" class="target-area">
      <TargetPicker
        :targets="可选目标"
        :selected="已选目标列表"
        :max="待选容量"
        @toggle="切换目标"
        @confirm="确认目标"
        @cancel="取消选择"
      />
    </div>

    <div v-if="玩家单位 && 存活(玩家单位)" class="player-area">
      <div class="player-title">
        你的行动
        <span v-if="模式 === '选技能'" class="step">① 选择技能</span>
        <span v-else-if="模式 === '选目标'" class="step">② 选择目标</span>
        <span v-else-if="模式 === '结算'" class="step">结算中…</span>
        <span v-else class="step muted">等待其他单位行动</span>
      </div>
      <SkillBar
        :skills="玩家单位.技能"
        :selected="已选技能"
        :disabled="模式 !== '选技能' && 模式 !== '选目标'"
        :资源="玩家单位.罪孽资源"
        :理智值="玩家单位.理智值"
        @select="选择技能"
      />
    </div>

    <ClashView
      v-if="当前拼点"
      :result="当前拼点"
      :左侧技能="拼点技能?.左"
      :右侧技能="拼点技能?.右"
      @done="拼点结束"
      @shake="触发震动"
    />

    <div
      v-if="最近命中列表.length > 0 && !当前拼点"
      class="hit-summary"
      :class="{ crit: 最近命中列表.some(命中 => 命中.伤害.some(伤害 => 伤害.暴击)) }"
    >
      <div v-for="(命中, 下标) in 最近命中列表" :key="下标" class="hit-row">
        <span class="hit-text">{{ 命中.文本 }}</span>
        <span v-if="命中.侵蚀" class="hit-badge corrosion">侵蚀</span>
        <span v-if="命中.守备结果" class="hit-badge defend">{{ 命中.守备结果 }}</span>
        <span v-if="命中.目标混乱" class="hit-badge chaos">混乱</span>
        <span v-if="命中.目标死亡" class="hit-badge death">击倒</span>
        <span v-for="(伤害, 伤害下标) in 命中.伤害" :key="伤害下标" class="dmg-pop" :class="{ crit: 伤害.暴击 }">
          -{{ 伤害.数值 }}
        </span>
        <span
          v-for="(变化, sp下标) in 命中.SP变化 ?? []"
          :key="`sp-${sp下标}`"
          class="sp-pop"
          :class="{ up: 变化.变化 > 0, down: 变化.变化 < 0 }"
        >
          {{ 变化.名称 }} SP {{ 变化.变化 > 0 ? '+' : '' }}{{ 变化.变化 }}
        </span>
      </div>
    </div>

    <BattleLog :logs="汇总日志" />

    <ResultModal
      :result="显示结果 ? 战斗?.结束 ?? null : null"
      :回合="回合数"
      :经验结算="经验结算"
      @restart="重开"
      @close="显示结果 = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from './store';
import { 构建全部单位, 写回战斗, 生成回合摘要 } from './bridge';
import { 创建战斗状态, 准备回合, 结算当前行动, 推进行动, 结束回合, 当前单位, 存活, 敌对 } from './engine/battle';
import { 结算罪孽共鸣 } from './engine/status';
import { 结算经验, 经验奖励 } from './engine/level';
import type { 战斗单位, 战斗状态, 命中结果, 拼点结果 } from './engine/types';
import type { 经验结算信息 } from './util/types';
import { 播放音效, 静音, 切换静音, 初始化音频 } from './util/sfx';
import UnitCard from './components/UnitCard.vue';
import SkillBar from './components/SkillBar.vue';
import TargetPicker from './components/TargetPicker.vue';
import ClashView from './components/ClashView.vue';
import BattleLog from './components/BattleLog.vue';
import ResultModal from './components/ResultModal.vue';

const store = useDataStore();
const data = store.data;

const 战斗 = ref<战斗状态 | null>(null);
const 模式 = ref<'准备' | '选技能' | '选目标' | '结算' | '结束'>('准备');
const 已选技能 = ref<string | null>(null);
const 已选目标列表 = ref<string[]>([]);
const 当前拼点 = ref<拼点结果 | null>(null);
const 最近命中列表 = ref<命中结果[]>([]);
const 汇总日志 = ref<string[]>([]);
const 显示结果 = ref(false);
const 回合数 = ref(1);
const 经验结算 = ref<经验结算信息 | null>(null);
const 震动中 = ref(false);

let 拼点完成: (() => void) | null = null;
let 震动定时: ReturnType<typeof setTimeout> | null = null;

const 我方单位 = computed(() => 战斗.value?.单位.filter(单位 => 单位.阵营 !== '敌人') ?? []);
const 敌方单位 = computed(() => 战斗.value?.单位.filter(单位 => 单位.阵营 === '敌人') ?? []);

const 当前行动单位 = computed(() => (战斗.value ? 当前单位(战斗.value) : undefined));
const 玩家单位 = computed(() => 战斗.value?.单位.find(单位 => 单位.是否玩家));

const 拼点技能 = computed(() => {
  const 结果 = 当前拼点.value;
  if (!结果 || !战斗.value) return null;
  const 左 = 战斗.value.单位.find(单位 => 单位.名称 === 结果.左侧名称);
  const 右 = 战斗.value.单位.find(单位 => 单位.名称 === 结果.右侧名称);
  return { 左: 左?.技能[结果.左侧技能], 右: 右?.技能[结果.右侧技能] };
});

function 触发震动(): void {
  震动中.value = true;
  if (震动定时 !== null) clearTimeout(震动定时);
  震动定时 = setTimeout(() => {
    震动中.value = false;
    震动定时 = null;
  }, 280);
}

const 可选目标 = computed(() => {
  const 玩家 = 玩家单位.value;
  if (!玩家 || !战斗.value) return [];
  return 战斗.value.单位.filter(单位 => 敌对(玩家, 单位) && 存活(单位));
});

const 待选容量 = computed(() => {
  const 玩家 = 玩家单位.value;
  const 名称 = 已选技能.value;
  if (!玩家 || !名称) return 1;
  return Math.max(1, 玩家.技能[名称]?.攻击容量 ?? 1);
});

function 无法行动(单位: 战斗单位): boolean {
  return 单位.恐慌状态 === '生效中' || (单位.混乱阈值 > 0 && 单位.混乱值 >= 单位.混乱阈值);
}

function 单位存活(名称: string): boolean {
  const 单位 = 战斗.value?.单位.find(项 => 项.名称 === 名称);
  return !!单位 && 存活(单位);
}

function 同步日志(): void {
  if (战斗.value) 汇总日志.value = [...战斗.value.日志];
}

function 写回(): void {
  const b = 战斗.value;
  if (!b) return;
  写回战斗(data, b.单位, b.回合, b.速度顺序, b.当前行动者, 汇总日志.value, !b.结束);
  回合数.value = b.回合;
}

function 等待拼点动画(): Promise<void> {
  return new Promise<void>(resolve => {
    拼点完成 = resolve;
  });
}

function 拼点结束(): void {
  当前拼点.value = null;
  拼点完成?.();
  拼点完成 = null;
}

async function 处理命中(命中: 命中结果): Promise<void> {
  最近命中列表.value = [...最近命中列表.value, 命中];
  if (命中.拼点) {
    当前拼点.value = 命中.拼点;
    await 等待拼点动画();
  }
  if (命中.跳过行动) return;
  触发震动();
  播放音效(命中.伤害.some(伤害 => 伤害.暴击) ? '暴击' : '命中');
  if (命中.目标混乱 || 命中.追加.length > 0) 播放音效('状态附加');
}

async function 发送回合摘要(): Promise<void> {
  const b = 战斗.value;
  if (!b) return;
  const 文本 = 生成回合摘要(Math.max(1, b.回合 - 1), b.单位, 汇总日志.value, b.结束);
  try {
    await createChatMessages([{ role: 'user', message: 文本 }], { refresh: 'none' });
  } catch (错误) {
    console.error('[战斗面板] 发送回合摘要失败', 错误);
  }
}

/** 玩家需要选择时进入等待并返回 false, 否则返回 true */
function 等待玩家选择(): boolean {
  const 玩家 = 玩家单位.value;
  if (玩家 && 存活(玩家) && !玩家.已行动) {
    已选技能.value = null;
    已选目标列表.value = [];
    模式.value = '选技能';
    return false;
  }
  return true;
}

function 结算玩家经验(): void {
  const 玩家 = data.玩家状态?.基础信息;
  if (!玩家) return;
  const 敌人等级 = (战斗.value?.单位 ?? []).filter(单位 => 单位.阵营 === '敌人').map(单位 => 单位.等级);
  const 获得 = 经验奖励(敌人等级);
  const 旧等级 = 玩家.等级 ?? 1;
  const 结果 = 结算经验(旧等级, 玩家.经验 ?? 0, 获得);
  玩家.等级 = 结果.等级;
  玩家.经验 = 结果.经验;
  经验结算.value = {
    获得经验: 获得,
    升级次数: 结果.升级次数,
    旧等级,
    新等级: 结果.等级,
    战力评级: 结果.战力评级,
  };
  汇总日志.value = [...汇总日志.value, `战斗胜利, 获得 ${获得} 经验${结果.升级次数 > 0 ? `, 升至 ${结果.等级} 级` : ''}`];
}

async function 自动推进(): Promise<void> {
  const b = 战斗.value;
  if (!b) return;

  while (!b.结束) {
    const 行动者 = 当前单位(b);
    if (!行动者 || !存活(行动者)) {
      if (推进行动(b)) {
        结束回合(b);
        同步日志();
        await 发送回合摘要();
        if (b.结束) break;
        if (!等待玩家选择()) return;
      }
      continue;
    }
    if (行动者.是否玩家 && !行动者.已选技能 && !行动者.已行动 && !无法行动(行动者)) {
      if (!等待玩家选择()) return;
    }
    模式.value = '结算';
    最近命中列表.value = [];
    const 命中列表 = 结算当前行动(b);
    if (命中列表) {
      for (const 命中 of 命中列表) await 处理命中(命中);
    }
    同步日志();
    写回();
    if (b.结束) break;
    if (推进行动(b)) {
      结束回合(b);
      同步日志();
      await 发送回合摘要();
      if (b.结束) break;
      if (!等待玩家选择()) return;
    }
  }

  同步日志();
  if (b.结束 === '玩家胜') {
    结算玩家经验();
    播放音效('胜利');
    if (经验结算.value && 经验结算.value.升级次数 > 0) setTimeout(() => 播放音效('升级'), 520);
  } else if (b.结束 === '敌人胜') {
    播放音效('失败');
  }
  写回();
  模式.value = '结束';
  当前拼点.value = null;
  显示结果.value = true;
  console.info('[战斗面板] 战斗结束', b.结束);
}

function 选择技能(技能名: string): void {
  if (模式.value !== '选技能' && 模式.value !== '选目标') return;
  已选技能.value = 技能名;
  已选目标列表.value = [];
  模式.value = '选目标';
}

function 切换目标(名称: string): void {
  if (模式.value !== '选目标') return;
  const 玩家 = 玩家单位.value;
  const 单位 = 战斗.value?.单位.find(目标 => 目标.名称 === 名称);
  if (!玩家 || !单位 || !存活(单位) || !敌对(玩家, 单位)) return;
  const 当前 = 已选目标列表.value;
  if (当前.includes(名称)) {
    已选目标列表.value = 当前.filter(项 => 项 !== 名称);
    return;
  }
  if (当前.length >= 待选容量.value) return;
  已选目标列表.value = [...当前, 名称];
}

function 确认目标(): void {
  const 玩家 = 当前行动单位.value;
  if (!玩家 || 已选目标列表.value.length === 0) return;
  玩家.已选技能 = 已选技能.value;
  玩家.已选目标 = [...已选目标列表.value];
  // 玩家确认后重算罪孽共鸣, 使其计入我方本回合所选技能
  if (战斗.value) {
    战斗.value.日志.push(...结算罪孽共鸣(战斗.value.单位));
    同步日志();
  }
  模式.value = '结算';
  void 自动推进();
}

function 取消选择(): void {
  已选技能.value = null;
  已选目标列表.value = [];
  模式.value = '选技能';
}

function 可标靶(单位: 战斗单位): boolean {
  const 玩家 = 玩家单位.value;
  return !!玩家 && 模式.value === '选目标' && 敌对(玩家, 单位) && 存活(单位);
}

function 单位点击(单位: 战斗单位): void {
  if (!可标靶(单位)) return;
  切换目标(单位.名称);
}

function 重开(): void {
  显示结果.value = false;
  初始化();
}

function 初始化(): void {
  const 全部 = 构建全部单位(data);
  const b = 创建战斗状态(全部);
  战斗.value = b;
  准备回合(战斗.value);
  同步日志();
  回合数.value = b.回合;
  已选技能.value = null;
  已选目标列表.value = [];
  当前拼点.value = null;
  最近命中列表.value = [];
  经验结算.value = null;
  写回();
  console.info('[战斗面板] 战斗开始', b.速度顺序);
  if (等待玩家选择()) {
    void 自动推进();
  }
}

onMounted(() => {
  初始化();
});
</script>

<style lang="scss" scoped>
.battle-panel {
  width: 100%;
  max-width: 900px;
  margin: 16px auto;
  padding: 14px;
  border-radius: 10px;
  background: var(--b-bg);
  border: 1px solid var(--b-border);
  color: var(--b-text);
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  position: relative;
}

.battle-panel.shaking {
  animation: panel-shake 0.28s ease;
}

@keyframes panel-shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-3px, 2px); }
  40% { transform: translate(3px, -2px); }
  60% { transform: translate(-2px, -1px); }
  80% { transform: translate(2px, 1px); }
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--b-border);
}

.title {
  font-size: 16px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--b-accent-2);
}

.round {
  padding: 1px 8px;
  border: 1px solid var(--b-border);
  border-radius: 10px;
  font-size: 12px;
  color: var(--b-muted);
}

.current {
  font-size: 12px;
}

.current.muted {
  color: var(--b-muted);
}

.head-btn {
  padding: 5px 12px;
  border: 1px solid var(--b-accent);
  border-radius: 5px;
  background: transparent;
  color: var(--b-accent);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
}

.head-btn:first-of-type {
  margin-left: auto;
}

.head-btn:hover {
  background: rgba(200, 69, 47, 0.15);
}

.head-btn.off {
  border-color: var(--b-border);
  color: var(--b-muted);
}

.speed-order {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.speed-chip {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--b-border);
  background: var(--b-surface);
  color: var(--b-muted);
}

.speed-chip.active {
  border-color: var(--b-accent-2);
  color: var(--b-accent-2);
}

.speed-chip.dead {
  opacity: 0.35;
  text-decoration: line-through;
}

.columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side h3 {
  margin: 0;
  font-size: 12px;
  color: var(--b-muted);
  font-weight: 500;
}

.target-area,
.player-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hit-summary {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  background: var(--b-surface);
  border: 1px solid var(--b-border);
}

.hit-summary.crit {
  border-color: var(--b-accent-2);
  box-shadow: 0 0 12px rgba(217, 164, 65, 0.25);
}

.hit-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  width: 100%;
}

.hit-text {
  flex: 1 1 200px;
}

.sp-pop {
  font-size: 11px;
  font-weight: 700;
  padding: 0 5px;
  border-radius: 6px;
  border: 1px solid var(--b-border);
}

.sp-pop.up {
  color: #8fe0a2;
  border-color: #4fbf6a;
}

.sp-pop.down {
  color: #e88a7c;
  border-color: #d94b3a;
}

.hit-badge {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
  padding: 1px 6px;
  border-radius: 8px;
  animation: badge-in 0.35s ease;
}

.hit-badge.chaos {
  color: #1b1207;
  background: var(--b-chaos);
}

.hit-badge.defend {
  color: #06121b;
  background: #7fc6e0;
}

.hit-badge.death {
  color: #fff;
  background: var(--b-enemy);
  box-shadow: 0 0 10px rgba(200, 69, 47, 0.7);
}

.hit-badge.corrosion {
  color: #12061b;
  background: linear-gradient(90deg, #a05de0, #e05297);
  box-shadow: 0 0 10px rgba(160, 93, 224, 0.7);
}

@keyframes badge-in {
  0% { transform: scale(0.5) rotate(-8deg); opacity: 0; }
  70% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}

.dmg-pop {
  font-weight: 800;
  color: var(--b-hp);
  animation: dmg-rise 0.6s ease;
}

.dmg-pop.crit {
  color: var(--b-accent-2);
  font-size: 15px;
  text-shadow: 0 0 10px rgba(217, 164, 65, 0.8);
}

@keyframes dmg-rise {
  0% {
    transform: translateY(8px) scale(0.7);
    opacity: 0;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
