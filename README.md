# 🐾 IdeaMeow (灵感喵)
> 让小猫为你叼回散落全网的 AI 灵感，轻松拼出爆款脚本。

## 🐈 这是什么？ (What is it?)

**灵感喵 (IdeaMeow)** 是一款专为短视频创作者和重度 AI 用户打造的 **「本地优先 (Local-First) 的 AI 灵感收集与缝合工作站」**。

当你在 ChatGPT、Kimi、豆包 之间来回切屏，为了复制粘贴不同版本的脚本而焦头烂额时，不如把这些脏活累活交给小猫：
使用极轻量的浏览器插件，**小猫会把你划线选中的优质 AI 回答"叼"回它的老巢**。在无限缩放的聚合工作台上，你可以把这些散落的灵感像搭积木一样比对、拖拽，无缝拼贴成你的最终定稿。

**告别复制粘贴的繁琐，治愈你的"好点子遗漏焦虑"。**

---

## ✨ 灵感喵的核心本领 (Core Features)

- **🎣 划线即"叼走" (Snap & Catch)**
  看到 AI 给的好标题？不需要全选复制。鼠标高亮划词，点击悬浮的「🐾 喵一下」，小猫就会把这段文字连同它的 AI 来源（如 Kimi 的红标）一口叼走，存入你的后台。

- **🧶 灵感游乐场 (Infinite Canvas)**
  小猫叼回来的灵感，不会变成死板的 Word 文档，而是变成一张张散落在无限画布上的"卡片"。你可以把 GPT 的开头和 Gemini 的结尾拖到一起，并排对比，随心所欲地排兵布阵。

- **🐟 丝滑喂食缝合 (Drag & Drop Stitching)**
  画布的左侧是你的"终稿编辑器"。看到画布上满意的句子，直接用鼠标**拖拽**进左侧的编辑器里。支持富文本编辑、插入图片，还可导出 Word / Markdown。

- **✅ 护食标记，防漏检 (Anti-FOMO State)**
  最治愈的功能：一旦某张卡片上的文字被你拖进终稿，这张卡片就会在画布上**变暗（标记为已用）**。小猫帮你盯着，哪些灵感还没被"吃掉"一目了然，彻底治愈遗漏焦虑。

- **🔒 绝对本地，绝对隐私 (Local-First & Secure)**
  小猫极度护食。项目纯前端无后端，所有你抓取的商业机密、爆款灵感，仅保存在你的浏览器本地（IndexedDB），断网可用，隐私安全 100%。

---

## 🛠️ 怎么收养这只猫？ (Quick Start)

### 前置要求
- **Node.js** >= 18
- **Google Chrome** 或 **Microsoft Edge** 浏览器

### 1. 启动本地工作站

```bash
git clone https://github.com/your-username/ideameow.git
cd ideameow
npm install
npm run dev
```

打开浏览器访问 **http://localhost:3000/**。

### 2. 加载浏览器插件

1. 打开 Chrome，地址栏输入 `chrome://extensions/` 回车
2. 开启右上角 **"开发者模式" (Developer mode)**
3. 点击 **"加载已解压的扩展程序" (Load unpacked)**
4. 选择项目中的 `extension/` 文件夹

### 3. 开始叼灵感！

访问 ChatGPT、Kimi、Gemini 或 Claude，划词选中任意文本 → 点击悬浮的 **"Harvest to workspace"** → 灵感卡片自动飞入工作台画布。

---

## 🏗️ 技术栈 (Tech Stack)

| 组件 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 富文本编辑器 | Tiptap |
| 无限画布 | React Flow (xyflow) |
| 本地数据库 | Dexie.js (IndexedDB) |
| 状态管理 | Zustand |
| 样式方案 | Tailwind CSS v4 |
| 浏览器插件 | Chrome Manifest V3 |

---

## 📂 项目结构

```
ideameow/
├── extension/          # Chrome 浏览器插件
│   ├── manifest.json   # 插件配置（支持 ChatGPT/Kimi/Gemini/Claude）
│   ├── harvester.js    # 划词采集内容脚本
│   └── bridge.js       # 跨窗口存储桥接
├── src/
│   ├── components/
│   │   ├── EditorPanel.tsx    # 左侧剧本编辑器（Tiptap）
│   │   ├── CanvasPanel.tsx    # 右侧无限素材画布（React Flow）
│   │   ├── SnippetNode.tsx    # 画布上的灵感卡片节点
│   │   └── MessageListener.tsx # 插件消息监听
│   ├── store.ts        # Zustand 全局状态
│   ├── db.ts           # Dexie 本地数据库定义
│   └── App.tsx         # 主布局
└── public/
    └── logo.png        # 猫爪 Logo
```

---

## 📄 License

MIT
