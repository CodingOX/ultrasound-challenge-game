# 超声视频模板与切面素材目录

您可以将真实的胎儿超声切面视频（.mp4 / .webm 格式）直接放入本文件夹中，例如：
- `public/videos/cardiac_4ch.mp4`（四腔心切面）
- `public/videos/cardiac_lvot.mp4`（左室流出道）
- `public/videos/brain_csp.mp4`（透明隔腔横切面）
- `public/videos/spine.mp4`（脊柱矢状扫查）

系统已内置全自动播放引擎、单次播放锁定与动态防盗防录屏水印（自动印上选手姓名、单位与时间戳）。
在 `src/data/questionBank.ts` 中配置对应题目的 `videoUrl: '/videos/您的视频文件名.mp4'` 即可生效！
