<script setup lang="ts">
import { ref } from 'vue';
import { User, Building, Phone, KeyRound, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-vue-next';
import { sound } from '../utils/audio';
import CameraModal from '../components/CameraModal.vue';
import type { UserProfile } from '../types';

const props = defineProps<{
  userProfile: UserProfile;
}>();

const emit = defineEmits<{
  (e: 'submit', profile: UserProfile): void;
}>();

const form = ref<UserProfile>({
  name: props.userProfile.name || '',
  hospital: props.userProfile.hospital || '',
  phone: props.userProfile.phone || '',
  hasCameraAuth: false,
  isRegistered: true,
});


const verificationCode = ref('8888');
const isSendingCode = ref(false);
const codeCountdown = ref(0);
const formError = ref('');

function sendCode() {
  if (!form.value.phone) {
    formError.value = '请先输入手机号码';
    return;
  }
  sound.playClick();
  isSendingCode.value = true;
  codeCountdown.value = 60;
  verificationCode.value = '8888';

  const timer = setInterval(() => {
    codeCountdown.value--;
    if (codeCountdown.value <= 0) {
      clearInterval(timer);
      isSendingCode.value = false;
    }
  }, 1000);
}

function handleCameraAuth(_stream: MediaStream | null) {
  form.value.hasCameraAuth = true;
}


function handleSubmit() {
  formError.value = '';
  if (!form.value.name.trim()) {
    formError.value = '请输入选手姓名（用于证书印制与天梯榜展示）';
    return;
  }
  if (!form.value.hospital.trim()) {
    formError.value = '请输入所属医院或单位名称';
    return;
  }
  if (!form.value.phone.trim()) {
    formError.value = '请输入手机号码';
    return;
  }
  if (!verificationCode.value.trim()) {
    formError.value = '请输入短信验证码';
    return;
  }

  sound.playSubmit();
  emit('submit', {
    ...form.value,
    isRegistered: true,
  });
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <!-- 步骤指示器 -->
    <div class="text-center mb-8">
      <span class="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
        Step 02 / 04 · 选手身份核验与防作弊监考
      </span>
      <h2 class="text-2xl sm:text-3xl font-black text-slate-100 mt-2">填写选手报名信息</h2>
      <p class="text-xs sm:text-sm text-slate-400 mt-1">信息将严格加密保护，仅用于证书姓名生成与天梯榜实名认证</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
      <!-- 左侧：报名表单 (7栏) -->
      <div class="md:col-span-7 p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/20 glass-panel shadow-xl">
        <h3 class="text-base font-bold text-slate-100 mb-6 flex items-center space-x-2">
          <ShieldCheck class="w-5 h-5 text-cyan-400" />
          <span>选手基本信息登记</span>
        </h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- 姓名 -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">
              选手真实姓名 <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User class="w-4 h-4" />
              </div>
              <input
                v-model="form.name"
                type="text"
                placeholder="请输入真实姓名（印制于证书）"
                required
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <!-- 单位/医院 -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">
              所属医院 / 工作单位 <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Building class="w-4 h-4" />
              </div>
              <input
                v-model="form.hospital"
                type="text"
                placeholder="如：北京协和医院超声医学科"
                required
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <!-- 电话 -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">
              手机号码 <span class="text-red-400">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Phone class="w-4 h-4" />
              </div>
              <input
                v-model="form.phone"
                type="tel"
                placeholder="请输入11位手机号"
                required
                class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <!-- 验证码 -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">
              短信验证码 <span class="text-red-400">*</span>
            </label>
            <div class="flex space-x-2">
              <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound class="w-4 h-4" />
                </div>
                <input
                  v-model="verificationCode"
                  type="text"
                  placeholder="验证码"
                  required
                  class="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm text-slate-100 placeholder-slate-500 transition-all outline-none"
                />
              </div>
              <button
                type="button"
                @click="sendCode"
                :disabled="isSendingCode"
                class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-cyan-300 disabled:text-slate-500 whitespace-nowrap transition-colors"
              >
                {{ isSendingCode ? `${codeCountdown}s 后重发` : '获取验证码' }}
              </button>
            </div>
          </div>

          <!-- 错误提示 -->
          <div v-if="formError" class="text-xs text-red-400 bg-red-950/40 p-2.5 rounded-lg border border-red-500/30">
            {{ formError }}
          </div>

          <!-- 提交按钮 -->
          <div class="pt-4">
            <button
              type="submit"
              class="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 active:scale-95 glow-cyan"
            >
              <span>确认报名 · 查看竞赛规则</span>
              <ArrowRight class="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      <!-- 右侧：人脸监考与摄像头授权 (5栏) -->
      <div class="md:col-span-5 flex flex-col space-y-4">
        <div class="p-6 rounded-3xl bg-slate-900/80 border border-cyan-500/20 glass-panel">
          <h4 class="text-sm font-bold text-slate-200 mb-3 flex items-center space-x-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>打开摄像头 · 人脸核验</span>
          </h4>
          <p class="text-xs text-slate-400 mb-4">
            为保证全国天梯榜竞技公平性，闯关全程将进行本地 AI 人脸防作弊微缩监考。
          </p>

          <CameraModal @authorized="handleCameraAuth" />
        </div>

        <div class="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-300 flex items-start space-x-2.5">
          <CheckCircle2 class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>每位选手每赛道拥有 3 次挑战机会，系统自动提取最高成绩计入天梯榜。</span>
        </div>
      </div>
    </div>
  </div>
</template>
