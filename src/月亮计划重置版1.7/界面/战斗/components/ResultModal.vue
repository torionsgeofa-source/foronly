<template>
  <div v-if="result" class="result-overlay">
    <div class="result-box" :class="result === '玩家胜' ? 'win' : 'lose'">
      <div class="result-title">{{ result === '玩家胜' ? '战斗胜利' : '战斗失败' }}</div>
      <div class="result-sub">历时 {{ 回合 }} 回合</div>

      <template v-if="result === '玩家胜' && 经验结算">
        <div class="result-divider" />
        <div class="exp-row">
          <span class="exp-label">获得经验</span>
          <span class="exp-value">+{{ 经验结算.获得经验 }}</span>
        </div>
        <div v-if="经验结算.升级次数 > 0" class="levelup">
          <span class="levelup-tag">LEVEL UP ×{{ 经验结算.升级次数 }}</span>
          <span class="levelup-flow">
            <span class="lv old">Lv.{{ 经验结算.旧等级 }}</span>
            <span class="lv-arrow">→</span>
            <span class="lv new">Lv.{{ 经验结算.新等级 }}</span>
          </span>
        </div>
        <div v-else class="levelup muted">
          <span class="levelup-flow">
            <span class="lv">Lv.{{ 经验结算.新等级 }}</span>
            <span class="levelup-note">经验累积中</span>
          </span>
        </div>
        <div class="rank-row">
          <span class="rank-label">战力评级</span>
          <span class="rank-value" :class="评级类">{{ 经验结算.战力评级 }}</span>
        </div>
      </template>

      <div v-else-if="result !== '玩家胜'" class="defeat-note">战斗结束，你的意识沉入黑暗……</div>

      <div class="result-actions">
        <button class="result-btn" @click="emit('restart')">再战一场</button>
        <button class="result-btn ghost" @click="emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { 经验结算信息 } from '../util/types';

const props = defineProps<{
  result: null | '玩家胜' | '敌人胜';
  回合: number;
  经验结算?: 经验结算信息 | null;
}>();

const emit = defineEmits<{ (e: 'restart'): void; (e: 'close'): void }>();

const 评级类 = computed(() => {
  const 值 = props.经验结算?.战力评级 ?? '';
  if (值 === '色彩') return 'rank-color';
  if (值 === '一阶' || 值 === '二阶') return 'rank-high';
  if (值 === '三阶' || 值 === '四阶') return 'rank-mid';
  return 'rank-low';
});
</script>

<style scoped>
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  animation: overlay-in 0.25s ease;
}

@keyframes overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.result-box {
  min-width: 270px;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid var(--b-border);
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(217, 164, 65, 0.12), transparent 60%),
    var(--b-surface);
  animation: box-in 0.35s cubic-bezier(0.2, 1.2, 0.4, 1);
}

@keyframes box-in {
  from {
    transform: scale(0.85) translateY(10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.result-box.win {
  border-color: var(--b-player);
  box-shadow: 0 0 34px rgba(111, 206, 143, 0.4);
}

.result-box.lose {
  border-color: var(--b-enemy);
  box-shadow: 0 0 34px rgba(200, 69, 47, 0.4);
}

.result-title {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 5px;
}

.result-box.win .result-title {
  color: var(--b-player);
  text-shadow: 0 0 18px rgba(111, 206, 143, 0.5);
}

.result-box.lose .result-title {
  color: var(--b-enemy);
  text-shadow: 0 0 18px rgba(200, 69, 47, 0.5);
}

.result-sub {
  margin-top: 6px;
  font-size: 12px;
  color: var(--b-muted);
}

.result-divider {
  height: 1px;
  margin: 14px 0;
  background: linear-gradient(90deg, transparent, var(--b-border), transparent);
}

.exp-row,
.rank-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 2px;
}

.exp-label,
.rank-label {
  color: var(--b-muted);
}

.exp-value {
  font-size: 18px;
  font-weight: 800;
  color: var(--b-accent-2);
  animation: pop-in 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
}

@keyframes pop-in {
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.levelup {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.levelup.muted {
  opacity: 0.75;
}

.levelup-tag {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #1b1207;
  padding: 2px 10px;
  border-radius: 10px;
  background: linear-gradient(90deg, #d9a441, #f0d48a);
  animation: tag-glow 1.2s ease-in-out infinite alternate;
}

@keyframes tag-glow {
  from { box-shadow: 0 0 6px rgba(217, 164, 65, 0.4); }
  to { box-shadow: 0 0 16px rgba(240, 212, 138, 0.9); }
}

.levelup-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 800;
}

.lv.old {
  color: var(--b-muted);
  text-decoration: line-through;
}

.lv-arrow {
  color: var(--b-accent-2);
}

.lv.new {
  color: #f0d48a;
  animation: pop-in 0.6s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.levelup-note {
  font-size: 11px;
  color: var(--b-muted);
  font-weight: 400;
}

.rank-value {
  font-weight: 800;
  letter-spacing: 2px;
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid var(--b-border);
}

.rank-value.rank-low {
  color: #b6a9b3;
}

.rank-value.rank-mid {
  color: #9fc6e0;
  border-color: rgba(79, 163, 209, 0.6);
}

.rank-value.rank-high {
  color: #f0d48a;
  border-color: rgba(217, 164, 65, 0.7);
}

.rank-value.rank-color {
  color: #fff;
  border: 1px solid transparent;
  background:
    linear-gradient(var(--b-surface), var(--b-surface)) padding-box,
    linear-gradient(90deg, #e04b3a, #e0a53a, #4fb04f, #3aa0e0, #8a5de0) border-box;
  text-shadow: 0 0 6px rgba(255, 255, 255, 0.5);
}

.defeat-note {
  margin-top: 14px;
  font-size: 12px;
  color: var(--b-muted);
  letter-spacing: 1px;
}

.result-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}

.result-btn {
  padding: 8px 18px;
  border-radius: 6px;
  border: 1px solid var(--b-accent);
  background: var(--b-accent);
  color: #fff;
  cursor: pointer;
  font-family: inherit;
  font-weight: 700;
  transition: filter 0.15s, transform 0.1s;
}

.result-btn:hover {
  filter: brightness(1.12);
  transform: translateY(-1px);
}

.result-btn.ghost {
  background: transparent;
  color: var(--b-muted);
  border-color: var(--b-border);
}
</style>
