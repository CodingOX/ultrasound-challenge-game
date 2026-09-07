<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import confetti from 'canvas-confetti';
import { 
  Trophy, Award, RotateCcw, Sparkles, 
  Flame, ChevronRight, Shield, Swords
} from 'lucide-vue-next';
import { sound } from '../utils/audio';
import { getFunTitles } from '../utils/scoring';
import { getLeaderboard, submitChallengeRecord, type SubmitResultInfo } from '../data/leaderboardData';
import { CATEGORIES } from '../data/questionBank';
import CertificateCanvas from '../components/CertificateCanvas.vue';
import type { AnswerRecord, CategoryId, DifficultyLevel, LeaderboardEntry, UserProfile } from '../types';

const props = defineProps<{
  userProfile: UserProfile;
  categoryId: CategoryId;
  level: DifficultyLevel;
  records: AnswerRecord[];
  totalScore: number;
  totalTimeSpentSec: number;
  remainingAttempts: number;
}>();

const emit = defineEmits<{
  (e: 'restart'): void;
  (e: 'changeCategory'): void;
}>();

const forceShowCert = ref(false);
const activeTab = ref<'cert' | 'leaderboard'>('cert');

const leaderboardCategory = ref<CategoryId>(props.categoryId);
const leaderboardLevel = ref<DifficultyLevel>(props.level);
const submitResult = ref<SubmitResultInfo | null>(null);

const isPassed = computed(() => props.totalScore >= 60);
const funTitles = computed(() => getFunTitles(props.totalScore, props.totalTimeSpentSec / 10));


const currentLeaderboard = computed<LeaderboardEntry[]>(() => {
  return getLeaderboard(leaderboardCategory.value, leaderboardLevel.value);
});

function fireConfetti() {
  if (props.totalScore >= 60) {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  }
}

function handleTabChange(tab: 'cert' | 'leaderboard') {
  sound.playClick();
  activeTab.value = tab;
}

function switchLeaderboardCat(catId: CategoryId) {
  sound.playClick();
  leaderboardCategory.value = catId;
}

function switchLeaderboardLevel(lvl: DifficultyLevel) {
  sound.playClick();
  leaderboardLevel.value = lvl;
}

