import { ref } from 'vue';

export type 音效名 = '硬币翻转' | '拼点碰撞' | '硬币碎裂' | '命中' | '暴击' | '状态附加' | '胜利' | '失败' | '升级';

/** 静音开关, 头部按钮绑定 */
export const 静音 = ref(false);

export function 切换静音(): void {
  静音.value = !静音.value;
}

export function 设置静音(值: boolean): void {
  静音.value = 值;
}

/** 真实音频 URL 表: 一旦注册, 优先播放音频文件而非合成音效 */
const 音频源表: Partial<Record<音效名, string>> = {};

/** 预留接口: 注册真实音频 URL 以替换某个合成音效 */
export function 注册音效(name: 音效名, url: string): void {
  音频源表[name] = url;
}

export function 清除音效源(name?: 音效名): void {
  if (name) {
    delete 音频源表[name];
    return;
  }
  for (const key of Object.keys(音频源表)) delete 音频源表[key as 音效名];
}

let 上下文: AudioContext | null = null;
let 主增益: GainNode | null = null;

function 获取上下文(): AudioContext | null {
  if (静音.value) return null;
  if (上下文) {
    if (上下文.state === 'suspended') void 上下文.resume();
    return 上下文;
  }
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    上下文 = new Ctor();
    主增益 = 上下文.createGain();
    主增益.gain.value = 0.75;
    主增益.connect(上下文.destination);
  } catch (错误) {
    console.warn('[sfx] 无法创建音频上下文', 错误);
    return null;
  }
  if (上下文.state === 'suspended') void 上下文.resume();
  return 上下文;
}

/** 在用户首次交互时调用以解锁音频 (浏览器自动播放策略) */
export function 初始化音频(): void {
  获取上下文();
}

interface 音调选项 {
  type?: OscillatorType;
  start?: number;
  duration?: number;
  peak?: number;
  endFreq?: number;
}

function 音调(freq: number, opts: 音调选项 = {}): void {
  const ctx = 获取上下文();
  if (!ctx || !主增益) return;
  const { type = 'sine', start = 0, duration = 0.15, peak = 0.2, endFreq } = opts;
  const t = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(1, freq), t);
  if (endFreq !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak), t + Math.min(0.02, duration * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(主增益);
  osc.start(t);
  osc.stop(t + duration + 0.03);
}

interface 噪声选项 {
  start?: number;
  duration?: number;
  peak?: number;
  type?: BiquadFilterType;
  freq?: number;
  q?: number;
}

function 噪声(opts: 噪声选项 = {}): void {
  const ctx = 获取上下文();
  if (!ctx || !主增益) return;
  const { start = 0, duration = 0.15, peak = 0.2, type = 'highpass', freq = 1200, q = 1 } = opts;
  const t = ctx.currentTime + start;
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(freq, t);
  filter.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(filter);
  filter.connect(g);
  g.connect(主增益);
  src.start(t);
  src.stop(t + duration + 0.03);
}

function 播放文件(url: string): void {
  try {
    const audio = new Audio(url);
    audio.volume = 0.7;
    void audio.play();
  } catch (错误) {
    console.warn('[sfx] 播放音频文件失败', 错误);
  }
}

/** 合成各种音效 */
function 合成(name: 音效名): void {
  switch (name) {
    case '硬币翻转':
      音调(900, { type: 'triangle', duration: 0.07, peak: 0.1, endFreq: 1800 });
      噪声({ duration: 0.045, peak: 0.06, type: 'highpass', freq: 3200 });
      break;
    case '拼点碰撞':
      音调(230, { type: 'square', duration: 0.18, peak: 0.16, endFreq: 90 });
      音调(340, { type: 'sawtooth', duration: 0.16, peak: 0.1, endFreq: 120 });
      噪声({ duration: 0.12, peak: 0.2, type: 'bandpass', freq: 2200, q: 0.8 });
      break;
    case '硬币碎裂':
      噪声({ duration: 0.22, peak: 0.22, type: 'highpass', freq: 2600 });
      for (let i = 0; i < 4; i++) {
        音调(1800 + Math.random() * 1600, { start: i * 0.03, duration: 0.05, peak: 0.07 });
      }
      break;
    case '命中':
      音调(160, { type: 'sine', duration: 0.2, peak: 0.2, endFreq: 60 });
      噪声({ duration: 0.1, peak: 0.14, type: 'lowpass', freq: 900 });
      break;
    case '暴击':
      音调(180, { type: 'sine', duration: 0.22, peak: 0.22, endFreq: 70 });
      音调(880, { type: 'square', duration: 0.26, peak: 0.16, endFreq: 1760 });
      音调(1320, { type: 'triangle', start: 0.04, duration: 0.28, peak: 0.12, endFreq: 1980 });
      噪声({ duration: 0.14, peak: 0.16, type: 'lowpass', freq: 1400 });
      break;
    case '状态附加':
      音调(560, { type: 'triangle', duration: 0.12, peak: 0.13, endFreq: 300 });
      音调(400, { type: 'triangle', start: 0.1, duration: 0.16, peak: 0.12, endFreq: 220 });
      break;
    case '胜利':
      [523, 659, 784, 1047].forEach((f, i) => 音调(f, { type: 'triangle', start: i * 0.12, duration: 0.5, peak: 0.16 }));
      break;
    case '失败':
      [523, 440, 349, 262].forEach((f, i) => 音调(f, { type: 'sawtooth', start: i * 0.14, duration: 0.5, peak: 0.12 }));
      break;
    case '升级':
      [659, 784, 988, 1319].forEach((f, i) => 音调(f, { type: 'triangle', start: i * 0.08, duration: 0.35, peak: 0.15 }));
      break;
  }
}

/** 播放音效: 优先真实音频 URL, 否则使用 Web Audio 合成 */
export function 播放音效(name: 音效名): void {
  if (静音.value) return;
  const url = 音频源表[name];
  if (url) {
    播放文件(url);
    return;
  }
  合成(name);
}
