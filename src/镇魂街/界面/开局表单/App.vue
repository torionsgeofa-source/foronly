<template>
  <div class="form">
    <div class="form-head">
      <i class="fa fa-scroll" /> 镇魂街 · 开局
    </div>

    <section class="section">
      <h3 class="label">身份</h3>
      <div class="seg">
        <button
          :class="['seg-btn', { active: 身份来源 === '原创角色' }]"
          type="button"
          @click="身份来源 = '原创角色'"
        >
          原创角色
        </button>
        <button
          :class="['seg-btn', { active: 身份来源 === '原著角色' }]"
          type="button"
          @click="身份来源 = '原著角色'"
        >
          原著角色
        </button>
      </div>
    </section>

    <section class="section">
      <h3 class="label">角色名</h3>
      <input v-model="角色名" class="input" type="text" placeholder="填写你扮演的角色名（原著角色填原名）" />
    </section>

    <section class="section">
      <h3 class="label">切入时间节点</h3>
      <select v-model="时间节点" class="input" @change="同步区域">
        <option v-for="p in 篇章列表" :key="p" :value="p">{{ p }}</option>
      </select>
    </section>

    <section class="section">
      <h3 class="label">当前区域</h3>
      <select v-model="当前区域" class="input">
        <option v-for="r in 区域列表" :key="r" :value="r">{{ r }}</option>
      </select>
    </section>

    <template v-if="身份来源 === '原创角色'">
      <section class="section">
        <h3 class="label">能力设定</h3>
        <label class="check">
          <input v-model="是否武神躯" type="checkbox" />
          <span>武神躯（可同时驾驭多位守护灵）</span>
        </label>
      </section>

      <section class="section">
        <h3 class="label">守护灵</h3>
        <div v-for="(g, i) in 守护灵列表" :key="i" class="guardian-row">
          <input v-model="g.名字" class="input" type="text" placeholder="守护灵名" />
          <input v-model="g.来历" class="input" type="text" placeholder="来历" />
          <input v-model="g.能力" class="input" type="text" placeholder="能力" />
          <button class="del" type="button" @click="守护灵列表.splice(i, 1)"><i class="fa fa-times" /></button>
        </div>
        <button class="add" type="button" @click="添加守护灵"><i class="fa fa-plus" /> 添加守护灵</button>
      </section>

      <section class="section">
        <h3 class="label">特殊能力</h3>
        <div v-for="(a, i) in 特殊能力" :key="i" class="guardian-row">
          <input v-model="a.名字" class="input" type="text" placeholder="能力名（招式/技巧/功法）" />
          <input v-model="a.说明" class="input" type="text" placeholder="说明" />
          <button class="del" type="button" @click="特殊能力.splice(i, 1)"><i class="fa fa-times" /></button>
        </div>
        <button class="add" type="button" @click="添加能力"><i class="fa fa-plus" /> 添加能力</button>
      </section>
    </template>

    <button class="submit" type="button" @click="提交"><i class="fa fa-play" /> 进入镇魂街</button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useDataStore } from '../store';
import { createChatMessages } from '@types/function/chat_message';
import { triggerSlash } from '@types/function/slash';

const store = useDataStore();

const 身份来源 = ref<'原创角色' | '原著角色'>('原创角色');
const 角色名 = ref('');
const 时间节点 = ref('罗刹街篇');
const 当前区域 = ref('罗刹街');
const 是否武神躯 = ref(false);
const 守护灵列表 = reactive<{ 名字: string; 来历: string; 能力: string }[]>([{ 名字: '', 来历: '', 能力: '' }]);
const 特殊能力 = reactive<{ 名字: string; 说明: string }[]>([{ 名字: '', 说明: '' }]);

const 篇章列表 = ['罗刹街篇', '北落师门篇', '风花雪月篇', '群英大战篇', '王国纷争篇', '风雷天武篇'];
const 区域列表 = ['罗刹街', '水云街', '悬龙街', '菩提街', '天武街', '芦花古楼', '灵域', '死魂岛'];

const 篇章区域映射: Record<string, string> = {
  罗刹街篇: '罗刹街',
  北落师门篇: '菩提街',
  风花雪月篇: '芦花古楼',
  群英大战篇: '灵域',
  王国纷争篇: '灵域',
  风雷天武篇: '天武街',
};

