import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';

// ==================== 设置接口 ====================
interface CognitivePluginSettings {
  apiBaseUrl: string;
  apiKey: string;
  modelClean: string;
  modelDenoise: string;
  outputMode: 'newFile' | 'replace' | 'sidebar';
  promptClean: string;
  promptDenoise: string;
  removeToc: boolean;      // 删除目录
  removeComments: boolean; // 删除注释
  removeIndex: boolean;
  splitByChapter: boolean; // 按章节分段处理
  maxTokens: number;
  temperature: number;
}

const DEFAULT_PROMPT_CLEAN = `你是一个专业的Markdown格式修复助手。请修复以下文本的格式问题：

## 需要处理的任务：

### 1. 换行修正
- 合并OCR错误导致的句子中间换行（非句号/逗号/分号/顿号结尾的行需要与下一行合并）
- 保留段落间的空行作为段落分隔
- 删除因PDF转Markdown产生的孤立单字行

### 2. 标题层级修复
识别并修复以下中文编号模式，正确映射到H1-H6：
- 第X章 / 第X部分 → H1
- 第X节 / X. → H2
- 一、 / （一） → H3
- （1） / ① → H4
- 1. / 1) → H5
- （一）/（二）等嵌套 → H6
- 删除重复章节编号

### 3. 垃圾清理
- 删除页眉页脚残留（如 "Ⅰ 金融工程"、页码数字）
- 删除OCR产生的乱码字符
- 删除超过2个连续空行

### 4. 格式规范化
- 统一全角/半角标点
- 修复不完整的链接或图片语法
- 保持代码块、表格的原始格式不变

## 约束
- 保留原文100%的语义内容，只修复格式
- 不添加任何解释、注释或总结
- 输出纯Markdown，不使用HTML标签
- 直接输出修复后的内容，不要输出任何解释

请修复以下文本：`;

const DEFAULT_PROMPT_DENOISE = `# Role: 高级认知降噪引擎与系统结构解析器 (CoT 强化版)

## 【核心设定】
你是一个没有情绪、绝对理性的信息过滤器。你的最终服务对象是一位深谙宏观周期、组织行为学且专注于 A 股市场的专业量化投资者与"第二大脑"构建者。你的任务是将输入的冗杂文本，视为一个待拆解的"复杂系统"，对其进行极致的"语义无损压缩"与"特征提取"。

## 【处理法则】
1. **强制思维链 (CoT) 前置：** 在给出最终的结构化总结前，必须先在 <thinking> 标签内进行逻辑推演。不经过拆解，绝不输出最终结论。
2. **拒绝字数硬约束：** 输出长度只由输入文本的"信息熵"决定。遇水则抽干，遇金则全留。
3. **执行"暴力剪枝"：** 无情剥离所有情绪宣泄、修辞手法、道德评判、车轱辘话以及大众常识。
4. **寻找"同构映射"：** 穿透表象，提取文本底层的博弈结构、权力流转、资源分配和因果链条。
5. **敬畏边界条件：** 任何结论都有适用范围。必须精准提取支撑结论成立的"约束条件"或"前置假设"。

## 【工作流与输出格式】
请严格按照以下 XML 标签结构进行输出，不可省略任何标签：

<thinking>
(在这个工作区内，请使用极其简练的语言进行自我推演与逻辑打草稿)
1. 快速扫描信噪比：这篇文本的核心是在抒发情绪，还是在进行逻辑推演？
2. 执行剪枝：识别出文中哪些部分是无效举例和陈词滥调（准备在最终输出中抛弃）。
3. 提取结构：尝试梳理出 A -> B -> C 的因果传导链条。
4. 寻找漏洞与边界：寻找作者结论成立的隐性前提，或者是否存在明显的逻辑跳跃。
</thinking>

<output>
(这是最终入库的纯净数据，必须严格遵循以下 Markdown 格式输出)

### 📌 知识元数据 (Meta-Data)
- **信息密度:** [强信号 (Alpha) / 弱信号 (Beta) / 噪音 (Noise)]
- **评估理由:** [一句话说明评级理由，直击本质]
- **核心标签:** #[概念1] #[概念2] #[概念3] (提取3-5个最高维度的抽象概念标签，便于双链索引)

### 🌳 系统逻辑树 (The Structure)
**核心断言 (Core Thesis):** > [用极其冷酷、客观的一句话，概括作者试图论证的核心命题]

**推演骨架 (Logical Branches):**
(梳理核心因果链条，剥离所有冗余举例，只留推导过程)
- 🔴 初始条件：[导致该现象或问题的最初状态/底层矛盾]
- 🔄 传导机制：[利益、权力或资源是如何在系统中流转的]
- 🎯 最终演化：[系统最终达到的稳态或爆发的危机]

### ⚙️ 变量与约束 (Variables & Constraints)
- **关键变量:** [列出影响推演结果的最核心因素/数据指标。如无，写"无"]
- **边界条件:** [作者的结论在什么约束前提下才会成立？如果脱离该条件，系统会发生什么反转？]

### 💡 逆向思考 / 结构漏洞 (Optional)
- [仅当输入文章存在明显的逻辑跳跃，或其结论存在巨大的反向套利空间时，在此指出其逻辑漏洞。若逻辑严密，则输出"无明显逻辑断层"。]

</output>

请分析以下文本：
`;

