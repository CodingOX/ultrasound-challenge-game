<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { 
  Clock, Send, SkipForward, Flame, Video, Activity, 
  CheckCircle2, RotateCcw, AlertTriangle
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
  (e: 'restart'): void;
}>();

const currentIndex = ref(0);
const userAnswer = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// 核心状态：是否处于扫查观察阶段 (true = 视频扫查中不扣计时，false = 15s极速答题倒计时中)
const isScanningPhase = ref(true);
const isVideoPlaying = ref(false);
const videoEl = ref<HTMLVideoElement | null>(null);

// 中途重开确认弹窗状态
const showRestartConfirm = ref(false);

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
 * 启动当前题目 (阶段 1：视频扫查阶段，常速播放1遍，禁止暂停与慢放)
 */
function startQuestion() {
  isScanningPhase.value = true;
  timeLeft.value = TIME_LIMIT;
  questionStartTime = Date.now();
  userAnswer.value = '';

  // 清除旧计时器，扫查阶段暂不扣除 15s 倒计时
  if (timer) clearInterval(timer);

  // 视频播放初始化：重置为 0 开始单遍播放
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
      // 备用：模拟切面扫查 4 秒后自动结束
      setTimeout(() => {
        handleVideoEnded();
      }, 4500);
    }
  });
}

/**
 * 视频播放自然结束，正式启动【阶段 2：15秒极速答题倒计时】
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

/**
 * 跳过本题：全流程（扫查期与答题期）随时立即可用，无需等待
 */
function handleSkip() {
  sound.playClick();
  recordAnswer('', false, true);
}

