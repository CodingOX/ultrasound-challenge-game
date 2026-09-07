<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';

const props = defineProps<{
  userName: string;
  hospital: string;
}>();

const randomKey = ref(Date.now().toString(36).toUpperCase());
const currentTimeStr = ref('');
const driftX = ref(0);
const driftY = ref(0);
let timer: number | null = null;

// 水印文本组合
const watermarkText = computed(() => {
  const name = props.userName || '参赛选手';
  const hosp = props.hospital || '超声医学中心';
  return `${name} · ${hosp} · ${currentTimeStr.value} · ID:${randomKey.value}`;
});

function updateTime() {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  currentTimeStr.value = `${m}-${d} ${h}:${min}:${s}`;
}

onMounted(() => {
  updateTime();
  // 每秒更新时间与微漂移防录屏截屏
  timer = window.setInterval(() => {
    updateTime();
    // 随机微漂移 ±15px
    driftX.value = (Math.random() - 0.5) * 20;
    driftY.value = (Math.random() - 0.5) * 15;
  }, 2000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <div class="absolute inset-0 pointer-events-none overflow-hidden select-none z-20">
    <!-- 1. 全屏倾斜平铺防盗水印矩阵 (低透明度，防截屏去水印) -->
    <div 
      class="w-[180%] h-[180%] -top-[40%] -left-[40%] absolute flex flex-wrap content-around justify-around transform -rotate-15 opacity-25"
      :style="{ transform: `rotate(-15deg) translate(${driftX}px, ${driftY}px)` }"
    >
      <div 
        v-for="i in 18" 
        :key="i"
        class="text-[11px] font-mono text-cyan-200/90 whitespace-nowrap p-4 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
      >
        🔒 绝密视频切面 · {{ watermarkText }}
      </div>
    </div>

    <!-- 2. 视频四角显著官方防伪标识与选手身份 -->
    <div class="absolute bottom-2 left-3 flex items-center space-x-2 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 text-[10px] text-cyan-300 font-mono shadow-lg">
      <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
      <span>受保密监控：{{ userName }}（{{ hospital }}）</span>
    </div>

    <!-- 3. 右下角时间与防伪码 -->
    <div class="absolute bottom-2 right-3 text-[9px] font-mono text-slate-400/80 bg-black/50 px-2 py-0.5 rounded">
      APBD-SEC-{{ randomKey }}
    </div>
  </div>
</template>
