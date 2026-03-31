# Interactive BOM for EasyEDA Pro

[中文](#中文) | [English](#english)

---

## 中文

交互式 BOM 查看器，为 嘉立创EDA/EasyEDA Pro 提供实时 PCB 预览与 BOM 联动功能。这个是参考iBOM [https://github.com/openscopeproject/InteractiveHtmlBom](https://github.com/openscopeproject/InteractiveHtmlBom) 的重新实现。功能特性会比原生的iBOM少一些。如果想使用和原生功能一致的iBOM扩展，请查看：[iBOM for EasyEDA](https://github.com/easyeda/ eext-interactive-html-bom)

### 功能特性

- ✅ 实时 PCB 预览与 BOM 表格联动
- ✅ 支持顶层/底层/双面视图切换
- ✅ 元件位号、值、封装显示
- ✅ 导线和过孔可视化
- ✅ 聚合/列表模式切换
- ✅ 导出 CSV 功能
- ✅ 暗色模式支持
- ✅ 多语言支持（中文/英文）

### 安装

1. 下载最新的 `.eext` 文件
2. 在 嘉立创EDA专业版 中打开 **高级 > 扩展 > 扩展管理器**
3. 点击 **安装本地扩展**，选择下载的文件

### 使用

1. 打开 PCB 文档
2. 点击菜单 **高级 > 交互式BOM > 打开交互式BOM**
3. 在 BOM 表格中点击行，PCB 预览会高亮对应元件

### 开发

```bash
# 安装依赖
npm install

# 编译
npm run compile

# 构建扩展包
npm run build

# 代码检查
npm run lint
```

### 许可证

Apache-2.0

---

## English

The Interactive BOM Viewer provides real-time PCB preview and BOM linkage functionality for JLCPCB/EasyEDA Pro. This is a reimplementation refered on iBOM [https://github.com/openscopeproject/InteractiveHtmlBom](https://github.com/openscopeproject/InteractiveHtmlBom). Its functional features may be less than the native iBOM. If you want to use an extension of iBOM that provides the same functionality as the native one, please refer to: [iBOM for EasyEDA](https://github.com/easyeda/eext-ibom-for-easyeda)

### Features

- ✅ Real-time PCB preview with BOM interaction
- ✅ Top/Bottom/Both layer views
- ✅ Component designators, values, and footprints
- ✅ Tracks and vias visualization
- ✅ Aggregate/List mode toggle
- ✅ CSV export
- ✅ Dark mode support
- ✅ Multi-language support (Chinese/English)

### Installation

1. Download the latest `.eext` file
2. Open **Advanced > Extensions > Extension Manager** in EasyEDA Pro
3. Click **Install Local Extension** and select the file

### Usage

1. Open a PCB document
2. Click menu **Advanced > Interactive BOM > Open Interactive BOM**
3. Click rows in BOM table to highlight components on PCB

### Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Build extension
npm run build

# Lint
npm run lint
```

### License

Apache-2.0
