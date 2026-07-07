
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
