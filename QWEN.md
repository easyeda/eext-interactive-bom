# eext-interactive-bom 项目上下文

## 项目概述

**eext-interactive-bom** 是一个为 **EasyEDA Pro**（嘉立创EDA专业版）开发的交互式 BOM（物料清单）查看器扩展。

### 主要功能

- **交互式 BOM 查看**：在弹出窗口中显示 PCB 的元件列表
- **PCB 预览**：实时预览 PCB 板，支持顶层/底层/双面视图切换
- **元件定位**：点击 BOM 列表中的元件，自动在 PCB 预览中高亮显示
- **主题切换**：支持亮色/暗色模式切换
- **过滤和排序**：支持按位号、值、封装、层进行过滤和排序
- **导出功能**：
  - 导出 CSV 格式的 BOM 文件
  - 生成并下载完整的 HTML BOM 文件
- **自动适应**：点击层切换按钮时自动调整画布尺寸

### 技术架构

```
eext-interative-bom/
├── src/
│   └── index.ts              # 扩展主入口（TypeScript）
├── iframe/
│   ├── ibom-viewer.html      # 主查看器界面
│   └── js/
│       ├── state.js          # 全局状态管理
│       ├── api.js            # PCB 数据获取 API
│       ├── bom.js            # BOM 数据处理
│       ├── render.js         # PCB 渲染逻辑
│       ├── ui.js             # UI 交互功能
│       ├── interaction.js    # 交互控制（拖拽、缩放等）
│       └── main.js           # 初始化入口
├── build/
│   └── dist/                 # 构建输出目录
├── dist/
│   └── index.js              # 编译后的扩展入口
└── extension.json            # 扩展配置文件
```

### 核心技术栈

- **后端（扩展逻辑）**：TypeScript, Node.js
- **前端（查看器界面）**：HTML5, CSS3, Vanilla JavaScript
- **构建工具**：esbuild, TypeScript
- **打包工具**：JSZip
- **API**：EasyEDA Pro API (`eda.*`)

## 构建和运行

### 环境要求

- Node.js >= 20.17.0
- npm

### 安装依赖

```bash
npm install
```

### 构建扩展

```bash
npm run build
```

构建产物位于 `build/dist/eext-interative-bom_v1.0.0.eext`

### 开发命令

| 命令 | 说明 |
|------|------|
| `npm run compile` | 编译 TypeScript 代码到 dist/ |
| `npm run build` | 编译并打包为 .eext 扩展文件 |
| `npm run lint` | 运行 ESLint 检查 |
| `npm run fix` | 自动修复 ESLint 问题 |

### 在 EasyEDA Pro 中安装

1. 打开 EasyEDA Pro
2. 进入扩展管理界面
3. 选择"从文件安装扩展"
4. 选择 `build/dist/eext-interative-bom_v1.0.0.eext`

## 开发约定

### 代码风格

- 使用 **TypeScript** 编写扩展逻辑代码
- 使用 **Vanilla JavaScript** 编写 iframe 查看器代码（避免构建复杂度）
- 遵循 ESLint 推荐规则（配置见 `eslint.config.mjs`）
- 使用 `lint-staged` 在提交前自动修复代码风格问题

### 文件组织

- **src/**: TypeScript 源代码，包含扩展入口和主要逻辑
- **iframe/**: 查看器界面文件，包含 HTML 和 JavaScript
- **iframe/js/**: 查看器的 JavaScript 模块（按功能拆分）
- **build/**: 构建脚本和输出目录

### iframe 查看器模块说明

| 文件 | 职责 |
|------|------|
| `state.js` | 全局状态管理（`window.state`） |
| `api.js` | EasyEDA API 调用（获取 PCB 数据、板框等） |
| `bom.js` | BOM 数据处理（解析、取值逻辑） |
| `render.js` | Canvas 渲染（PCB 预览、元件绘制） |
| `ui.js` | UI 交互（表格渲染、高亮、十字线等） |
| `interaction.js` | 用户交互（列宽拖动、画布缩放等） |
| `main.js` | 初始化和事件绑定 |

### 状态管理

所有状态存储在 `window.state` 对象中，包括：

- `components`: PCB 元件列表
- `bomData`: BOM 数据（聚合模式）
- `flatBomData`: BOM 数据（列表模式）
- `boardOutline`: 板框数据
- `darkMode`: 暗色模式开关
- `currentLayer`: 当前预览层（'F' | 'B' | 'FB'）
- `autoPan` / `autoZoom`: 自动平移/缩放设置
- 等等...

### EasyEDA API 使用

查看器通过 `eda.*` API 与 EasyEDA Pro 交互：

```javascript
// 检查 PCB 文档
const docInfo = await eda.dmt_SelectControl.getCurrentDocumentInfo();

// 获取 PCB 元件
const components = await eda.pcb_PrimitiveComponent.getAll();

// 获取板框
const polylines = await eda.pcb_PrimitivePolyline.getAll();

// 系统对话框
await eda.sys_Dialog.showConfirmationMessage('消息', '标题');

// 打开 iframe 窗口
await eda.sys_IFrame.openIFrame('./iframe/ibom-viewer.html', 1400, 900, id, props);
```

## 菜单结构

扩展在 EasyEDA Pro 的 PCB 编辑器菜单中提供以下功能：

```
Interactive BOM
├── 打开交互式 BOM(弹出窗口)...
├── 打开交互式 BOM(新窗口)...
├── ────────────────
├── 生成并下载 HTML...
├── ────────────────
└── 关于...
```

## 已知限制

### iframe 环境限制

- iframe 使用 `blob:` 协议，无法通过 `fetch` 加载外部 JS 文件
- 独立 HTML 导出功能需要在 EasyEDA 环境中才能完整运行
- 导出的 HTML 在浏览器中打开时，由于缺少 `eda` API，部分功能不可用

### 解决方案

- 查看器直接在 iframe 中通过 `eda.*` API 获取数据
- "生成并下载 HTML" 功能使用旧版 HTML builder 生成完整功能的文件

## 调试

### 查看日志

在 EasyEDA Pro 中打开开发者工具（F12），查看控制台日志：

- `[iBOM]`: 扩展主逻辑日志
- `[iBom]`: iframe 查看器日志

### 日志缓冲区

日志同时存储在 `window.__IBOM_LOG_BUFFER__` 中，可通过 `window.__IBOM_GET_LOGS__()` 获取。

## 相关文件

- `extension.json`: 扩展配置（菜单、资源、入口等）
- `.edaignore`: 打包时忽略的文件列表
- `tsconfig.json`: TypeScript 配置
- `eslint.config.mjs`: ESLint 配置
- `package.json`: 项目依赖和脚本