onMounted(() => {
  submitResult.value = submitChallengeRecord(props.categoryId, props.level, {
    userName: props.userProfile.name,
    hospital: props.userProfile.hospital,
    score: props.totalScore,
    timeSpentSec: props.totalTimeSpentSec,
  });

  fireConfetti();
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- 头部成绩总览卡片 -->
    <div class="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 glass-panel shadow-2xl relative overflow-hidden mb-6">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
        <!-- 选手与华丽评级勋章 -->
        <div class="flex items-center space-x-4">
          <!-- 1. 卓越/优秀 (≥85) 黄金圣杯勋章 -->
          <div
            v-if="totalScore >= 85"
            class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-xl shadow-amber-500/40 glow-gold shrink-0"
          >
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-amber-400">
              <Trophy class="w-8 h-8 animate-bounce" />
              <span class="text-[11px] font-black tracking-wider uppercase mt-1">卓越优秀</span>
            </div>
          </div>

          <!-- 2. 良好 (75-84) 白银利剑勋章 -->
          <div
            v-else-if="totalScore >= 75"
            class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-300 to-indigo-400 p-0.5 shadow-xl shadow-cyan-500/30 glow-cyan shrink-0"
          >
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-cyan-300">
              <Award class="w-8 h-8" />
              <span class="text-[11px] font-black tracking-wider uppercase mt-1">良好佳绩</span>
            </div>
          </div>

          <!-- 3. 合格 (60-74) 翡翠勋章 -->
          <div
            v-else-if="totalScore >= 60"
            class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-300 to-emerald-400 p-0.5 shadow-xl shadow-emerald-500/30 shrink-0"
          >
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-emerald-400">
              <Shield class="w-8 h-8" />
              <span class="text-[11px] font-black tracking-wider uppercase mt-1">合格达标</span>
            </div>
          </div>

          <!-- 4. 未达标 (<60) 燃烧重战竞技勋章 (大幅美化升级！) -->
          <div
            v-else
            class="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 p-0.5 shadow-xl shadow-red-500/30 glow-red shrink-0"
          >
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center text-orange-400">
              <Swords class="w-8 h-8 animate-pulse text-orange-400" />
              <span class="text-[11px] font-black tracking-wider uppercase mt-1 text-red-400">再接再厉</span>
            </div>
          </div>

          <div>
            <div class="flex items-center space-x-2">
              <h2 class="text-xl sm:text-2xl font-black text-slate-100">{{ userProfile.name }}</h2>
              <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold">
                {{ level }}级挑战
              </span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5 truncate max-w-[200px]">{{ userProfile.hospital }}</p>

            <!-- 趣味称号 -->
            <div class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="t in funTitles"
                :key="t"
                class="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center space-x-1"
              >
                <Sparkles class="w-3 h-3 text-amber-400" />
                <span>{{ t }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- 分数与耗时仪表 -->
        <div class="flex items-center space-x-3 w-full sm:w-auto justify-center">
          <div class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <span class="text-[10px] text-slate-400 block">得分</span>
            <span class="text-2xl font-black text-amber-400 font-mono">{{ totalScore }}</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <span class="text-[10px] text-slate-400 block">用时</span>
            <span class="text-2xl font-black text-cyan-400 font-mono">{{ totalTimeSpentSec }}s</span>
          </div>

          <div class="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[85px]">
            <span class="text-[10px] text-slate-400 block">排位</span>
            <span v-if="submitResult?.isTop100" class="text-xl font-black text-emerald-400 font-mono">
              Top {{ submitResult.rank }}
            </span>
            <span v-else class="text-base font-black text-slate-400 font-mono">
              #{{ submitResult?.estimatedRank }}
            </span>
          </div>
        </div>
      </div>

      <!-- 友好激励横幅 -->
      <div 
        v-if="submitResult"
        :class="[
          'mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2',
          submitResult.isTop100
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
        ]"
      >
        <div class="flex items-center space-x-2">
          <Flame class="w-4 h-4 text-amber-400 shrink-0" />
          <span>{{ submitResult.encouragementText }}</span>
        </div>

        <button
          v-if="remainingAttempts > 0"
          @click="emit('restart')"
          class="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0"
        >
          再战一局
        </button>
      </div>
    </div>

    <!-- 选项卡：荣誉证书 vs TOP 100 天梯榜 -->
    <div class="flex items-center justify-center space-x-2 mb-6">
      <button
        @click="handleTabChange('cert')"
        :class="[
          'px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-1.5 border',
          activeTab === 'cert'
            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/30'
            : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
        ]"
      >
        <Award class="w-4 h-4" />
        <span>官方荣誉证书</span>
      </button>

      <button
        @click="handleTabChange('leaderboard')"
        :class="[
          'px-5 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center space-x-1.5 border',
          activeTab === 'leaderboard'
            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/30'
            : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
        ]"
      >
        <Trophy class="w-4 h-4" />
        <span>全国 TOP 100 天梯榜</span>
      </button>
    </div>

    <!-- 1. 荣誉证书展示 -->
    <div v-if="activeTab === 'cert'" class="flex flex-col items-center">
      <div v-if="isPassed || forceShowCert" class="w-full flex flex-col items-center">
        <CertificateCanvas
          :userName="userProfile.name"
          :hospital="userProfile.hospital"
          :score="forceShowCert && totalScore < 60 ? 100 : totalScore"
          :level="level"
          :categoryId="categoryId"
          dateStr="2026年09月07日"
        />
      </div>

      <!-- 未达标提示卡片 (美化升级) -->
      <div v-else class="w-full max-w-md p-6 rounded-3xl bg-slate-900/90 border border-orange-500/40 text-center space-y-4 shadow-xl">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 via-orange-500 to-amber-500 p-0.5 mx-auto shadow-lg glow-red">
          <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-orange-400">
            <Swords class="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-slate-100">本轮得分 {{ totalScore }} 分（达标需 ≥60分）</h3>
          <p class="text-xs text-slate-400 mt-1">
            差一点即可解锁官方认证证书！您还剩 <span class="text-amber-400 font-bold font-mono">{{ remainingAttempts }}</span> 次机会。
          </p>
        </div>

        <div class="flex flex-col gap-2">
          <button
            @click="emit('restart')"
            class="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/30 active:scale-95 glow-gold"
          >
            ⚔️ 立即重新挑战
          </button>

          <button
            @click="forceShowCert = true"
            class="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-medium text-xs transition-all"
          >
            👑 [演示预览] 直接查看 100分 卓越荣誉证书效果 »
          </button>
        </div>
      </div>
    </div>


    <!-- 2. 全国 TOP 100 天梯榜 -->
    <div v-else class="p-5 rounded-3xl bg-slate-900/90 border border-cyan-500/20 glass-panel shadow-2xl">
      <!-- 过滤器 -->
      <div class="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div class="flex items-center space-x-1.5">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.id"
            @click="switchLeaderboardCat(cat.id)"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
              leaderboardCategory === cat.id
                ? 'bg-cyan-950 border border-cyan-400 text-cyan-300'
                : 'bg-slate-800/60 text-slate-400'
            ]"
          >
            {{ cat.title }}
          </button>
        </div>

        <div class="flex items-center space-x-1">
          <button
            v-for="lvl in [1, 2, 3, 4, 5]"
            :key="lvl"
            @click="switchLeaderboardLevel(lvl as DifficultyLevel)"
            :class="[
              'px-2 py-0.5 rounded text-xs font-mono font-bold transition-all',
              leaderboardLevel === lvl
                ? 'bg-amber-950 border border-amber-400 text-amber-300'
                : 'bg-slate-800/60 text-slate-500'
            ]"
          >
            L{{ lvl }}
          </button>
        </div>
      </div>

      <!-- 榜单表格 -->
      <div class="overflow-x-auto max-h-[400px]">
        <table class="w-full text-left text-xs">
          <thead class="sticky top-0 bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th class="py-2.5 px-3">排名</th>
              <th class="py-2.5 px-3">选手</th>
              <th class="py-2.5 px-3">医院</th>
              <th class="py-2.5 px-3 text-center">得分</th>
              <th class="py-2.5 px-3 text-right">用时</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60 text-slate-300">
            <tr
              v-for="item in currentLeaderboard"
              :key="item.id"
              :class="[
                'hover:bg-slate-800/40',
                item.userName.includes(userProfile.name) ? 'bg-cyan-950/40 text-cyan-300 font-bold' : ''
              ]"
            >
              <td class="py-2.5 px-3 font-mono font-black">
                <span v-if="item.rank === 1" class="text-amber-400">🥇 1</span>
                <span v-else-if="item.rank === 2" class="text-slate-300">🥈 2</span>
                <span v-else-if="item.rank === 3" class="text-amber-600">🥉 3</span>
                <span v-else class="text-slate-500">{{ item.rank }}</span>
              </td>
              <td class="py-2.5 px-3 font-medium">{{ item.userName }}</td>
              <td class="py-2.5 px-3 text-slate-400 truncate max-w-[160px]">{{ item.hospital }}</td>
              <td class="py-2.5 px-3 text-center font-mono font-bold text-amber-400">{{ item.score }}</td>
              <td class="py-2.5 px-3 text-right font-mono text-cyan-400">{{ item.timeSpentSec }}s</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 底部按钮 -->
    <div class="mt-6 flex items-center justify-center gap-3">
      <button
        @click="emit('restart')"
        class="px-5 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center space-x-1.5 active:scale-95"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>再战一局 (剩{{ remainingAttempts }}次)</span>
      </button>

      <button
        @click="emit('changeCategory')"
        class="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center space-x-1.5 active:scale-95 glow-cyan"
      >
        <span>换个赛道</span>
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
