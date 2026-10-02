<template>
  <div v-if="result" class="clash-view" :class="{ shaking: 震动, finishing: 收尾 }">
    <div class="clash-title">
      <span class="clash-label">技能拼点</span>
      <span class="clash-counter">拼点 ×{{ 拼点计数 }} / {{ result.记录.length }}</span>
      <span class="clash-extra">
        攻级 {{ result.左侧攻击等级加成 }}/{{ result.右侧攻击等级加成 }} · 威力 {{ result.左侧拼点威力加成 }}/{{ result.右侧拼点威力加成 }}
      </span>
    </div>

    <div class="clash-arena">
      <div class="skill-card left" :class="{ engage: 阶段 !== '入场' && 阶段 !== '收尾' }">
        <span class="card-sin" :style="{ background: 左罪孽色 }" />
        <div class="card-top">
          <AttackIcon :类型="左攻击类型" />
          <span class="card-name">{{ result.左侧技能 }}</span>
        </div>
        <div class="card-owner">{{ result.左侧名称 }}</div>
        <div class="card-base">基础威力 <b>{{ 左基础 }}</b></div>
        <div class="card-coins">
          <span
            v-for="c in result.左侧初始硬币"
            :key="c.id"
            class="card-coin"
            :class="硬币类(c.类型)"
            :title="`${c.类型} 硬币 · 威力 ${c.威力}`"
          >
            {{ c.威力 }}
          </span>
        </div>
      </div>

      <div class="vs-badge">VS</div>

      <div class="skill-card right" :class="{ engage: 阶段 !== '入场' && 阶段 !== '收尾' }">
        <span class="card-sin" :style="{ background: 右罪孽色 }" />
        <div class="card-top">
          <AttackIcon :类型="右攻击类型" />
          <span class="card-name">{{ result.右侧技能 }}</span>
        </div>
        <div class="card-owner">{{ result.右侧名称 }}</div>
        <div class="card-base">基础威力 <b>{{ 右基础 }}</b></div>
        <div class="card-coins">
          <span
            v-for="c in result.右侧初始硬币"
            :key="c.id"
            class="card-coin"
            :class="硬币类(c.类型)"
            :title="`${c.类型} 硬币 · 威力 ${c.威力}`"
          >
            {{ c.威力 }}
          </span>
        </div>
      </div>
    </div>

    <div class="power-clash" :class="{ charge: 阶段 === '碰撞' || 阶段 === '结果' || 阶段 === '收尾' }">
      <span class="power-num left" :class="威力类('左')">{{ 显示左威力 }}</span>
      <span class="power-clash-vs">✦</span>
      <span class="power-num right" :class="威力类('右')">{{ 显示右威力 }}</span>
    </div>

    <div class="coin-arena">
      <div class="coin-side">
        <Coin
          v-for="c in 左硬币"
          :key="`${索引}-${c.id}`"
          :coin="c"
          :size="26"
          :destroyed="已摧毁左.has(c.id)"
          :glow="收尾 && result.胜者 === '左'"
          :dim="收尾 && result.胜者 === '右'"
        />
      </div>
      <div class="coin-round">
        <span>{{ 阶段文本 }}</span>
        <small v-if="当前记录">第 {{ 当前记录.回合数 }} 回合</small>
      </div>
      <div class="coin-side">
        <Coin
          v-for="c in 右硬币"
          :key="`${索引}-${c.id}`"
          :coin="c"
          :size="26"
          :destroyed="已摧毁右.has(c.id)"
          :glow="收尾 && result.胜者 === '右'"
          :dim="收尾 && result.胜者 === '左'"
        />
      </div>
    </div>

    <div class="clash-result">
      <template v-if="收尾">拼点结束 · {{ result.胜者 === '左' ? result.左侧名称 : result.胜者 === '右' ? result.右侧名称 : '无人' }} 占据优势</template>
      <template v-else-if="当前记录?.结果 === '平局'">平局，重掷</template>
      <template v-else-if="当前记录?.摧毁">
        {{ 当前记录.结果 === '左胜' ? result.右侧名称 : result.左侧名称 }} 的硬币 #{{ 当前记录.摧毁.硬币id }} 被击碎
      </template>
      <template v-else-if="当前记录">僵持</template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 技能, 攻击类型名, 罪孽名, 硬币类型, 拼点结果 } from '../engine/types';
import { 罪孽颜色 } from '../engine/types';
import AttackIcon from './AttackIcon.vue';
import Coin from './Coin.vue';
import { 播放音效 } from '../util/sfx';

const props = defineProps<{
  result: 拼点结果 | null;
  左侧技能?: 技能;
  右侧技能?: 技能;
}>();

const emit = defineEmits<{ (e: 'done'): void; (e: 'shake'): void }>();

