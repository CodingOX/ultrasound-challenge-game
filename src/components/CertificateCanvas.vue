<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Download, Sparkles, Check } from 'lucide-vue-next';

import { sound } from '../utils/audio';
import { getCertGrade } from '../utils/scoring';
import type { CategoryId, DifficultyLevel } from '../types';

const props = defineProps<{
  userName: string;
  hospital: string;
  score: number;
  level: DifficultyLevel;
  categoryId: CategoryId;
  dateStr: string;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isGenerating = ref(false);
const downloadSuccess = ref(false);

function getCategoryName(catId: CategoryId): string {
  switch (catId) {
    case 'cardiac': return '胎儿心脏筛查';
    case 'malformation': return '胎儿畸形产前超声诊断';
    case 'structure': return '胎儿超声结构精准识别';
  }
}

/**
 * 绘制 2K 高清防伪荣誉证书 (1920 x 1357 比例)
 */
function drawCertificate() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = 1600;
  const height = 1131;
  canvas.width = width;
  canvas.height = height;

  const gradeInfo = getCertGrade(props.score);

  // 1. 背景底色：典雅米金/深色羊皮纸感
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e1b4b');
  bgGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. 底纹科技水印网格
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. 华丽双层金边与外框
  const pad = 45;
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 6;
  ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad + 12, pad + 12, width - (pad + 12) * 2, height - (pad + 12) * 2);

  // 四角装饰花纹
  const drawCorner = (cx: number, cy: number, rot: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(0, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(4, 4, 8, 8);
    ctx.restore();
  };
  drawCorner(pad + 18, pad + 18, 0);
  drawCorner(width - pad - 18, pad + 18, Math.PI / 2);
  drawCorner(width - pad - 18, height - pad - 18, Math.PI);
  drawCorner(pad + 18, height - pad - 18, -Math.PI / 2);

  // 4. 机构顶标与纹章
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('ASIA PACIFIC INSTITUTE OF BIRTH DEFECTS PREVENTION AND CONTROL', width / 2, 115);

  // 5. 证书大标题
  ctx.fillStyle = '#fbbf24';
  ctx.font = '900 68px "Songti SC", "SimSun", "Noto Serif SC", serif';
  ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';
  ctx.shadowBlur = 15;
  ctx.fillText('荣  誉  证  书', width / 2, 215);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#64748b';
  ctx.font = '16px monospace';
  ctx.fillText('CERTIFICATE OF EXCELLENCE IN PRENATAL ULTRASOUND', width / 2, 255);

  // 装饰分隔线
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 220, 275);
  ctx.lineTo(width / 2 + 220, 275);
  ctx.stroke();

  // 6. 选手称谓
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 36px "Songti SC", "SimSun", serif';
  ctx.fillText(`【 ${props.userName || '参赛选手'} 】 同志（${props.hospital || '专业超声医学中心'}）：`, 180, 370);

  // 7. 正文颁奖词
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '28px "Songti SC", "SimSun", serif';
  const catTitle = getCategoryName(props.categoryId);
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const line1 = `    您于 ${year} 年 ${month} 月 ${day} 日参加由 亞太出生缺陷防治研究院 主办、产超智培 协办`;
  const line2 = `的《${catTitle}大挑战》（${props.level}级考核），展现出精湛严谨的产前超声切面`;
  const line3 = `判读与诊断分析能力。经学术委员会专家综合测评，最终成绩评定为：`;

  ctx.fillText(line1, 180, 450);
  ctx.fillText(line2, 180, 510);
  ctx.fillText(line3, 180, 570);

  // 8. 评定等级大字徽章
  ctx.textAlign = 'center';
  ctx.fillStyle = gradeInfo.color;
  ctx.font = '900 64px "Songti SC", "SimSun", serif';
  ctx.shadowColor = gradeInfo.color;
  ctx.shadowBlur = 20;
  ctx.fillText(`【 ${gradeInfo.title} 】`, width / 2, 680);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('特 此 祝 贺 ！', width / 2, 740);

  // 9. 底部签名机构与红印章
  const signX = width - 360;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 22px "Songti SC", "SimSun", serif';
  ctx.fillText('主办方：亞太出生缺陷防治研究院', signX - 60, 850);
  ctx.fillText('协办方：产超智培', signX - 60, 890);
  ctx.fillText(`发证日期：${year}年${month}月${day}日`, signX - 60, 930);

  // 绘制仿真实体红印章
  drawStamp(ctx, signX + 120, 890, '亞太出生缺陷防治研究院');

  // 10. 左下角防伪码
  ctx.fillStyle = '#64748b';
  ctx.font = '16px monospace';
  const certId = `APBD-${year}${month}${day}-${Math.floor(10000 + Math.random() * 90000)}`;
  ctx.fillText(`防伪证书编号: ${certId}`, 180, 980);
  ctx.fillText('官方查验网址: www.apibd.org/verify', 180, 1010);
}

// 绘制官方权威红色防伪印章
function drawStamp(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.08); // 微角度倾斜

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  ctx.lineWidth = 4;

  // 外圆与内圆
  ctx.beginPath();
  ctx.arc(0, 0, 75, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();

  // 中心五角星
  ctx.beginPath();
  const r = 20;
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();

  // 环形文字
  ctx.font = 'bold 13px "Songti SC", "SimSun", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const chars = text.split('');
  const totalAngle = Math.PI * 1.4;
  const startAngle = -Math.PI / 2 - totalAngle / 2;
  const step = totalAngle / (chars.length - 1);

  chars.forEach((ch, idx) => {
    const angle = startAngle + idx * step;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillText(ch, 0, -52);
    ctx.restore();
  });

  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('★ 学术委员会 ★', 0, 36);

  ctx.restore();
}

/**
 * 一键下载 2K 高清证书 PNG
 */
function downloadCert() {
  sound.playSubmit();
  isGenerating.value = true;
  const canvas = canvasRef.value;
  if (!canvas) return;

  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `产前超声大挑战荣誉证书_${props.userName || '医生'}_${props.level}级.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  isGenerating.value = false;
  downloadSuccess.value = true;
  setTimeout(() => {
    downloadSuccess.value = false;
  }, 3000);
}

onMounted(() => {
  drawCertificate();
});

watch(() => [props.userName, props.score, props.level, props.categoryId], () => {
  drawCertificate();
});
</script>

<template>
  <div class="flex flex-col items-center w-full">
    <!-- 证书高保真预览视窗 -->
    <div class="w-full max-w-2xl rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-500/10 bg-slate-950 p-2 relative group">
      <canvas ref="canvasRef" class="w-full h-auto rounded-xl block shadow-inner"></canvas>
      
      <div class="absolute top-4 right-4 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/30 text-[11px] text-amber-300 backdrop-blur-md flex items-center space-x-1.5">
        <Sparkles class="w-3.5 h-3.5" />
        <span>官方权威防伪证书</span>
      </div>
    </div>

    <!-- 下载按钮 -->
    <div class="mt-4 flex flex-col sm:flex-row items-center gap-3">
      <button
        @click="downloadCert"
        :disabled="isGenerating"
        class="flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/30 active:scale-95"
      >
        <Download v-if="!downloadSuccess" class="w-4 h-4" />
        <Check v-else class="w-4 h-4 text-emerald-950" />
        <span>{{ downloadSuccess ? '已保存至下载目录！' : '📥 保存高清证书至手机/电脑' }}</span>
      </button>

      <span class="text-xs text-slate-400">
        高清 2K 打印画质 · 支持永久留存
      </span>
    </div>
  </div>
</template>
