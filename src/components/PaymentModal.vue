<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { X, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-vue-next';

import { sound } from '../utils/audio';
import type { DifficultyConfig } from '../types';

const props = defineProps<{
  config: DifficultyConfig;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const payMethod = ref<'wechat' | 'alipay'>('wechat');
const isSuccess = ref(false);
const autoSuccessTimer = ref<number | null>(null);

function switchPayMethod(method: 'wechat' | 'alipay') {
  sound.playClick();
  payMethod.value = method;
}

function handlePaySuccess() {
  isSuccess.value = true;
  sound.playSubmit();
  setTimeout(() => {
    emit('success');
  }, 1000);
}

onMounted(() => {
  // 模拟 12 秒后未手动点击则自动模拟成功 (增加真实感)
  autoSuccessTimer.value = window.setTimeout(() => {
    // optional auto trigger or wait for click
  }, 12000);
});

onUnmounted(() => {
  if (autoSuccessTimer.value) {
    clearTimeout(autoSuccessTimer.value);
  }
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
    <div class="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-500/20 glow-gold overflow-hidden">
      <!-- 装饰背景光 -->
      <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>

      <!-- 关闭按钮 -->
      <button
        @click="emit('close')"
        class="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
      >
        <X class="w-5 h-5" />
      </button>

      <!-- 头部：关卡与价格 -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2">
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ config.name }} 专属解锁</span>
        </div>
        <h3 class="text-2xl font-black text-slate-100">{{ config.subName }} 考核挑战</h3>
        <p class="text-xs text-slate-400 mt-1">{{ config.description }}</p>

        <!-- 价格大字 -->
        <div class="mt-4 flex items-baseline justify-center space-x-1">
          <span class="text-amber-400 text-lg font-bold">¥</span>
          <span class="text-4xl font-extrabold text-amber-300 font-mono">{{ config.price || 39.9 }}</span>
          <span class="text-slate-500 text-xs line-through ml-2">¥99.00</span>
        </div>
      </div>

      <!-- 支付方式切换 -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <button
          @click="switchPayMethod('wechat')"
          :class="[
            'py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all',
            payMethod === 'wechat'
              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 shadow-sm shadow-emerald-500/30'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
          ]"
        >
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>微信支付</span>
        </button>
        <button
          @click="switchPayMethod('alipay')"
          :class="[
            'py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all',
            payMethod === 'alipay'
              ? 'bg-blue-950/60 border-blue-500 text-blue-300 shadow-sm shadow-blue-500/30'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
          ]"
        >
          <span class="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>支付宝支付</span>
        </button>
      </div>

      <!-- 二维码展示区 -->
      <div class="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 relative">
        <div v-if="!isSuccess" class="relative group cursor-pointer" @click="handlePaySuccess">
          <!-- 动态模拟二维码图形 -->
          <div class="w-44 h-44 bg-white p-3 rounded-xl shadow-lg flex flex-col items-center justify-center relative">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://antigravity.ultrasound.challenge/pay"
              alt="支付二维码"
              class="w-full h-full object-contain"
            />
            <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/60 transition-all rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span class="text-xs text-amber-300 font-bold px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/50 shadow-lg">
                👉 点击模拟扫码成功
              </span>
            </div>
          </div>

          <p class="text-center text-[11px] text-slate-400 mt-2 flex items-center justify-center space-x-1">
            <Zap class="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>请使用手机扫码完成支付 (支持点击一键模拟)</span>
          </p>
        </div>

        <!-- 支付成功动画状态 -->
        <div v-else class="h-44 flex flex-col items-center justify-center text-emerald-400 space-y-2">
          <CheckCircle2 class="w-14 h-14 animate-bounce" />
          <span class="text-base font-bold">支付成功！正在为您解锁关卡...</span>
        </div>
      </div>

      <!-- 底部安全与特权保障 -->
      <div class="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div class="flex items-center space-x-1 text-slate-400">
          <ShieldCheck class="w-3.5 h-3.5 text-cyan-400" />
          <span>亚研院官方认证通道</span>
        </div>
        <button
          v-if="!isSuccess"
          @click="handlePaySuccess"
          class="text-amber-400 hover:text-amber-300 font-semibold underline text-xs"
        >
          [研发调试] 模拟支付成功 »
        </button>
      </div>
    </div>
  </div>
</template>
