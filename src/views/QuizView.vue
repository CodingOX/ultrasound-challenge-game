<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Clock, Send, SkipForward, Flame, Video, Activity,
  Play, Pause, StepForward, Gauge, Zap
} from 'lucide-vue-next';

import { sound } from '../utils/audio';
import { evaluateAnswer } from '../utils/scoring';
import CameraModal from '../components/CameraModal.vue';
import VideoWatermark from '../components/VideoWatermark.vue';
import type { AnswerRecord, CategoryId, DifficultyLevel, Question, UserProfile } from '../types';

const props = defineProps<{
  questions: Question[];
  categoryId: CategoryId;
  level: DifficultyLevel;
  userProfile: UserProfile;
}>();

const emit = defineEmits<{
  (e: 'complete', results: { records: AnswerRecord[]; totalScore: number; totalTimeSpentSec: number }): void;
}>();

const currentIndex = ref(0);
const userAnswer = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// 核心状态：是否处于扫查观察阶段 (true = 视频扫查中不扣计时，false = 15s极速答题倒计时中)
const isScanningPhase = ref(true);

// 视频精细化播放控制
const playbackRate = ref<number>(1.0); // 1.0 或 0.5 慢放
const isPaused = ref(false);
const isVideoPlaying = ref(false);
const videoEl = ref<HTMLVideoElement | null>(null);

// 单题 15 秒倒计时 (精确到 0.1 秒)
const TIME_LIMIT = 15.0;
const timeLeft = ref(TIME_LIMIT);
let timer: number | null = null;
let questionStartTime = 0;

// 答题记录与连击
const answerRecords = ref<AnswerRecord[]>([]);
const comboCount = ref(0);

const currentQuestion = computed(() => props.questions[currentIndex.value] || null);
const progressPercent = computed(() => ((currentIndex.value + 1) / props.questions.length) * 100);

// 危险警报状态 (<= 5秒且在答题阶段)
const isTimeCritical = computed(() => !isScanningPhase.value && timeLeft.value <= 5.0);

/**
 * 切换 0.5X 慢放与 1.0X 正常速度
 */
function toggleSlowMotion() {
  sound.playClick();
  playbackRate.value = playbackRate.value === 1.0 ? 0.5 : 1.0;
  if (videoEl.value) {
    videoEl.value.playbackRate = playbackRate.value;
  }
}

/**
 * 暂停 / 继续播放
 */
function togglePlayPause() {
  sound.playClick();
  if (!videoEl.value) return;
  if (videoEl.value.paused) {
    videoEl.value.play();
    isPaused.value = false;
  } else {
    videoEl.value.pause();
    isPaused.value = true;
  }
}

/**
 * 单帧步进 (+0.15s)
 */
function stepFrameForward() {
  sound.playClick();
  if (!videoEl.value) return;
  videoEl.value.pause();
  isPaused.value = true;
  videoEl.value.currentTime = Math.min(videoEl.value.duration || 15, videoEl.value.currentTime + 0.15);
}

/**
 * 启动当前题目 (阶段 1：视频扫查阶段)
 */
function startQuestion() {
  isScanningPhase.value = true;
  timeLeft.value = TIME_LIMIT;
  questionStartTime = Date.now();
  userAnswer.value = '';
  isPaused.value = false;
  playbackRate.value = 1.0;

  // 清除旧计时器，扫查阶段暂不扣除 15s 倒计时
  if (timer) clearInterval(timer);

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });

  // 视频播放初始化
  nextTick(() => {
    if (videoEl.value) {
      videoEl.value.currentTime = 0;
      videoEl.value.playbackRate = 1.0;
      videoEl.value.play().then(() => {
        isVideoPlaying.value = true;
      }).catch(() => {
        isVideoPlaying.value = false;
      });
    } else {
      // 模拟切面扫查 4 秒后自动结束
      setTimeout(() => {
        handleVideoEnded();
      }, 4500);
    }
  });
}

/**
 * 视频播放结束（或选手点击跳过视频扫查），正式启动【阶段 2：15秒极速答题倒计时】
 */
function handleVideoEnded() {
  if (!isScanningPhase.value) return; // 避免重复触发
  isScanningPhase.value = false;
  isVideoPlaying.value = false;
  sound.playSubmit(); // 提示音：答题阶段开启！

  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });

  // 正式启动高精度 15 秒极速倒计时 (每 100ms 更新)
  if (timer) clearInterval(timer);
  timer = window.setInterval(() => {
    timeLeft.value = Number((timeLeft.value - 0.1).toFixed(1));

    // 音效提示
    if (timeLeft.value <= 5.0 && timeLeft.value > 0) {
      if (Math.round(timeLeft.value * 10) % 10 === 0) {
        sound.playHeartbeat();
      }
    } else if (timeLeft.value > 5.0) {
      if (Math.round(timeLeft.value * 10) % 10 === 0) {
        sound.playTick();
      }
    }

    // 超时自动跳过
    if (timeLeft.value <= 0) {
      handleTimeout();
    }
  }, 100);
}