const 索引 = ref(0);
const 阶段 = ref<'入场' | '掷币' | '碰撞' | '结果' | '收尾'>('入场');
const 显示左威力 = ref(0);
const 显示右威力 = ref(0);
const 震动 = ref(false);
const 收尾 = ref(false);
const 拼点计数 = ref(0);
const 已摧毁左 = ref<Set<number>>(new Set());
const 已摧毁右 = ref<Set<number>>(new Set());

let 运行标记 = 0;

const 当前记录 = computed(() => props.result?.记录[索引.value] ?? null);
const 左硬币 = computed(() => 当前记录.value?.左侧硬币 ?? []);
const 右硬币 = computed(() => 当前记录.value?.右侧硬币 ?? []);

const 左攻击类型 = computed<攻击类型名>(() => props.左侧技能?.攻击类型 ?? '打击');
const 右攻击类型 = computed<攻击类型名>(() => props.右侧技能?.攻击类型 ?? '打击');
const 左基础 = computed(() => props.左侧技能?.基础威力 ?? '?');
const 右基础 = computed(() => props.右侧技能?.基础威力 ?? '?');
const 左罪孽色 = computed(() => (props.左侧技能 ? 罪孽颜色[props.左侧技能.罪孽 as 罪孽名] : 'var(--b-accent)'));
const 右罪孽色 = computed(() => (props.右侧技能 ? 罪孽颜色[props.右侧技能.罪孽 as 罪孽名] : 'var(--b-enemy)'));

const 阶段文本 = computed(() => {
  switch (阶段.value) {
    case '入场':
      return '对峙…';
    case '掷币':
      return '掷币';
    case '碰撞':
      return '拼点！';
    case '结果':
      return 当前记录.value?.结果 === '平局' ? '平局' : '压制';
    default:
      return 收尾.value ? '决出胜负' : '';
  }
});

function 硬币类(类型: 硬币类型): string {
  switch (类型) {
    case '不可摧毁':
      return 'red';
    case '截除':
      return 'green';
    case '无我':
      return 'purple';
    default:
      return 'normal';
  }
}

function 威力类(方: '左' | '右'): string {
  if (阶段.value !== '结果' && 阶段.value !== '收尾') return '';
  const 记录 = 当前记录.value;
  if (!记录 || 记录.结果 === '平局') return 'draw';
  const 胜方 = 记录.结果 === '左胜' ? '左' : '右';
  return 方 === 胜方 ? 'win' : 'lose';
}

const 等待 = (毫秒: number) => new Promise<void>(resolve => setTimeout(resolve, 毫秒));

async function 播放(): Promise<void> {
  const r = props.result;
  const token = ++运行标记;
  if (!r || r.记录.length === 0) {
    阶段.value = '入场';
    await 等待(260);
    if (token === 运行标记) emit('done');
    return;
  }

  索引.value = 0;
  收尾.value = false;
  阶段.value = '入场';
  已摧毁左.value = new Set();
  已摧毁右.value = new Set();
  拼点计数.value = 0;
  显示左威力.value = 0;
  显示右威力.value = 0;
  播放音效('硬币翻转');
  await 等待(420);
  if (token !== 运行标记) return;

  for (let i = 0; i < r.记录.length; i++) {
    索引.value = i;
    const 记录 = r.记录[i];

    阶段.value = '掷币';
    显示左威力.value = 0;
    显示右威力.value = 0;
    播放音效('硬币翻转');
    await 等待(340);
    if (token !== 运行标记) return;

    阶段.value = '碰撞';
    显示左威力.value = 记录.左侧威力;
    显示右威力.value = 记录.右侧威力;
    拼点计数.value = 记录.回合数;
    播放音效('拼点碰撞');
    震动.value = true;
    emit('shake');
    await 等待(230);
    震动.value = false;
    if (token !== 运行标记) return;

    if (记录.摧毁) {
      if (记录.摧毁.方 === '左') 已摧毁左.value = new Set([...已摧毁左.value, 记录.摧毁.硬币id]);
      else 已摧毁右.value = new Set([...已摧毁右.value, 记录.摧毁.硬币id]);
    }
    if (记录.额外击碎) {
      if (记录.额外击碎.方 === '左') 已摧毁左.value = new Set([...已摧毁左.value, 记录.额外击碎.硬币id]);
      else 已摧毁右.value = new Set([...已摧毁右.value, 记录.额外击碎.硬币id]);
    }
    if (记录.摧毁 || 记录.额外击碎) 播放音效('硬币碎裂');

    阶段.value = '结果';
    await 等待(480);
    if (token !== 运行标记) return;
  }

  阶段.value = '收尾';
  收尾.value = true;
  await 等待(720);
  if (token !== 运行标记) return;
  emit('done');
}

watch(() => props.result, () => void 播放(), { immediate: true });

