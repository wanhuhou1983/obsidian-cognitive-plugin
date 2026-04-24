# Cognitive Noise Reducer

Obsidian 插件：AI 驱动的 Markdown 精度修复与认知降噪工具

## 功能

- 📝 **精度修复**：自动修复 OCR/PDF 转换产生的换行错误、标题层级混乱、页眉页脚垃圾
- 🧠 **认知降噪**：将冗杂文本视为复杂系统进行语义无损压缩，输出结构化知识卡片
- ⚡ **全流程**：一键完成精度修复 + 认知降噪，产出两个副产物

## 安装

### 方式一：手动安装

1. 克隆或下载本仓库
2. 进入目录安装依赖：
   ```bash
   npm install
   ```
3. 编译 TypeScript：
   ```bash
   npm run build
   ```
4. 将编译后的 `manifest.json` 和 `main.js` 复制到你的 Obsidian 插件目录：
   - Windows: `%APPDATA%\obsidian\plugins\cognitive-noise-reducer\`
   - macOS: `~/Library/Application Support/obsidian/plugins/cognitive-noise-reducer/`
5. 重启 Obsidian
6. 在设置中启用插件并配置 API Key

### 方式二：开发模式

```bash
npm run dev
# 监听文件变化自动编译
```

## 配置

首次使用需要在插件设置中配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| API Base URL | DeepSeek API 地址 | `https://api.deepseek.com/v1` |
| API Key | 你的 DeepSeek API Key | - |
| 精度修复模型 | 用于格式修复的模型 | `deepseek-chat` |
| 认知降噪模型 | 用于结构化分析的模型 | `deepseek-reasoner` |
| 输出模式 | 新建文件/替换原文/侧边栏 | 新建文件 |

## 使用方法

### 方式一：点击 Ribbon 图标

点击 Obsidian 左侧边栏的大脑图标，弹出模式选择：

- 📝 精度修复
- 🧠 认知降噪  
- ⚡ 全流程

### 方式二：命令面板

`Ctrl+P` 打开命令面板，搜索：

- `Cognitive Noise Reducer: 处理当前笔记` - 弹出模式选择
- `Cognitive Noise Reducer: 仅精度修复` - 直接执行精度修复
- `Cognitive Noise Reducer: 仅认知降噪` - 直接执行认知降噪

## 输出示例

### 精度修复输出

```
original_length: 42851
fixed_issues:
  - 换行修复: 127处
  - 标题层级调整: 15处
  - 垃圾清理: 8处
---

[修复后的纯净 Markdown 内容]
```

### 认知降噪输出

```markdown
### 📌 知识元数据 (Meta-Data)
- **信息密度:** 强信号 (Alpha)
- **评估理由:** ...
- **核心标签:** #复合霸权体系 #美元环流机制

### 🌳 系统逻辑树 (The Structure)
**核心断言 (Core Thesis):** > ...

**推演骨架 (Logical Branches):**
- 🔴 初始条件：...
- 🔄 传导机制：...
- 🎯 最终演化：...

### ⚙️ 变量与约束 (Variables & Constraints)
- **关键变量:** ...
- **边界条件:** ...

### 💡 逆向思考 / 结构漏洞
- ...
```

## 成本估算

以美国霸权文章（~43K字符）为例：

| 操作 | 输入 tokens | 输出 tokens | 成本（DeepSeek） |
|------|-------------|-------------|------------------|
| 精度修复 | ~22,000 | ~15,000 | ¥0.01 |
| 认知降噪 | ~15,000 | ~3,000 | ¥0.005 |
| **合计** | - | - | **≈¥0.015/篇** |

## 技术栈

- TypeScript
- Obsidian Plugin API
- DeepSeek API (OpenAI 兼容)

## License

MIT