function handleTimeout() {
  sound.playTimeout();
  recordAnswer('', false, true);
}

function handleSkip() {
  sound.playClick();
  recordAnswer('', false, true);
}

function handleSubmit() {
  if (!userAnswer.value.trim()) return;
  sound.playSubmit();

  const isCorrect = evaluateAnswer(userAnswer.value, currentQuestion.value);
  if (isCorrect) {
    comboCount.value++;
    sound.playCombo(comboCount.value);
  } else {
    comboCount.value = 0;
  }

  recordAnswer(userAnswer.value, isCorrect, false);
}

function fillCorrectAndSubmit() {
  if (!currentQuestion.value) return;
  userAnswer.value = currentQuestion.value.standardAnswer;
  handleSubmit();
}

// 领导演示专属：一键 100 分满分通关直达荣誉证书
function passAllWithPerfectScore() {
  if (timer) clearInterval(timer);
  sound.playVictory();

  const perfectRecords: AnswerRecord[] = props.questions.map((q) => ({
    questionId: q.id,
    userAnswer: q.standardAnswer,
    isCorrect: true,
    timeSpentMs: 1800,
    isSkipped: false,
  }));

  emit('complete', {
    records: perfectRecords,
    totalScore: 100,
    totalTimeSpentSec: 28.5,
  });
}