onUnmounted(() => {
  运行标记 += 1;
});
</script>

<style scoped>
.clash-view {
  position: relative;
  border: 1px solid var(--b-accent);
  border-radius: 10px;
  background:
    radial-gradient(120% 90% at 50% -20%, rgba(200, 69, 47, 0.22), transparent 60%),
    linear-gradient(160deg, #1b1118, #0d0a0d);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.clash-view.finishing {
  box-shadow: 0 0 22px rgba(217, 164, 65, 0.25);
}

.clash-view.shaking {
  animation: clash-shake 0.26s ease;
}

@keyframes clash-shake {
  0%, 100% { transform: translate(0, 0); }
  20% { transform: translate(-4px, 2px); }
  40% { transform: translate(4px, -2px); }
  60% { transform: translate(-3px, -1px); }
  80% { transform: translate(3px, 1px); }
}

.clash-title {
  display: flex;
  align-items: baseline;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  color: var(--b-accent-2);
}

.clash-label {
  letter-spacing: 2px;
}

.clash-counter {
  font-size: 11px;
  color: var(--b-text);
  padding: 1px 6px;
  border: 1px solid var(--b-border);
  border-radius: 8px;
}

.clash-extra {
  margin-left: auto;
  font-size: 10px;
  color: var(--b-muted);
  font-weight: 400;
}

.clash-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 10px;
  align-items: stretch;
}

.skill-card {
  position: relative;
  border: 1px solid var(--b-border);
  border-radius: 8px;
  background: linear-gradient(150deg, rgba(36, 29, 36, 0.95), rgba(16, 13, 16, 0.95));
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  transition: transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.skill-card.left {
  transform: translateX(-16px);
  opacity: 0.85;
}

.skill-card.right {
  transform: translateX(16px);
  opacity: 0.85;
}

.skill-card.engage {
  transform: translateX(0);
  opacity: 1;
}

.skill-card.left.engage {
  box-shadow: 0 0 14px rgba(79, 163, 209, 0.18);
}

.skill-card.right.engage {
  box-shadow: 0 0 14px rgba(200, 69, 47, 0.18);
}

.card-sin {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.card-name {
  font-weight: 800;
  letter-spacing: 1px;
}

.card-owner {
  font-size: 10px;
  color: var(--b-muted);
}

.card-base {
  font-size: 11px;
  color: var(--b-muted);
}

.card-base b {
  color: var(--b-text);
  font-size: 13px;
}

.card-coins {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 2px;
}

.card-coin {
  min-width: 18px;
  text-align: center;
  padding: 0 3px;
  font-size: 10px;
  border-radius: 3px;
  border: 1px solid #888;
  color: var(--b-text);
  background: rgba(0, 0, 0, 0.3);
}

.card-coin.red {
  border-color: #e0503a;
  color: #f0a090;
}

.card-coin.green {
  border-color: #4fbf6a;
  color: #a0e0b0;
}

.card-coin.purple {
  border-color: #a05de0;
  color: #c8a0f0;
}

.card-coin.normal {
  border-color: #c8c8d0;
  color: #d8d8e0;
}

.vs-badge {
  align-self: center;
  font-weight: 900;
  font-size: 16px;
  color: var(--b-enemy);
  text-shadow: 0 0 10px rgba(200, 69, 47, 0.6);
}

.power-clash {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  min-height: 42px;
}

.power-num {
  font-size: 30px;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
  color: var(--b-text);
  opacity: 0.2;
  transition:
    transform 0.22s cubic-bezier(0.3, 1.4, 0.5, 1),
    opacity 0.22s ease,
    color 0.25s ease,
    filter 0.25s ease;
}

.power-clash.charge .power-num.left {
  transform: translateX(30px);
  opacity: 1;
}

.power-clash.charge .power-num.right {
  transform: translateX(-30px);
  opacity: 1;
}

.power-num.win {
  color: var(--b-accent-2);
  text-shadow: 0 0 14px rgba(217, 164, 65, 0.75);
}

.power-num.lose {
  color: var(--b-muted);
  filter: grayscale(1) brightness(0.7);
  text-decoration: line-through;
}

.power-num.draw {
  color: var(--b-text);
}

.power-clash-vs {
  color: var(--b-accent-2);
  font-size: 14px;
  opacity: 0.7;
}

.coin-arena {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid var(--b-border);
}

.coin-side {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.coin-side:last-child {
  justify-content: center;
}

.coin-round {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
  font-size: 11px;
  font-weight: 700;
  color: var(--b-accent-2);
}

.coin-round small {
  font-size: 9px;
  color: var(--b-muted);
  font-weight: 400;
}

.clash-result {
  text-align: center;
  font-size: 12px;
  color: var(--b-accent-2);
  letter-spacing: 1px;
}
</style>
