<template>
  <span class="coin-slot" :style="{ '--coin-size': size + 'px', '--coin-color': 颜色 }" :title="提示">
    <span
      class="coin"
      :class="[类型类, { flipped: 翻转态, destroyed: 已摧毁, broken: 已碎, glow, dim }]"
    >
      <span class="coin-face front">
        <span class="coin-glyph">◆</span>
        <span class="coin-power">{{ 显示威力 }}</span>
      </span>
      <span class="coin-face back">
        <span class="coin-glyph">✕</span>
      </span>
    </span>
    <span v-if="已摧毁" class="shards">
      <span v-for="i in 7" :key="i" class="shard" :style="{ '--i': i }" />
    </span>
    <span v-if="已碎 && !已摧毁" class="crack" />
  </span>
</template>

<script setup lang="ts">
import type { 硬币类型 } from '../engine/types';

interface 硬币显示 {
  id: number;
  威力: number;
  类型: 硬币类型;
  正面: boolean;
  固定?: boolean;
  已摧毁?: boolean;
  已破碎?: boolean;
}

const props = withDefaults(
  defineProps<{
    coin: 硬币显示;
    size?: number;
    destroyed?: boolean;
    glow?: boolean;
    dim?: boolean;
  }>(),
  { size: 30, destroyed: false, glow: false, dim: false },
);

const 已揭示 = ref(false);
onMounted(() => {
  requestAnimationFrame(() => {
    已揭示.value = true;
  });
});

/** 入场时从反面翻到目标面, 形成逐枚 3D 翻转观感 */
const 翻转态 = computed(() => (已揭示.value ? !props.coin.正面 : props.coin.正面));

const 颜色表: Record<硬币类型, string> = {
  普通: '#c8c8d0',
  不可摧毁: '#e0503a',
  截除: '#4fbf6a',
  无我: '#a05de0',
};

const 颜色 = computed(() => 颜色表[props.coin.类型] ?? 颜色表.普通);
const 已摧毁 = computed(() => props.destroyed || !!props.coin.已摧毁);
const 已碎 = computed(() => !!props.coin.已破碎 || !!props.coin.固定 || 已摧毁.value);
const 显示威力 = computed(() => (已碎.value ? 1 : props.coin.威力));

const 类型类 = computed(() => {
  switch (props.coin.类型) {
    case '不可摧毁':
      return 'type-red';
    case '截除':
      return 'type-green';
    case '无我':
      return 'type-purple';
    default:
      return 'type-normal';
  }
});

const 提示 = computed(
  () => `${props.coin.类型} 硬币 #${props.coin.id} · ${props.coin.正面 ? '正面' : '反面'}${已碎.value ? ' · 破裂(威力1)' : ''}`,
);
</script>

<style scoped>
.coin-slot {
  position: relative;
  width: var(--coin-size);
  height: var(--coin-size);
  flex: 0 0 auto;
  perspective: 320px;
}

.coin {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform: rotateY(0deg);
  transition:
    transform 0.42s cubic-bezier(0.4, 1.4, 0.5, 1),
    filter 0.25s ease,
    opacity 0.25s ease;
}

.coin.flipped {
  transform: rotateY(180deg);
}

.coin-face {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--coin-color);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}

.coin-power {
  font-size: calc(var(--coin-size) * 0.42);
  font-weight: 800;
  line-height: 1;
  z-index: 1;
}

.coin-glyph {
  position: absolute;
  font-size: calc(var(--coin-size) * 0.5);
  opacity: 0.18;
}

.front {
  background: radial-gradient(circle at 34% 28%, rgba(255, 255, 255, 0.9), var(--coin-color) 74%);
  color: #161016;
  box-shadow:
    inset 0 -4px 7px rgba(0, 0, 0, 0.45),
    0 0 6px rgba(0, 0, 0, 0.5);
}

.back {
  transform: rotateY(180deg);
  background: linear-gradient(160deg, #2a222a, #171217);
  color: var(--coin-color);
  border-color: rgba(0, 0, 0, 0.55);
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.7);
}

.coin.glow {
  filter: brightness(1.2);
}

.coin.glow .front {
  box-shadow:
    inset 0 -4px 7px rgba(0, 0, 0, 0.4),
    0 0 16px 4px var(--coin-color),
    0 0 6px rgba(255, 255, 255, 0.6);
}

.coin.dim {
  filter: grayscale(0.8) brightness(0.65);
  opacity: 0.6;
}

.coin.destroyed {
  animation: coin-shatter 0.5s ease-out forwards;
}

@keyframes coin-shatter {
  0% {
    transform: rotateY(0deg) scale(1);
    filter: brightness(2.2);
  }
  45% {
    transform: rotateY(140deg) scale(1.12);
    filter: brightness(2.6);
  }
  100% {
    transform: rotateY(220deg) scale(0.35) translateY(4px);
    filter: brightness(0.2);
    opacity: 0;
  }
}

.shards {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.shard {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(var(--coin-size) * 0.16);
  height: calc(var(--coin-size) * 0.16);
  margin: calc(var(--coin-size) * -0.08) 0 0 calc(var(--coin-size) * -0.08);
  background: var(--coin-color);
  border-radius: 2px;
  opacity: 0;
  animation: shard-fly 0.6s ease-out forwards;
}

@keyframes shard-fly {
  0% {
    opacity: 1;
    transform: rotate(calc(var(--i) * 51deg)) translateX(calc(var(--coin-size) * 0.05)) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotate(calc(var(--i) * 51deg)) translateX(calc(var(--coin-size) * 0.72)) scale(0.25);
  }
}

.crack {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  pointer-events: none;
}

.crack::before,
.crack::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 8%;
  width: 2px;
  height: 84%;
  background: rgba(10, 8, 10, 0.75);
  transform-origin: top center;
}

.crack::before {
  transform: translateX(-50%) rotate(17deg);
}

.crack::after {
  transform: translateX(-50%) rotate(-23deg);
}
</style>