function handleSubmit() {
  if (!userAnswer.value.trim() || isScanningPhase.value) return;
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
  if (isScanningPhase.value) {
    handleVideoEnded();
  }
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

// 中途重新开局处理
function triggerRestart() {
  sound.playClick();
  showRestartConfirm.value = true;
}

function confirmRestart() {
  if (timer) clearInterval(timer);
  showRestartConfirm.value = false;
  sound.playClick();
  emit('restart');
}

function cancelRestart() {
  sound.playClick();
  showRestartConfirm.value = false;
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
        <!-- 左侧：题号、连击与重开按钮 -->
        <div class="flex items-center space-x-2.5">
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

          <!-- 放弃本轮 / 重新开局按钮 (考生发挥失常时可随时重新开局) -->
          <button
            type="button"
            @click="triggerRestart"
            class="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 text-xs font-medium transition-all active:scale-95"
            title="发挥失常？点击可放弃当前轮次并重新开局"
          >
            <RotateCcw class="w-3 h-3 text-slate-400" />
            <span>放弃本轮·重新开局</span>
          </button>
        </div>

        <!-- 中间：两阶段动态状态指示 (扫查中 vs 15s极速答题倒计时) -->
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

        <!-- 右侧：监考微缩视频窗 -->
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
      <!-- 题目切面名称与诊断问题（置顶独立横幅，确保超声声束与解剖结构完全不被遮挡） -->
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

      <!-- 超声切面主视窗 (常速单遍播放，禁止暂停与慢放，确保考核公正) -->
      <div class="relative w-full aspect-video max-h-[380px] bg-black flex items-center justify-center overflow-hidden">
        <video
          v-if="currentQuestion.videoUrl"
          ref="videoEl"
          :src="currentQuestion.videoUrl"
          playsinline
          muted
          autoplay
          @ended="handleVideoEnded"
          class="w-full h-full object-contain pointer-events-none select-none"
        ></video>

        <!-- 备用：若无视频则渲染动态声束模拟 -->
        <div v-else class="absolute inset-0 flex items-center justify-center opacity-90">
          <div class="w-80 h-80 sm:w-96 sm:h-96 border-b-2 border-cyan-400/50 rounded-full bg-gradient-to-t from-cyan-950/60 to-transparent relative overflow-hidden shadow-inner">
            <div
              v-if="isVideoPlaying"
              class="w-full h-full absolute inset-0 bg-gradient-to-tr from-cyan-400/35 via-transparent to-transparent animate-[spin_2s_linear_infinite] origin-bottom"
            ></div>
            <div class="absolute inset-0 bg-radial from-transparent via-cyan-950/30 to-black/85"></div>
          </div>
        </div>

        <!-- 3. 底部：ECG 动态心电走线 -->
        <div class="absolute bottom-1 inset-x-0 h-6 flex items-center justify-center pointer-events-none z-20 opacity-70">
          <svg class="w-64 h-5 text-emerald-400 animate-pulse" viewBox="0 0 200 20" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M0 10 L40 10 L45 3 L50 18 L55 2 L60 14 L65 10 L100 10 L140 10 L145 3 L150 18 L155 2 L160 14 L165 10 L200 10" />
          </svg>
        </div>

        <!-- 视频状态角标 (仅扫查期显示) -->
        <div v-if="isScanningPhase" class="absolute top-3 left-3 flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-black/70 border border-slate-700 text-xs text-slate-300 backdrop-blur-md z-30 pointer-events-none select-none">
          <Video class="w-3.5 h-3.5 text-cyan-400" />
          <span class="text-cyan-400 font-bold flex items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1"></span>
            真实超声切面扫查中 (单遍连贯播放)...
          </span>
        </div>

        <!-- 扫查结束遮罩蒙层 (播放完毕立即覆盖，引导下方作答，防止重复刷视频) -->
        <div
          v-if="!isScanningPhase"
          class="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-30 transition-all duration-300 select-none"
        >
          <div class="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/20">
            <CheckCircle2 class="w-7 h-7 text-cyan-300 animate-pulse" />
          </div>
          <h4 class="text-base sm:text-lg font-black text-slate-100 mb-1 drop-shadow">
            切面扫查已完成 · 15秒极速答题进行中
          </h4>
          <p class="text-xs sm:text-sm text-cyan-300 font-medium max-w-md leading-relaxed">
            请根据刚才视频播放内容在下方作答框输入相应疾病诊断
          </p>
          <div class="mt-3 flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-amber-400">
            <Clock class="w-3.5 h-3.5 animate-pulse" />
            <span>作答倒计时剩余 {{ timeLeft.toFixed(1) }} 秒</span>
          </div>
        </div>
      </div>
    </div>


    <!-- 纯文本秒答输入栏 (模式 1：扫查中全神贯注观察置灰不可用，播放完毕后启动倒计时并激活输入) -->
    <div class="p-4 rounded-2xl bg-slate-900/95 border border-cyan-500/40 glass-panel shadow-2xl">
      <form @submit.prevent="handleSubmit" class="space-y-3">
        <div class="flex items-center gap-2.5">
          <!-- 文本输入框 -->
          <div class="relative flex-1">
            <input
              ref="inputRef"
              v-model="userAnswer"
              type="text"
              autocomplete="off"
              :disabled="isScanningPhase"
              :placeholder="isScanningPhase ? '⏳ 动态切面扫查中，请全神贯注观察，播完开启作答...' : '请根据切面特征输入诊断结果 (按 Enter 秒提交)...'"
              :class="[
                'w-full pl-4 pr-10 py-3 rounded-xl border-2 text-sm sm:text-base font-semibold outline-none transition-all shadow-inner',
                isScanningPhase
                  ? 'bg-slate-950/40 border-slate-800 text-slate-500 placeholder-slate-600 cursor-not-allowed'
                  : 'bg-slate-950 border-cyan-500/40 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 text-slate-100 placeholder-slate-500'
              ]"
            />
            <button
              type="submit"
              :disabled="isScanningPhase || !userAnswer.trim()"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 disabled:opacity-20 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send class="w-4 h-4" />
            </button>
          </div>

          <!-- 提交按钮 -->
          <button
            type="submit"
            :disabled="isScanningPhase || !userAnswer.trim()"
            class="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-cyan-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 whitespace-nowrap"
          >
            提交 (Enter)
          </button>

          <!-- 醒目中文跳过按钮：全流程立即可用，绝不禁用！ -->
          <button
            type="button"
            @click="handleSkip"
            class="px-4 py-3 rounded-xl bg-slate-800 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-500/60 text-xs sm:text-sm font-bold text-slate-300 hover:text-amber-300 flex items-center space-x-1.5 transition-all whitespace-nowrap active:scale-95 shadow-sm"
            title="放弃本题，直接进入下一题"
          >
            <SkipForward class="w-4 h-4 text-amber-400" />
            <span>⏩ 跳过本题 (放弃)</span>
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

    <!-- 放弃本轮 · 重新开局二次确认弹窗 -->
    <div
      v-if="showRestartConfirm"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div class="w-full max-w-sm rounded-2xl bg-slate-900 border border-red-500/40 p-5 shadow-2xl space-y-4 animate-scale-up">
        <div class="flex items-center space-x-3 text-red-400">
          <div class="p-2 rounded-xl bg-red-950/80 border border-red-500/30">
            <AlertTriangle class="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h4 class="font-bold text-base text-slate-100">确认放弃本轮吗？</h4>
            <p class="text-xs text-slate-400 mt-0.5">本轮成绩将不计入天梯榜</p>
          </div>
        </div>

        <p class="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          如果您感觉发挥失常或未看清切面，可以随时重新开局。重新开始将消耗一次挑战机会并生成新的一组随机题目。
        </p>

        <div class="flex items-center justify-end space-x-2 pt-2">
          <button
            type="button"
            @click="cancelRestart"
            class="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
          >
            继续答题
          </button>
          <button
            type="button"
            @click="confirmRestart"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition-all active:scale-95"
          >
            确认放弃并重开
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
