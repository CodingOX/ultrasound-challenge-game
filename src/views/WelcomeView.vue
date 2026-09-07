<script setup lang="ts">
import { Play, Shield, HeartPulse, Zap, Award, Flame, ArrowRight } from 'lucide-vue-next';
import { sound } from '../utils/audio';

const emit = defineEmits<{
  (e: 'start'): void;
  (e: 'skip'): void;
}>();

function handleStart() {
  sound.playClick();
  emit('start');
}

function handleSkip() {
  sound.playClick();
  emit('skip');
}
</script>

<template>
  <div class="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden bg-cyber-grid">
    <!-- 放射状超声探头背景流光 -->
    <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-b from-cyan-500/20 via-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

    <div class="relative z-10 max-w-2xl w-full text-center flex flex-col items-center">
      <!-- 权威主办标签 -->
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 text-cyan-300 text-xs font-semibold mb-6 shadow-xl shadow-cyan-950/60 glow-cyan">
        <Shield class="w-4 h-4 text-cyan-400" />
        <span>亞太出生缺陷防治研究院 × 产超智培 联合呈献</span>
      </div>

      <!-- 超声探头与扇形声束微缩图腾 -->
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-b from-cyan-500 to-blue-600 p-0.5 shadow-xl shadow-cyan-500/30 mb-4 glow-cyan">
        <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400 relative overflow-hidden">
          <svg class="w-9 h-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2 L6 9 L18 9 Z" fill="currentColor" opacity="0.3" />
            <path d="M6 9 C6 15, 18 15, 18 9" />
            <path d="M3 18 C3 21, 21 21, 21 18" stroke-dasharray="2 2" />
            <circle cx="12" cy="5" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>

      <!-- 核心大标题 -->
      <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white mb-3">
        <span class="bg-gradient-to-r from-cyan-300 via-sky-100 to-indigo-200 bg-clip-text text-transparent drop-shadow-sm">
          产前超声闯关大挑战
        </span>
      </h1>

      <!-- 极简标语 -->
      <p class="text-base sm:text-lg text-slate-200 mb-8 font-medium">
        精于切面 · 极速诊断 · 冲击全国天梯榜 TOP 100
      </p>


      <!-- 3 个极简特性标签 (告别大段文字) -->
      <div class="flex flex-wrap items-center justify-center gap-3 mb-10">
        <div class="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-bold shadow-sm">
          <Zap class="w-4 h-4 text-cyan-400" />
          <span>15s 单题秒答</span>
        </div>
        <div class="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm">
          <Award class="w-4 h-4 text-amber-400" />
          <span>Top 100 天梯榜</span>
        </div>
        <div class="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-900/80 border border-purple-500/30 text-purple-300 text-xs font-bold shadow-sm">
          <Flame class="w-4 h-4 text-purple-400" />
          <span>官方防伪证书</span>
        </div>
      </div>

      <!-- 核心主操作按钮 -->
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          @click="handleStart"
          class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-base shadow-xl shadow-cyan-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2.5 glow-cyan"
        >
          <Play class="w-5 h-5 fill-current" />
          <span>开始挑战</span>
          <ArrowRight class="w-4 h-4" />
        </button>

        <button
          @click="handleSkip"
          class="w-full sm:w-auto px-6 py-4 rounded-2xl bg-slate-900/70 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs transition-all"
        >
          跳过 · 直接选关
        </button>
      </div>

      <!-- 底部主办机构精简展示 -->
      <div class="mt-14 pt-6 border-t border-slate-800/80 flex items-center justify-center space-x-4 text-xs text-slate-500">
        <div class="flex items-center space-x-1.5">
          <HeartPulse class="w-3.5 h-3.5 text-cyan-400" />
          <span>主办：亞太出生缺陷防治研究院</span>
        </div>
        <span>·</span>
        <span>协办：产超智培</span>
      </div>
    </div>
  </div>
</template>