function 同步区域() {
  当前区域.value = 篇章区域映射[时间节点.value] || '罗刹街';
}

function 添加守护灵() {
  守护灵列表.push({ 名字: '', 来历: '', 能力: '' });
}

function 添加能力() {
  特殊能力.push({ 名字: '', 说明: '' });
}

function 提交() {
  const 名 = 角色名.value.trim() || '无名寄灵人';
  store.data.玩家.身份来源 = 身份来源.value;
  store.data.玩家.角色名 = 名;
  store.data.世界.当前时间节点 = 时间节点.value;
  store.data.世界.当前区域 = 当前区域.value;
  store.data.世界.详细时间 = '待初始化';
  store.data.世界.详细地点 = 当前区域.value;
  store.data.玩家.当前状态 = '刚进入镇魂街';

  if (身份来源.value === '原创角色') {
    store.data.玩家.是否武神躯 = 是否武神躯.value;
    const 守护灵: Record<string, { 来历: string; 能力: string }> = {};
    for (const g of 守护灵列表) {
      if (g.名字.trim()) 守护灵[g.名字.trim()] = { 来历: g.来历.trim() || '待初始化', 能力: g.能力.trim() || '待初始化' };
    }
    store.data.玩家.守护灵列表 = 守护灵;
    const 能力: Record<string, string> = {};
    for (const a of 特殊能力) {
      if (a.名字.trim()) 能力[a.名字.trim()] = a.说明.trim() || '待初始化';
    }
    store.data.玩家.特殊能力 = 能力;
  } else {
    store.data.玩家.是否武神躯 = false;
    store.data.玩家.守护灵列表 = {};
    store.data.玩家.特殊能力 = {};
  }

  const 守护灵摘要 = Object.keys(store.data.玩家.守护灵列表).join('、') || '无';
  const 能力摘要 = Object.keys(store.data.玩家.特殊能力).join('、') || '无';
  const 身份描述 = [
    `我选择以${身份来源.value}的身份进入镇魂街。`,
    `角色名：${名}`,
    `切入时间节点：${时间节点.value}，当前位于${当前区域.value}。`,
    身份来源.value === '原创角色' ? `武神躯：${是否武神躯.value ? '是' : '否'}；守护灵：${守护灵摘要}；特殊能力：${能力摘要}。` : '',
  ]
    .filter(Boolean)
    .join('\n');

  createChatMessages([{ role: 'user', name: 名, message: 身份描述 }]).then(() => {
    triggerSlash('/trigger');
  });
}
</script>

<style lang="scss" scoped>
.form {
  width: 100%;
  max-width: 560px;
  margin: 0 auto;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  color: var(--c-text);
  font-size: 13px;
  line-height: 1.4;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-head {
  font-size: 15px;
  font-weight: bold;
  color: var(--c-primary);
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 10px;
}

.form-head i {
  margin-right: 8px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: var(--c-accent);
}

.seg {
  display: flex;
  gap: 8px;
}

.seg-btn {
  flex: 1;
  padding: 8px;
  background: var(--c-surface-raised);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  color: var(--c-text-muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
}

.seg-btn.active {
  border-color: var(--c-primary);
  color: var(--c-primary);
}

.input {
  width: 100%;
  padding: 8px;
  background: var(--c-surface-raised);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  color: var(--c-text);
  font-family: inherit;
  font-size: 13px;
}

.input:focus {
  outline: none;
  border-color: var(--c-accent);
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.check input {
  accent-color: var(--c-primary);
}

.guardian-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.guardian-row .input {
  flex: 1;
}

.del {
  padding: 6px 8px;
  background: var(--c-surface-raised);
  border: 1px solid var(--c-border);
  border-radius: 6px;
  color: var(--c-primary);
  cursor: pointer;
}

.add {
  padding: 6px;
  background: transparent;
  border: 1px dashed var(--c-border);
  border-radius: 6px;
  color: var(--c-text-muted);
  cursor: pointer;
  font-family: inherit;
  font-size: 12px;
}

.submit {
  padding: 12px;
  background: var(--c-primary);
  border: none;
  border-radius: 6px;
  color: #fff;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.submit i {
  margin-right: 6px;
}
</style>
