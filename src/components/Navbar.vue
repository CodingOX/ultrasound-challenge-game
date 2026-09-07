<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Volume2, VolumeX, FastForward, ShieldCheck, HeartPulse } from 'lucide-vue-next';

import { sound } from '../utils/audio';
import type { PageStep } from '../types';

const props = defineProps<{
  currentStep: PageStep;
  remainingAttempts: number;
}>();

const emit = defineEmits<{
  (e: 'skip'): void;
  (e: 'navigate', step: PageStep): void;
}>();

const isMuted = ref(false);

onMounted(() => {
  isMuted.value = sound.getMuted();
});

function toggleSound() {
  isMuted.value = sound.toggleMute();
  if (!isMuted.value) {
    sound.playClick();
  }
}

function handleSkip() {
  sound.playClick();
  emit('skip');
}
</script>

<template>
  <header class="w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- 左侧：品牌与主办单位 -->
      <div 
        class="flex items-center space-x-3 cursor-pointer group"
        @click="emit('navigate', 'welcome')"
      >
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
          <div class="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <HeartPulse class="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              产前超声闯关大挑战
            </span>
            <span class="hidden sm:inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              PRO 竞技版
            </span>
          </div>
          <div class="text-[11px] text-slate-400 flex items-center space-x-2">
            <span>主办：亞太出生缺陷防治研究院</span>
            <span class="text-slate-600">|</span>
            <span>协办：产超智培</span>
          </div>
        </div>
      </div>

      <!-- 右侧：控制与状态 -->
      <div class="flex items-center space-x-2 sm:space-x-4">
        <!-- 挑战机会提示 -->
        <div 
          v-if="currentStep !== 'welcome'"
          class="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-xs text-indigo-200"
        >
          <ShieldCheck class="w-4 h-4 text-indigo-400" />
          <span>挑战机会:</span>
          <span class="font-bold text-amber-400">{{ remainingAttempts }}/3 次</span>
        </div>

        <!-- 快速跳过按钮 (在非 quiz/result 页面显示) -->
        <button
          v-if="currentStep !== 'quiz' && currentStep !== 'result'"
          @click="handleSkip"
          class="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 hover:border-cyan-400 text-xs text-cyan-300 transition-all active:scale-95 shadow-sm"
          title="跳过当前步骤"
        >
          <FastForward class="w-3.5 h-3.5" />
          <span>跳过步骤</span>
        </button>

        <!-- 音效开关 -->
        <button
          @click="toggleSound"
          class="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors"
          :title="isMuted ? '点击开启音效' : '点击静音'"
        >
          <Volume2 v-if="!isMuted" class="w-4 h-4 text-cyan-400" />
          <VolumeX v-else class="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  </header>
</template>
