## 修复记录

### v0.4.314.dev - 2026-07-08

**修复：全屏 PDF 冷启动渲染异常 + 连续模式无法滚动 + 多帧取值不一致**

1. **_loadPdf 等更多帧**：从 1 rAF 改为双 rAF + 安全阀（scrollEl 尺寸为 0 则最多再等 5 帧），解决冷启动 layout 未完成时 clientHeight=0 导致 scale 计算错误
2. **连续模式 scrollEl overflow**：从统一 `overflow:hidden` 改为单页 `hidden` / 连续 `overflowY:auto`，修复连续模式无法滚动
3. **_reRender 双 rAF**：DOM 重建后等 2 帧再渲染，避免复杂布局时 scale 基于错误容器尺寸计算
4. **_calcScale 预取值**：接受可选 w/h 参数，`_renderAllPages` 和 `_resizeAllCanvases` 先取值再传入，消除重复读取差一帧问题
5. **_bindScroll onscroll 注释**：明确标注仅连续模式注册（单页 `overflow:hidden` 不触发）
6. **_toggleThumbnailPanel 双 rAF**：等缩略图面板 DOM 插入 + layout 完成后再 `_resizeAllCanvases`，之前单帧面板未布局导致主画布宽度不正确

---

## 观察：重启 Obsidian 后全屏 PDF 异常

**时间**: 2026-07-06 23:43
**版本**: v0.4.294.dev
**现象**: 重启 Obsidian 后打开 PDF 全屏，渲染出问题（具体表现待确认）
**规律猜测**: 
- 全屏 view 每次打开都是新建实例，不跨会话持久化
- 冷启动 vs 热启动差异可能在于：
  1. PDF.js lib 首次加载时序
  2. containerEl DOM 布局尚未完成（clientWidth/Height=0）
  3. 插件 onload 还没走完就开始交互
**待验证**: 冷启动后等几秒再开全屏 vs 立刻开全屏

**根因确认** (v0.4.314)：
- `_loadPdf` 只等 1 帧 rAF 后调 `_renderAllPages`，冷启动时 scrollEl clientHeight 为 0，`_calcScale` 兜底 600px
- `_calcScale` 被 `_renderAllPages` 调用时内部独立读取 scrollEl 尺寸，与调用方已读的值可能差一帧
- `_reRender` 同理，DOM 清空重建后只等 1 帧不够