const DEFAULT_SETTINGS: CognitivePluginSettings = {
  apiBaseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  modelClean: 'deepseek-chat',
  modelDenoise: 'deepseek-reasoner',
  outputMode: 'newFile',
  promptClean: DEFAULT_PROMPT_CLEAN,
  promptDenoise: DEFAULT_PROMPT_DENOISE,
  removeToc: true,
  removeComments: true,
  removeIndex: true,
  splitByChapter: true,  // 默认开启按章节分段
  maxTokens: 32000,
  temperature: 0.3,
};

// ==================== 辅助函数：动态构建 Prompt ====================
function buildCleanPrompt(basePrompt: string, removeToc: boolean, removeComments: boolean, removeIndex: boolean): string {
  let extraInstructions = '';

  if (removeToc) {
    extraInstructions += '\n### 5. 删除目录\n- 删除所有目录 (Table of Contents)，通常以 "目录" 或 "TOC" 开头，后面跟数字编号的章节列表';
  }
  if (removeComments) {
    extraInstructions += '\n### 6. 删除注释\n- 删除所有 Markdown 注释（如 <!-- 注释内容 -->）';
  }
  if (removeIndex) {
    extraInstructions += '\n### 7. 删除索引\n- 删除索引部分（如包含 "索引"、"Index"、"参考文献目录" 等关键词的独立段落）';
  }

  if (extraInstructions) {
    return basePrompt + '\n' + extraInstructions;
  }
  return basePrompt;
}

