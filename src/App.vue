<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import WelcomeView from './views/WelcomeView.vue';
import CategoryView from './views/CategoryView.vue';
import RegisterView from './views/RegisterView.vue';
import RulesView from './views/RulesView.vue';
import QuizView from './views/QuizView.vue';
import ResultView from './views/ResultView.vue';
import { getQuestionsForQuiz } from './data/questionBank';
import { sound } from './utils/audio';
import type { AnswerRecord, CategoryId, DifficultyLevel, PageStep, Question, UserProfile } from './types';

// 当前页面状态
const currentStep = ref<PageStep>('welcome');

// 赛道与难度
const selectedCategory = ref<CategoryId>('cardiac');
const selectedLevel = ref<DifficultyLevel>(1);
const unlockedLevels = ref<number[]>([1, 2, 3]); // 4/5 级初始未解锁

// 选手档案
const userProfile = ref<UserProfile>({
  name: '张晓萌',
  hospital: '北京协和医院超声医学科',
  phone: '13812345678',
  hasCameraAuth: true,
  isRegistered: false,
});

// 每人每赛道 3 次机会
const remainingAttempts = ref(3);

// 题目与结果
const quizQuestions = ref<Question[]>([]);
const quizResults = ref<{
  records: AnswerRecord[];
  totalScore: number;
  totalTimeSpentSec: number;
}>({
  records: [],
  totalScore: 0,
  totalTimeSpentSec: 0,
});

// 从 LocalStorage 恢复选手信息
onMounted(() => {
  try {
    const savedProfile = localStorage.getItem('ultrasound_user_profile');
    if (savedProfile) {
      userProfile.value = { ...userProfile.value, ...JSON.parse(savedProfile) };
    }
    const savedUnlocked = localStorage.getItem('ultrasound_unlocked_levels');
    if (savedUnlocked) {
      unlockedLevels.value = JSON.parse(savedUnlocked);
    }
  } catch (e) {
    console.warn('Failed to load cache', e);
  }
});

function handleNavigate(step: PageStep) {
  sound.playClick();
  currentStep.value = step;
}

// 快速跳过当前步骤
function handleGlobalSkip() {
  if (currentStep.value === 'welcome') {
    currentStep.value = 'category';
  } else if (currentStep.value === 'category') {
    currentStep.value = 'register';
  } else if (currentStep.value === 'register') {
    currentStep.value = 'rules';
  } else if (currentStep.value === 'rules') {
    startQuiz();
  }
}


// 欢迎页进入选关
function handleWelcomeStart() {
  currentStep.value = 'category';
}

// 选关完成，必定进入【第3步：报名与人脸监考】
function handleCategorySelect(payload: { category: CategoryId; level: DifficultyLevel }) {
  selectedCategory.value = payload.category;
  selectedLevel.value = payload.level;
  currentStep.value = 'register';
}


// 解锁付费关卡
function handleUnlockLevel(level: DifficultyLevel) {
  if (!unlockedLevels.value.includes(level)) {
    unlockedLevels.value.push(level);
    localStorage.setItem('ultrasound_unlocked_levels', JSON.stringify(unlockedLevels.value));
  }
}

// 报名提交
function handleRegisterSubmit(profile: UserProfile) {
  userProfile.value = profile;
  localStorage.setItem('ultrasound_user_profile', JSON.stringify(profile));
  currentStep.value = 'rules';
}

// 开始答题
function startQuiz() {
  if (remainingAttempts.value <= 0) {
    alert('您的 3 次挑战机会已用完，取历史最高分计入天梯榜！');
    return;
  }

  // 扣减一次挑战机会
  remainingAttempts.value--;

  // 从题库随机抽取 10 道题
  quizQuestions.value = getQuestionsForQuiz(selectedCategory.value, selectedLevel.value, 10);
  currentStep.value = 'quiz';
}

// 答题完毕进入结算
function handleQuizComplete(results: {
  records: AnswerRecord[];
  totalScore: number;
  totalTimeSpentSec: number;
}) {
  quizResults.value = results;
  currentStep.value = 'result';
}

// 重新挑战本关卡
function handleRestart() {
  if (remainingAttempts.value > 0) {
    startQuiz();
  } else {
    currentStep.value = 'category';
  }
}

// 重新选关
function handleChangeCategory() {
  currentStep.value = 'category';
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
    <!-- 全局导航栏 -->
    <Navbar
      :currentStep="currentStep"
      :remainingAttempts="remainingAttempts"
      @skip="handleGlobalSkip"
      @navigate="handleNavigate"
    />

    <!-- 主视图路由容器 -->
    <main class="flex-1 flex flex-col">
      <!-- 1. 欢迎页 -->
      <WelcomeView
        v-if="currentStep === 'welcome'"
        @start="handleWelcomeStart"
        @skip="handleGlobalSkip"
      />

      <!-- 2. 赛道与难度 -->
      <CategoryView
        v-else-if="currentStep === 'category'"
        :selectedCategory="selectedCategory"
        :selectedLevel="selectedLevel"
        :unlockedLevels="unlockedLevels"
        @select="handleCategorySelect"
        @unlockLevel="handleUnlockLevel"
      />

      <!-- 3. 选手报名与监考 -->
      <RegisterView
        v-else-if="currentStep === 'register'"
        :userProfile="userProfile"
        @submit="handleRegisterSubmit"
      />

      <!-- 4. 规则说明与备战 -->
      <RulesView
        v-else-if="currentStep === 'rules'"
        :categoryId="selectedCategory"
        :level="selectedLevel"
        :remainingAttempts="remainingAttempts"
        @startQuiz="startQuiz"
      />

      <!-- 5. 核心视频 15s 答题闯关 -->
      <QuizView
        v-else-if="currentStep === 'quiz'"
        :questions="quizQuestions"
        :categoryId="selectedCategory"
        :level="selectedLevel"
        :userProfile="userProfile"
        @complete="handleQuizComplete"
        @restart="handleRestart"
      />


      <!-- 6. 成绩结算、Top 100 天梯榜与证书 -->
      <ResultView
        v-else-if="currentStep === 'result'"
        :userProfile="userProfile"
        :categoryId="selectedCategory"
        :level="selectedLevel"
        :records="quizResults.records"
        :totalScore="quizResults.totalScore"
        :totalTimeSpentSec="quizResults.totalTimeSpentSec"
        :remainingAttempts="remainingAttempts"
        @restart="handleRestart"
        @changeCategory="handleChangeCategory"
      />
    </main>
  </div>
</template>