function recordAnswer(ans: string, isCorrect: boolean, isSkipped: boolean) {
  if (timer) clearInterval(timer);



  const timeSpentMs = Date.now() - questionStartTime;
  answerRecords.value.push({
    questionId: currentQuestion.value.id,
    userAnswer: ans,
    isCorrect,
    timeSpentMs,
    isSkipped,
  });

  if (currentIndex.value < props.questions.length - 1) {
    currentIndex.value++;
    startQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  if (timer) clearInterval(timer);
  sound.playVictory();

  const totalScore = answerRecords.value.reduce((acc, cur) => acc + (cur.isCorrect ? 10 : 0), 0);
  const totalTimeSpentMs = answerRecords.value.reduce((acc, cur) => acc + cur.timeSpentMs, 0);
  const totalTimeSpentSec = Number((totalTimeSpentMs / 1000).toFixed(1));

  emit('complete', {
    records: answerRecords.value,
    totalScore,
    totalTimeSpentSec,
  });
}

onMounted(() => {
  startQuestion();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-5">
    <!-- 顶部状态栏：HUD 科技仪表盘 -->
    <div class="p-3.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 glass-panel shadow-lg mb-4 relative overflow-hidden">
      <div class="flex items-center justify-between gap-3">
        <!-- 题号与连击 -->
        <div class="flex items-center space-x-3">
          <div class="px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-sm">
            Q.{{ currentIndex + 1 }} <span class="text-xs text-slate-500">/ {{ questions.length }}</span>
          </div>

          <div
            v-if="comboCount >= 2"
            class="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-slate-950 font-black text-xs animate-combo shadow-md shadow-red-500/30"
          >
            <Flame class="w-3.5 h-3.5 fill-current" />
            <span>COMBO × {{ comboCount }}!</span>
          </div>
        </div>

        <!-- 两阶段动态状态指示：扫查中 vs 15s极速答题倒计时 (核心需求) -->
        <div class="flex items-center space-x-2">
          <!-- 阶段一：视频扫查中 -->
          <div
            v-if="isScanningPhase"
            class="px-3.5 py-1.5 rounded-xl border border-cyan-500/50 bg-cyan-950/80 text-cyan-300 flex items-center space-x-2 text-xs font-semibold shadow-md"
          >
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>切面扫查中 (播放结束开启 15s 倒计时)</span>
          </div>

          <!-- 阶段二：15秒极速答题倒计时 -->
          <div
            v-else
            :class="[
              'px-4 py-1.5 rounded-xl border flex items-center space-x-2 font-mono font-black text-lg transition-all',
              isTimeCritical
                ? 'bg-red-950/90 border-red-500 text-red-400 animate-heartbeat shadow-lg shadow-red-500/50'
                : 'bg-slate-950 border-cyan-500/50 text-cyan-300 shadow-md'
            ]"
          >
            <Clock :class="['w-4 h-4', isTimeCritical ? 'text-red-400 animate-spin' : 'text-cyan-400']" />
            <span>{{ timeLeft.toFixed(1) }}s</span>
          </div>
        </div>


        <!-- 监考微缩视频窗 -->
        <div class="flex items-center space-x-2">
          <CameraModal :miniMode="true" />
        </div>
      </div>

      <!-- 进度条 -->
      <div class="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden mt-3 border border-slate-800">
        <div
          class="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-500 transition-all duration-300"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
    </div>

    <!-- 核心超声视频主视窗 (带 HUD 边框 + 物理深度标尺 + 多普勒色阶 + 动态防盗水印) -->
    <div v-if="currentQuestion" class="relative rounded-3xl overflow-hidden border-2 border-cyan-400/50 bg-slate-950 shadow-2xl shadow-cyan-900/60 mb-4 group">
      <!-- 题目切面名称与诊断问题（置顶独立横幅，确保超声声束与解剖结构不被遮挡） -->
      <div class="px-4 py-2.5 bg-slate-900/95 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-2 z-30 relative backdrop-blur-md">
        <div class="flex items-center space-x-2.5 flex-1 min-w-0">
          <div class="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 text-xs font-mono shrink-0">
            <Activity class="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>{{ currentQuestion.viewType }}</span>
          </div>
          <h3 class="text-xs sm:text-sm font-bold text-slate-100 truncate">
            {{ currentQuestion.title }}
          </h3>
        </div>
      </div>

      <!-- 动态防盗录水印浮层 -->
      <VideoWatermark
        :userName="userProfile.name"
        :hospital="userProfile.hospital"
      />

      <!-- 1. 左侧：超声物理深度标尺 (0 ~ 15cm 刻度) -->
      <div class="absolute left-2 top-14 bottom-8 flex flex-col justify-between items-center text-[9px] font-mono text-cyan-400/80 z-20 pointer-events-none select-none">
        <span class="flex items-center space-x-1"><span>0</span><span class="w-1.5 h-[1px] bg-cyan-400"></span></span>
        <span class="flex items-center space-x-1"><span>3</span><span class="w-1.5 h-[1px] bg-cyan-400"></span></span>
        <span class="flex items-center space-x-1"><span>6</span><span class="w-1.5 h-[1px] bg-cyan-400"></span></span>
        <span class="flex items-center space-x-1"><span>9</span><span class="w-1.5 h-[1px] bg-cyan-400"></span></span>
        <span class="flex items-center space-x-1"><span>12</span><span class="w-1.5 h-[1px] bg-cyan-400"></span></span>
        <span class="flex items-center space-x-1"><span>15cm</span><span class="w-2 h-[1px] bg-cyan-400"></span></span>
      </div>

      <!-- 2. 右侧：彩色多普勒血流指示标尺 (Color Doppler Velocity Bar) -->
      <div class="absolute right-3 top-16 flex flex-col items-center z-20 pointer-events-none select-none bg-black/60 p-1 rounded-md border border-slate-700/60 backdrop-blur-sm">
        <span class="text-[8px] font-mono text-red-400 font-bold">+60</span>
        <div class="w-2.5 h-16 rounded-sm bg-gradient-to-b from-red-500 via-amber-400 via-50% to-blue-500 my-0.5 shadow-sm"></div>
        <span class="text-[8px] font-mono text-blue-400 font-bold">-60</span>
        <span class="text-[7px] font-mono text-slate-400 scale-90">cm/s</span>
      </div>

      <!-- 超声切面主视窗 -->
      <div class="relative w-full aspect-video max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
        <!-- 如果配置了真实视频则播放真实视频 -->
        <video
          v-if="currentQuestion.videoUrl"
          ref="videoEl"
          :src="currentQuestion.videoUrl"
          playsinline
          muted
          autoplay
          @ended="handleVideoEnded"
          class="w-full h-full object-contain cursor-pointer"
          @click="togglePlayPause"
        ></video>

        <!-- 否则渲染专业级超声动态扫查模拟声束 -->
        <div v-else class="absolute inset-0 flex items-center justify-center opacity-90">
          <!-- 凸阵探头弧形声束网格 -->
          <div class="w-80 h-80 sm:w-96 sm:h-96 border-b-2 border-cyan-400/50 rounded-full bg-gradient-to-t from-cyan-950/60 to-transparent relative overflow-hidden shadow-inner">
            <!-- 扇形超声扫查声束光带 -->
            <div
              v-if="isVideoPlaying"
              class="w-full h-full absolute inset-0 bg-gradient-to-tr from-cyan-400/35 via-transparent to-transparent animate-[spin_2s_linear_infinite] origin-bottom"
            ></div>

            <!-- 超声斑点回波底纹 -->
            <div class="absolute inset-0 bg-radial from-transparent via-cyan-950/30 to-black/85"></div>
          </div>
        </div>

        <!-- 3. 底部：ECG 动态心电导联图腾走线 -->
        <div class="absolute bottom-1 inset-x-0 h-6 flex items-center justify-center pointer-events-none z-20 opacity-70">
          <svg class="w-64 h-5 text-emerald-400 animate-pulse" viewBox="0 0 200 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M0 10 L40 10 L45 3 L50 18 L55 2 L60 14 L65 10 L100 10 L140 10 L145 3 L150 18 L155 2 L160 14 L165 10 L200 10" />
          </svg>
        </div>

        <!-- 视频状态角标 -->
        <div class="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-slate-700 text-xs text-slate-300 backdrop-blur-md z-30">
          <Video class="w-3.5 h-3.5 text-cyan-400" />
          <span v-if="isScanningPhase" class="text-cyan-400 font-bold flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1"></span>
            {{ isPaused ? '切面暂停辨识中' : '真实超声扫查播放中 (限播1次)...' }}
          </span>
          <span v-else class="text-amber-400 font-bold flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>
            扫查结束 · 15s极速答题中！
          </span>
        </div>
      </div>

      <!-- 专业超声精细化微调控制栏 (慢放 / 暂停 / 单帧微步进 / 提前答题) -->
      <div class="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div class="flex items-center space-x-2">
          <!-- 暂停/继续 -->
          <button
            type="button"
            @click="togglePlayPause"
            :class="[
              'px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center space-x-1 transition-all',
              isPaused 
                ? 'bg-amber-950 border-amber-500 text-amber-300' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-cyan-400'
            ]"
          >
            <Play v-if="isPaused" class="w-3.5 h-3.5 fill-current" />
            <Pause v-else class="w-3.5 h-3.5" />
            <span>{{ isPaused ? '继续播放' : '暂停' }}</span>
          </button>

          <!-- 0.5X 慢放切换 -->
          <button
            type="button"
            @click="toggleSlowMotion"
            :class="[
              'px-2.5 py-1 rounded-lg border text-xs font-mono font-bold flex items-center space-x-1 transition-all',
              playbackRate === 0.5
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 glow-cyan'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
            ]"
          >
            <Gauge class="w-3.5 h-3.5 text-cyan-400" />
            <span>{{ playbackRate === 0.5 ? '0.5X 慢放中' : '1.0X 常速' }}</span>
          </button>

          <!-- 单帧步进 (+0.15s) -->
          <button
            type="button"
            @click="stepFrameForward"
            class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1 transition-all"
            title="逐帧微调 (+0.15s)"
          >
            <StepForward class="w-3.5 h-3.5" />
            <span>单帧步进</span>
          </button>
        </div>

        <!-- 提前结束扫查直接开启 15s 答题 -->
        <button
          v-if="isScanningPhase"
          type="button"
          @click="handleVideoEnded"
          class="px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/50 text-cyan-300 font-bold flex items-center space-x-1 transition-all active:scale-95"
        >
          <Zap class="w-3.5 h-3.5 text-cyan-400" />
          <span>辨识完毕 · 开启15s极速秒答 »</span>
        </button>
      </div>
    </div>


    <!-- 纯文本秒答输入栏 (极致聚焦) -->
    <div class="p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 glass-panel shadow-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-2">
        <div class="flex items-center gap-2">
          <!-- 文本输入框 -->
          <div class="relative flex-1">
            <input
              ref="inputRef"
              v-model="userAnswer"
              type="text"
              autocomplete="off"
              placeholder="请输入超声诊断结果 / 异常结构名称 (按 Enter 秒提交)..."
              class="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-950 border-2 border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-sm sm:text-base font-semibold text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              :disabled="!userAnswer.trim()"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-30 transition-all active:scale-95"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>

          <!-- 操作按钮组 -->
          <button
            type="submit"
            :disabled="!userAnswer.trim()"
            class="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-cyan-500/30 disabled:opacity-40 transition-all active:scale-95 whitespace-nowrap"
          >
            提交 (Enter)
          </button>

          <button
            type="button"
            @click="handleSkip"
            class="px-3 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all whitespace-nowrap"
            title="放弃本题"
          >
            <SkipForward class="w-3.5 h-3.5" />
          </button>
        </div>


        <!-- 演示通道与快捷正确答案 (领导评审专属) -->
        <div class="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-800/80">
          <button
            type="button"
            @click="fillCorrectAndSubmit"
            class="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-medium flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <span>💡 本题正确诊断：</span>
            <span class="font-bold text-amber-300">【{{ currentQuestion.standardAnswer }}】</span>
            <span class="text-[11px] underline ml-1 text-cyan-400">（点击一键填入并提交）</span>
          </button>

          <button
            type="button"
            @click="passAllWithPerfectScore"
            class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center space-x-1 transition-all active:scale-95"
          >
            <span>👑 100分卓越直达证书 »</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

