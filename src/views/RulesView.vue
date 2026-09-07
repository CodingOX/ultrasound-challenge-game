<script setup lang="ts">
import { Clock, Video, Zap, Trophy, Play, ArrowRight } from 'lucide-vue-next';
import { sound } from '../utils/audio';
import type { CategoryId, DifficultyLevel } from '../types';

const props = defineProps<{
  categoryId: CategoryId;
  level: DifficultyLevel;
  remainingAttempts: number;
}>();

const emit = defineEmits<{
  (e: 'startQuiz'): void;
}>();

function handleStart() {
  sound.playVictory();
  emit('startQuiz');
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-8">
    <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-cyan-500/20 glass-panel shadow-2xl space-y-6 text-center">
      <!-- 机会状态 -->
      <div class="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-bold">
        <Trophy class="w-4 h-4 text-amber-400" />
        <span>当前剩余挑战机会：<span class="text-amber-400 font-mono font-black text-sm">{{ remainingAttempts }}/3 次</span>（取最高分）</span>
      </div>

      <h2 class="text-2xl sm:text-3xl font-black text-slate-100">闯关竞技要领</h2>

      <!-- 4 个极简规则大卡片 (一目了然) -->
      <div class="grid grid-cols-2 gap-3 text-left">
        <div class="p-4 rounded-2xl bg-slate-950/80 border border-cyan-500/30 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Clock class="w-5 h-5 animate-spin" style="animation-duration: 6s" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-100">15 秒 / 题</div>
            <div class="text-[11px] text-slate-400">超时自动跳过</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Video class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-100">视频仅播 1 次</div>
            <div class="text-[11px] text-slate-400">扫查结束锁定</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-950/80 border border-purple-500/30 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Zap class="w-5 h-5" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-100">回车秒提交</div>
            <div class="text-[11px] text-slate-400">支持战术放弃</div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Trophy class="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div class="text-sm font-bold text-slate-100">冲击 Top 100</div>
            <div class="text-[11px] text-slate-400">赛后颁发证书</div>
          </div>
        </div>
      </div>

      <!-- 开始主按钮 -->
      <div class="pt-2">
        <button
          @click="handleStart"
          class="w-full sm:w-auto px-12 py-4 rounded-2xl bg-gradient-to-r from-red-500 via-amber-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2.5 mx-auto glow-gold"
        >
          <Play class="w-5 h-5 fill-current" />
          <span>立即开战！</span>
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</template>