// ==================== 行号链接转换 ====================
function convertLineRefsToWikiLinks(content: string, originalFileName: string): string {
  // 把 (原文#L行号) 转换为 [[原文件名#L行号|原文]]
  return content.replace(/\(原文#L(\d+)\)/g, `[[${originalFileName}#$1|原文]]`);
}

// ==================== 按章节拆分 ====================
interface ChapterChunk {
  title: string;      // 章节标题
  content: string;    // 章节内容
  startLine: number;  // 起始行号
}

function splitByH1(content: string): ChapterChunk[] {
  const lines = content.split('\n');
  const chunks: ChapterChunk[] = [];
  let currentChapter: ChapterChunk | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // 检测 H1 标题 (以 # 开头，后面是空格)
    const h1Match = line.match(/^#\s+(.+)$/);

    if (h1Match) {
      // 保存上一章
      if (currentChapter) {
        currentChapter.content = currentChapter.content.trim();
        if (currentChapter.content) {
          chunks.push(currentChapter);
        }
      }

      // 开始新章节
      currentChapter = {
        title: h1Match[1].trim(),
        content: line + '\n',
        startLine: lineNum
      };
    } else if (currentChapter) {
      currentChapter.content += line + '\n';
    } else {
      // 没有章节标题的内容（可能是前言之类的），作为第一章
      if (!currentChapter) {
        currentChapter = {
          title: '前言/序章',
          content: line + '\n',
          startLine: lineNum
        };
      }
    }
  }

  // 保存最后一章
  if (currentChapter) {
    currentChapter.content = currentChapter.content.trim();
    if (currentChapter.content) {
      chunks.push(currentChapter);
    }
  }

  return chunks;
}

// ==================== DeepSeek API 调用 ====================
async function callDeepSeek(
  apiBaseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string,
  onChunk?: (chunk: string) => void,
  maxTokens: number = 32000,
  temperature: number = 0.3
): Promise<string> {
  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: !!onChunk,
      temperature: temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API调用失败: ${response.status} - ${errorText}`);
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || '';
            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }

    return fullContent;
  } else {
    const json = await response.json();
    return json.choices?.[0]?.message?.content || '';
  }
}

// ==================== 处理模式选择 Modal ====================
class ProcessModal extends Modal {
  private plugin: CognitiveNoiseReducerPlugin;
  private content: string;
  private file: TFile | null;

  constructor(app: App, plugin: CognitiveNoiseReducerPlugin, content: string, file: TFile | null) {
    super(app);
    this.plugin = plugin;
    this.content = content;
    this.file = file;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl('h2', { text: '选择处理模式' });

    const btnContainer = contentEl.createDiv({ cls: 'button-container' });
    btnContainer.style.display = 'flex';
    btnContainer.style.flexDirection = 'column';
    btnContainer.style.gap = '10px';
    btnContainer.style.marginTop = '20px';

    // 精度修复按钮
    const cleanBtn = btnContainer.createEl('button', { text: '📝 精度修复 (换行+标题)' });
    cleanBtn.style.padding = '15px';
    cleanBtn.style.fontSize = '16px';
    cleanBtn.onclick = () => {
      this.close();
      this.processContent('clean');
    };

    // 认知降噪按钮
    const denoiseBtn = btnContainer.createEl('button', { text: '🧠 认知降噪' });
    denoiseBtn.style.padding = '15px';
    denoiseBtn.style.fontSize = '16px';
    denoiseBtn.onclick = () => {
      this.close();
      this.processContent('denoise');
    };

    // 全流程按钮
    const fullBtn = btnContainer.createEl('button', { text: '⚡ 全流程 (精度+降噪)' });
    fullBtn.style.padding = '15px';
    fullBtn.style.fontSize = '16px';
    fullBtn.style.backgroundColor = 'var(--text-accent-hover)';
    fullBtn.onclick = () => {
      this.close();
      this.processContent('full');
    };
  }

  async processContent(mode: 'clean' | 'denoise' | 'full') {
    const settings = this.plugin.settings;
    const file = this.file;
    const content = this.content;

    if (!settings.apiKey) {
      new Notice('请先在设置中配置 API Key');
      this.plugin.openSettings();
      return;
    }

    try {
      if (mode === 'clean' || mode === 'full') {
        new Notice('🔄 开始精度修复...');
        const dynamicPrompt = buildCleanPrompt(
          settings.promptClean,
          settings.removeToc,
          settings.removeComments,
          settings.removeIndex
        );
        const cleaned = await callDeepSeek(
          settings.apiBaseUrl,
          settings.apiKey,
          settings.modelClean,
          dynamicPrompt,
          content,
          undefined,
          settings.maxTokens,
          settings.temperature
        );

        await this.saveOutput(cleaned, file, '_clean');
        new Notice('✅ 精度修复完成');

        if (mode === 'full') {
          // 继续认知降噪
          new Notice('🧠 开始认知降噪...');
          const denoised = await callDeepSeek(
            settings.apiBaseUrl,
            settings.apiKey,
            settings.modelDenoise,
            settings.promptDenoise,
            cleaned,
            undefined,
            settings.maxTokens,
            settings.temperature
          );

          await this.saveOutput(denoised, file, '_analysis');
          new Notice('✅ 认知降噪完成');
        }
      } else if (mode === 'denoise') {
        new Notice('🧠 开始认知降噪...');
        const denoised = await callDeepSeek(
          settings.apiBaseUrl,
          settings.apiKey,
          settings.modelDenoise,
          settings.promptDenoise,
          content,
          undefined,
          settings.maxTokens,
          settings.temperature
        );

        await this.saveOutput(denoised, file, '_analysis');
        new Notice('✅ 认知降噪完成');
      }
    } catch (error) {
      new Notice(`❌ 处理失败: ${error.message}`);
      console.error(error);
    }
  }

  async saveOutput(content: string, originalFile: TFile | null, suffix: string): Promise<void> {
    if (!originalFile) {
      // 没有源文件，创建新笔记
      const newFileName = `处理结果_${Date.now()}.md`;
      await this.app.vault.create(newFileName, content);
      const newFile = this.app.vault.getAbstractFileByPath(newFileName);
      if (newFile instanceof TFile) {
        await this.app.workspace.getLeaf().openFile(newFile);
      }
      return;
    }

    const settings = this.plugin.settings;
    const ext = originalFile.extension;
    const baseName = originalFile.basename;
    const dir = originalFile.parent?.path || '';

    // 转换行号引用为 wiki 链接
    const processedContent = convertLineRefsToWikiLinks(content, originalFile.name);

    if (settings.outputMode === 'replace') {
      // 替换前确认并备份
      const confirmed = confirm('⚠️ 确定要替换原文吗？此操作不可恢复，建议先手动备份。');
      if (!confirmed) {
        new Notice('已取消替换');
        return;
      }
      // 先创建备份
      const backupPath = `${dir}/${baseName}_backup_${Date.now()}.${ext}`;
      await this.app.vault.create(backupPath, await this.app.vault.read(originalFile));
      await this.app.vault.modify(originalFile, processedContent);
      new Notice(`✅ 已替换并备份到 ${baseName}_backup_*.md`);
    } else if (settings.outputMode === 'newFile') {
      const newPath = `${dir}/${baseName}${suffix}.${ext}`;
      await this.app.vault.create(newPath, processedContent);
      const newFile = this.app.vault.getAbstractFileByPath(newPath);
      if (newFile instanceof TFile) {
        await this.app.workspace.getLeaf().openFile(newFile);
      }
    } else {
      // sidebar模式 - 在侧边栏显示
      const panel = this.app.workspace.getLeaf('right');
      const newFile = await this.app.vault.create(`${baseName}${suffix}.${ext}`, processedContent);
      if (newFile instanceof TFile) {
        await panel.openFile(newFile);
      }
    }
  }
}

// ==================== 设置面板 ====================
class CognitiveSettingTab extends PluginSettingTab {
  plugin: CognitiveNoiseReducerPlugin;

  constructor(app: App, plugin: CognitiveNoiseReducerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Cognitive Noise Reducer 设置' });

    // 隐私声明
    containerEl.createEl('div', {
      cls: 'setting-item-description',
      html: '<span style="color: #e67e22;">⚠️ 隐私提示：</span> 您的笔记内容将被发送到 DeepSeek API 进行处理，请确保您信任该服务。API Key 仅本地存储，不会发送给任何第三方。'
    });

    // API 配置
    new Setting(containerEl)
      .setName('API Base URL')
      .setDesc('DeepSeek API 地址')
      .addText(text => text
        .setPlaceholder('https://api.deepseek.com/v1')
        .setValue(this.plugin.settings.apiBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.apiBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('DeepSeek API Key（仅本地存储，不会发送到任何第三方服务器）')
      .addText(text => text
        .setPlaceholder('sk-xxx')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    // 模型选择
    new Setting(containerEl)
      .setName('精度修复模型')
      .setDesc('用于换行修正和标题优化的模型')
      .addText(text => text
        .setPlaceholder('deepseek-chat')
        .setValue(this.plugin.settings.modelClean)
        .onChange(async (value) => {
          this.plugin.settings.modelClean = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('认知降噪模型')
      .setDesc('用于结构化分析的模型（推荐使用reasoner）')
      .addText(text => text
        .setPlaceholder('deepseek-reasoner')
        .setValue(this.plugin.settings.modelDenoise)
        .onChange(async (value) => {
          this.plugin.settings.modelDenoise = value;
          await this.plugin.saveSettings();
        }));

    // 输出模式
    new Setting(containerEl)
      .setName('输出模式')
      .setDesc('处理结果保存方式')
      .addDropdown(dropdown => dropdown
        .addOption('newFile', '新建文件')
        .addOption('replace', '替换原文')
        .addOption('sidebar', '侧边栏打开')
        .setValue(this.plugin.settings.outputMode)
        .onChange(async (value) => {
          this.plugin.settings.outputMode = value as 'newFile' | 'replace' | 'sidebar';
          await this.plugin.saveSettings();
        }));

    // 删除选项
    containerEl.createEl('h3', { text: '清理选项' });

    new Setting(containerEl)
      .setName('删除目录 (TOC)')
      .setDesc('删除 Markdown 中的目录')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.removeToc)
        .onChange(async (value) => {
          this.plugin.settings.removeToc = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('删除注释')
      .setDesc('删除 Markdown 注释（如 <!-- 注释 -->）')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.removeComments)
        .onChange(async (value) => {
          this.plugin.settings.removeComments = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('删除索引')
      .setDesc('删除索引部分（如 "索引"、"Index" 段落）')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.removeIndex)
        .onChange(async (value) => {
          this.plugin.settings.removeIndex = value;
          await this.plugin.saveSettings();
        }));

    // 分段处理选项
    containerEl.createEl('h3', { text: '处理模式' });

    new Setting(containerEl)
      .setName('按章节分段处理')
      .setDesc('按 H1 标题拆分内容，逐章处理后合并。适合大部头书籍，避免超限截断')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.splitByChapter)
        .onChange(async (value) => {
          this.plugin.settings.splitByChapter = value;
          await this.plugin.saveSettings();
        }));

    // API 参数
    containerEl.createEl('h3', { text: 'API 参数' });

    new Setting(containerEl)
      .setName('Max Tokens')
      .setDesc('API 响应的最大 token 数')
      .addText(text => text
        .setPlaceholder('32000')
        .setValue(String(this.plugin.settings.maxTokens))
        .onChange(async (value) => {
          this.plugin.settings.maxTokens = parseInt(value) || 32000;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Temperature')
      .setDesc('生成随机性（0-1，越高越随机）')
      .addText(text => text
        .setPlaceholder('0.3')
        .setValue(String(this.plugin.settings.temperature))
        .onChange(async (value) => {
          this.plugin.settings.temperature = parseFloat(value) || 0.3;
          await this.plugin.saveSettings();
        }));

    // 自定义 Prompt 区域
    containerEl.createEl('h3', { text: '自定义 Prompt' });

    // 精度修复 Prompt
    new Setting(containerEl)
      .setName('精度修复 Prompt')
      .setDesc('用于修复换行和标题的 prompt')
      .addTextArea(text => {
        text.setPlaceholder('输入 prompt...');
        text.setValue(this.plugin.settings.promptClean);
        text.onChange(async (value) => {
          this.plugin.settings.promptClean = value;
          await this.plugin.saveSettings();
        });
      });

    // 认知降噪 Prompt
    new Setting(containerEl)
      .setName('认知降噪 Prompt')
      .setDesc('用于结构化分析的 prompt')
      .addTextArea(text => {
        text.setPlaceholder('输入 prompt...');
        text.setValue(this.plugin.settings.promptDenoise);
        text.onChange(async (value) => {
          this.plugin.settings.promptDenoise = value;
          await this.plugin.saveSettings();
        });
      });

    // 重置按钮
    new Setting(containerEl)
      .setName('重置 Prompt')
      .setDesc('恢复默认 prompt')
      .addButton(button => {
        button.setButtonText('恢复默认');
        button.onClick(async () => {
          this.plugin.settings.promptClean = DEFAULT_PROMPT_CLEAN;
          this.plugin.settings.promptDenoise = DEFAULT_PROMPT_DENOISE;
          await this.plugin.saveSettings();
          this.display();
        });
      });
  }
}

// ==================== 主插件类 ====================
export default class CognitiveNoiseReducerPlugin extends Plugin {
  settings: CognitivePluginSettings = DEFAULT_SETTINGS;

  async onload() {
    console.log('Loading Cognitive Noise Reducer plugin...');

    // 加载设置
    await this.loadSettings();

    // 注册设置面板
    this.addSettingTab(new CognitiveSettingTab(this.app, this));

    // 添加 Ribbon 图标
    this.addRibbonIcon('brain', 'Cognitive Noise Reducer', () => {
      this.triggerProcess();
    });

    // 添加命令
    this.addCommand({
      id: 'process-current-file',
      name: '处理当前笔记',
      callback: () => {
        this.triggerProcess();
      },
    });

    this.addCommand({
      id: 'clean-only',
      name: '仅精度修复',
      callback: () => {
        this.triggerProcess('clean');
      },
    });

    this.addCommand({
      id: 'denoise-only',
      name: '仅认知降噪',
      callback: () => {
        this.triggerProcess('denoise');
      },
    });
  }

  async onunload() {
    console.log('Unloading Cognitive Noise Reducer plugin...');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  triggerProcess(mode?: 'clean' | 'denoise' | 'full') {
    const activeLeaf = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeLeaf) {
      new Notice('请先打开一个 Markdown 文件');
      return;
    }

    const editor = activeLeaf.editor;
    const content = editor.getValue();
    const file = activeLeaf.file;

    if (!content || content.trim().length === 0) {
      new Notice('当前文件内容为空');
      return;
    }

    if (mode) {
      // 直接执行指定模式
      this.executeMode(mode, content, file);
    } else {
      // 弹出模式选择
      new ProcessModal(this.app, this, content, file).open();
    }
  }

  async executeMode(mode: 'clean' | 'denoise' | 'full', content: string, file: TFile | null) {
    if (!this.settings.apiKey) {
      new Notice('请先在设置中配置 API Key');
      this.openSettings();
      return;
    }

    const useChunking = this.settings.splitByChapter;
    const chunks = useChunking ? splitByH1(content) : null;
    const totalChunks = chunks ? chunks.length : 1;

    try {
      if (mode === 'clean' || mode === 'full') {
        // 精度修复阶段
        let cleanedContent: string;

        if (useChunking && chunks && chunks.length > 1) {
          // 分段处理
          new Notice(`🔄 开始精度修复（${chunks.length}个章节）...`);
          const cleanedChunks: string[] = [];

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            new Notice(`  处理章节 ${i+1}/${chunks.length}: ${chunk.title}`);

            const dynamicPrompt = buildCleanPrompt(
              this.settings.promptClean,
              this.settings.removeToc,
              this.settings.removeComments,
              this.settings.removeIndex
            );

            const cleaned = await callDeepSeek(
              this.settings.apiBaseUrl,
              this.settings.apiKey,
              this.settings.modelClean,
              dynamicPrompt,
              chunk.content,
              undefined,
              this.settings.maxTokens,
              this.settings.temperature
            );

            cleanedChunks.push(`## ${chunk.title}\n\n${cleaned}`);
          }

          cleanedContent = cleanedChunks.join('\n\n---\n\n');
        } else {
          // 整体处理
          new Notice('🔄 开始精度修复...');
          const dynamicPrompt = buildCleanPrompt(
            this.settings.promptClean,
            this.settings.removeToc,
            this.settings.removeComments,
            this.settings.removeIndex
          );

          cleanedContent = await callDeepSeek(
            this.settings.apiBaseUrl,
            this.settings.apiKey,
            this.settings.modelClean,
            dynamicPrompt,
            content,
            undefined,
            this.settings.maxTokens,
            this.settings.temperature
          );
        }

        await this.saveOutput(cleanedContent, file, '_clean');
        new Notice('✅ 精度修复完成');

        // 降噪阶段
        if (mode === 'full') {
          if (useChunking && chunks && chunks.length > 1) {
            // 对每个已精读的章节分别降噪
            new Notice(`🧠 开始认知降噪（${chunks.length}个章节）...`);
            const denoisedChunks: string[] = [];

            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              new Notice(`  降噪章节 ${i+1}/${chunks.length}: ${chunk.title}`);

              // 重新拆分精读后的内容（因为 AI 可能改变了格式）
              const cleanedChunk = await this.extractChapterFromResult(cleanedContent, chunk.title);

              const denoised = await callDeepSeek(
                this.settings.apiBaseUrl,
                this.settings.apiKey,
                this.settings.modelDenoise,
                this.settings.promptDenoise,
                cleanedChunk,
                undefined,
                this.settings.maxTokens,
                this.settings.temperature
              );

              denoisedChunks.push(`## ${chunk.title}\n\n${denoised}`);
            }

            const denoisedContent = denoisedChunks.join('\n\n---\n\n');
            await this.saveOutput(denoisedContent, file, '_analysis');
          } else {
            new Notice('🧠 开始认知降噪...');
            const denoised = await callDeepSeek(
              this.settings.apiBaseUrl,
              this.settings.apiKey,
              this.settings.modelDenoise,
              this.settings.promptDenoise,
              cleanedContent,
              undefined,
              this.settings.maxTokens,
              this.settings.temperature
            );

            await this.saveOutput(denoised, file, '_analysis');
          }
          new Notice('✅ 认知降噪完成');
        }
      } else if (mode === 'denoise') {
        // 仅降噪模式
        if (useChunking && chunks && chunks.length > 1) {
          new Notice(`🧠 开始认知降噪（${chunks.length}个章节）...`);
          const denoisedChunks: string[] = [];

          for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            new Notice(`  处理章节 ${i+1}/${chunks.length}: ${chunk.title}`);

            const denoised = await callDeepSeek(
              this.settings.apiBaseUrl,
              this.settings.apiKey,
              this.settings.modelDenoise,
              this.settings.promptDenoise,
              chunk.content,
              undefined,
              this.settings.maxTokens,
              this.settings.temperature
            );

            denoisedChunks.push(`## ${chunk.title}\n\n${denoised}`);
          }

          const denoisedContent = denoisedChunks.join('\n\n---\n\n');
          await this.saveOutput(denoisedContent, file, '_analysis');
        } else {
          new Notice('🧠 开始认知降噪...');
          const denoised = await callDeepSeek(
            this.settings.apiBaseUrl,
            this.settings.apiKey,
            this.settings.modelDenoise,
            this.settings.promptDenoise,
            content,
            undefined,
            this.settings.maxTokens,
            this.settings.temperature
          );

          await this.saveOutput(denoised, file, '_analysis');
        }
        new Notice('✅ 认知降噪完成');
      }
    } catch (error) {
      new Notice(`❌ 处理失败: ${error.message}`);
      console.error(error);
    }
  }

  // 从合并结果中提取指定章节的内容
  async extractChapterFromResult(fullContent: string, chapterTitle: string): Promise<string> {
    // 简单实现：查找章节标题到下一个章节标题之间的内容
    // 实际使用时，AI 输出的章节标题应该与输入一致
    const lines = fullContent.split('\n');
    let inTargetChapter = false;
    const chapterLines: string[] = [];

    for (const line of lines) {
      // 检测章节标题（## 标题）
      const match = line.match(/^##\s+(.+)$/);
      if (match) {
        if (inTargetChapter) {
          // 遇到下一个章节，停止
          break;
        }
        if (match[1].trim() === chapterTitle) {
          inTargetChapter = true;
          chapterLines.push(line);
        }
      } else if (inTargetChapter) {
        chapterLines.push(line);
      }
    }

    return chapterLines.join('\n').trim() || fullContent;
  }

  async saveOutput(content: string, originalFile: TFile | null, suffix: string): Promise<void> {
    if (!originalFile) {
      const newFileName = `处理结果_${Date.now()}.md`;
      await this.app.vault.create(newFileName, content);
      const newFile = this.app.vault.getAbstractFileByPath(newFileName);
      if (newFile instanceof TFile) {
        await this.app.workspace.getLeaf().openFile(newFile);
      }
      return;
    }

    const ext = originalFile.extension;
    const baseName = originalFile.basename;
    const dir = originalFile.parent?.path || '';

    // 转换行号引用为 wiki 链接
    const processedContent = convertLineRefsToWikiLinks(content, originalFile.name);

    if (this.settings.outputMode === 'replace') {
      // 替换前确认并备份
      const confirmed = confirm('⚠️ 确定要替换原文吗？此操作不可恢复，建议先手动备份。');
      if (!confirmed) {
        new Notice('已取消替换');
        return;
      }
      // 先创建备份
      const backupPath = `${dir}/${baseName}_backup_${Date.now()}.${ext}`;
      await this.app.vault.create(backupPath, await this.app.vault.read(originalFile));
      await this.app.vault.modify(originalFile, processedContent);
      new Notice(`✅ 已替换并备份到 ${baseName}_backup_*.md`);
    } else if (this.settings.outputMode === 'newFile') {
      const newPath = `${dir}/${baseName}${suffix}.${ext}`;
      await this.app.vault.create(newPath, processedContent);
      const newFile = this.app.vault.getAbstractFileByPath(newPath);
      if (newFile instanceof TFile) {
        await this.app.workspace.getLeaf().openFile(newFile);
      }
    } else {
      const panel = this.app.workspace.getLeaf('right');
      const newFile = await this.app.vault.create(`${baseName}${suffix}.${ext}`, processedContent);
      if (newFile instanceof TFile) {
        await panel.openFile(newFile);
      }
    }
  }
}