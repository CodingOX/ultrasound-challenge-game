<script setup lang="ts">
import { ref } from 'vue';
import { HeartPulse, Brain, Layers, Lock, Unlock, ChevronRight, CheckCircle2 } from 'lucide-vue-next';
import { CATEGORIES, DIFFICULTY_CONFIGS } from '../data/questionBank';
import { sound } from '../utils/audio';
import PaymentModal from '../components/PaymentModal.vue';
import type { CategoryId, DifficultyConfig, DifficultyLevel } from '../types';

const props = defineProps<{
  selectedCategory: CategoryId;
  selectedLevel: DifficultyLevel;
  unlockedLevels: number[];
}>();

const emit = defineEmits<{
  (e: 'select', payload: { category: CategoryId; level: DifficultyLevel }): void;
  (e: 'unlockLevel', level: DifficultyLevel): void;
}>();

const currentCategory = ref<CategoryId>(props.selectedCategory);
const currentLevel = ref<DifficultyLevel>(props.selectedLevel);
const showPaymentModal = ref(false);
const payingConfig = ref<DifficultyConfig | null>(null);

function selectCategory(catId: CategoryId) {
  sound.playClick();
  currentCategory.value = catId;
}

function selectLevel(config: DifficultyConfig) {
  sound.playClick();
  if (config.isPaid && !props.unlockedLevels.includes(config.level)) {
    payingConfig.value = config;
    showPaymentModal.value = true;
    return;
  }
  currentLevel.value = config.level;
}

function handlePaymentSuccess() {
  if (payingConfig.value) {
    emit('unlockLevel', payingConfig.value.level);
    currentLevel.value = payingConfig.value.level;
  }
  showPaymentModal.value = false;
}

function handleConfirm() {
  sound.playSubmit();
  emit('select', {
    category: currentCategory.value,
    level: currentLevel.value,
  });
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- 标题 -->
    <div class="text-center mb-6">
      <h2 class="text-2xl sm:text-3xl font-black text-slate-100">选择竞技赛道与段位</h2>
      <p class="text-xs text-slate-400 mt-1">每个赛道独立核算天梯榜排位</p>
    </div>

    <!-- 1. 赛道选择 (3 选 1) -->
    <div class="mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          v-for="cat in CATEGORIES"
          :key="cat.id"
          @click="selectCategory(cat.id)"
          :class="[
            'p-4 rounded-2xl cursor-pointer transition-all relative border flex items-center space-x-3.5',
            currentCategory === cat.id
              ? 'bg-gradient-to-r from-cyan-950/90 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20 glow-cyan'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          ]"
        >
          <!-- 选中角标 -->
          <div v-if="currentCategory === cat.id" class="absolute top-2.5 right-2.5 text-cyan-400">
            <CheckCircle2 class="w-4 h-4 fill-cyan-400 text-slate-950" />
          </div>

          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border',
              currentCategory === cat.id ? 'bg-cyan-500/20 border-cyan-400/50' : 'bg-slate-800/80 border-slate-700'
            ]"
          >
            <HeartPulse v-if="cat.id === 'cardiac'" class="w-6 h-6 text-red-400" />
            <Brain v-else-if="cat.id === 'malformation'" class="w-6 h-6 text-purple-400" />
            <Layers v-else class="w-6 h-6 text-cyan-400" />
          </div>

          <div>
            <h4 class="text-sm font-bold text-slate-100">{{ cat.title }}</h4>
            <p class="text-[11px] text-amber-400 font-medium">{{ cat.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 难度等级选择 (1 ~ 5 级) -->
    <div class="mb-8">
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div
          v-for="config in DIFFICULTY_CONFIGS"
          :key="config.level"
          @click="selectLevel(config)"
          :class="[
            'p-3.5 rounded-2xl cursor-pointer transition-all border relative flex flex-col justify-between text-center',
            currentLevel === config.level
              ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 border-amber-400 shadow-md shadow-amber-500/20 glow-gold scale-[1.02]'
              : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
          ]"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
              Lv.{{ config.level }}
            </span>

            <!-- 解锁状态 -->
            <div v-if="config.isPaid">
              <span
                v-if="unlockedLevels.includes(config.level)"
                class="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/50 text-[9px] text-emerald-400 font-bold flex items-center space-x-0.5"
              >
                <Unlock class="w-2.5 h-2.5" />
                <span>已解锁</span>
              </span>
              <span
                v-else
                class="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/50 text-[9px] text-amber-400 font-bold flex items-center space-x-0.5"
              >
                <Lock class="w-2.5 h-2.5" />
                <span>¥{{ config.price }}</span>
              </span>
            </div>
            <span v-else class="text-[9px] text-slate-500">免费</span>
          </div>

          <h5 class="text-xs font-bold text-slate-100">{{ config.subName }}</h5>
          <span class="text-[10px] text-amber-300/80 mt-0.5 font-medium">{{ config.name.split('·')[1]?.trim() }}</span>
        </div>
      </div>
    </div>

    <!-- 底部确认按钮 -->
    <div class="flex justify-center">
      <button
        @click="handleConfirm"
        class="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95 glow-cyan"
      >
        <span>确认进入 · 报名开战</span>
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- 收费二维码弹窗 -->
    <PaymentModal
      v-if="showPaymentModal && payingConfig"
      :config="payingConfig"
      @close="showPaymentModal = false"
      @success="handlePaymentSuccess"
    />
  </div>
</template>
