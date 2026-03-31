# EasyEDA Pro iBOM 扩展 - 调试设置完成

## ✅ 已完成的设置

### 1. 桥接服务器通信

已配置通过 easyeda-api skill 的桥接服务器与 EasyEDA Pro 通信：

- **桥接端口**: 49620-49629（自动选择）
- **通信协议**: WebSocket + HTTP
- **扩展**: run-api-gateway.eext（需要单独安装）

### 2. 日志收集功能

扩展现在包含以下日志功能：

#### 2.1 内置日志缓冲
```javascript
// 在 EasyEDA 控制台中访问
window.__IBOM_GET_LOGS__(); // 获取所有日志
window.__IBOM_LOG_BUFFER__; // 日志缓冲区数组
```

#### 2.2 日志收集器脚本
位置：`debug/log-collector.js`

在 EasyEDA 控制台中运行：
```javascript
// 复制并粘贴 log-collector.js 的内容
window.edaLogCollector.getLogs(); // 获取日志
window.edaLogCollector.exportLogs(); // 导出日志
window.edaLogCollector.clearLogs(); // 清除日志
```

### 3. 调试脚本

所有调试脚本位于 `debug/` 目录：

| 脚本 | 用途 |
|------|------|
| `start-debug.bat` | 一键启动调试环境 |
| `check-bridge.bat` | 检查桥接服务器状态 |
| `test-eda.bat` | 执行测试代码 |
| `log-collector.js` | 日志收集器 |

---

## 🚀 快速开始

### 方法 1: 一键启动（推荐）

```bash
cd D:\easyeda-eext\eext-interative-bom\debug
start-debug.bat
```

### 方法 2: 手动步骤

#### 1. 启动桥接服务器
```bash
# 后台启动
start /B node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
sleep 2
```

#### 2. 验证连接
```bash
curl http://localhost:49620/health
curl http://localhost:49620/eda-windows
```

#### 3. 加载扩展
在 EasyEDA Pro 中：
1. 打开扩展管理器
2. 加载 `build/dist/eext-interative-bom_v1.0.0.eext`

#### 4. 打开开发者工具
按 `F12` 打开控制台

#### 5. 测试扩展
点击菜单：`Interactive BOM` → `打开交互式 BOM...`

#### 6. 查看日志
在控制台中查看，或运行：
```javascript
window.__IBOM_GET_LOGS__();
```

---

## 📡 通过桥接服务器获取日志

### 执行代码并获取日志

```bash
# 设置端口（根据实际情况调整）
set BRIDGE_PORT=49620

# 执行测试代码
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"console.log('[iBOM] Test'); return 'done';\"}"

# 获取项目信息
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"return await eda.dmt_Project.getCurrentProjectInfo();\"}"

# 检查当前文档
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"return await eda.dmt_SelectControl.getCurrentDocumentInfo();\"}"

# 获取 PCB 器件数量
curl -X POST http://localhost:%BRIDGE_PORT%/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"const c = await eda.pcb_PrimitiveComponent.getAll(); return c.length;\"}"
```

### 选择特定窗口

如果有多个 EasyEDA 窗口：

```bash
# 列出所有窗口
curl http://localhost:%BRIDGE_PORT%/eda-windows

# 选择窗口
curl -X POST http://localhost:%BRIDGE_PORT%/eda-windows/select ^
  -H "Content-Type: application/json" ^
  -d "{\"windowId\": \"abc-123\"}"
```

---

## 🔍 调试检查清单

### 启动前检查
- [ ] Node.js 已安装 (`node --version`)
- [ ] run-api-gateway.eext 已安装
- [ ] EasyEDA Pro 已启动且有 PCB 文档打开

### 启动后检查
- [ ] 桥接服务器运行在 49620-49629 端口
- [ ] `/eda-windows` 返回至少 1 个窗口
- [ ] 扩展已加载（菜单可见）

### 测试扩展
- [ ] 点击菜单无错误
- [ ] 控制台显示 `[iBOM]` 前缀的日志
- [ ] IFrame 窗口打开
- [ ] 可以访问 `window.__IBOM_GET_LOGS__()`

---

## 📋 下次运行时的步骤

### 1. 启动桥接服务器
```bash
cd D:\easyeda-eext\eext-interative-bom\debug
start-debug.bat
```

### 2. 在 EasyEDA Pro 中重新加载扩展
- 扩展管理器 → 卸载旧版本
- 加载 `build/dist/eext-interative-bom_v1.0.0.eext`

### 3. 执行测试并获取日志
```bash
# 使用测试脚本
cd debug
test-eda.bat

# 或手动执行
curl -X POST http://localhost:49620/execute ^
  -H "Content-Type: application/json" ^
  -d "{\"code\": \"return window.__IBOM_GET_LOGS__();\"}"
```

### 4. 分析日志
将日志复制到聊天中进行分析。

---

## 🛠️ 故障排除

### 问题：桥接服务器无法启动
```bash
# 检查端口占用
netstat -ano | findstr "49620"

# 手动启动
node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
```

### 问题：没有 EDA 窗口连接
1. 确保 run-api-gateway.eext 已安装
2. 重启 EasyEDA Pro
3. 检查扩展是否加载

### 问题：扩展加载后菜单不显示
1. 检查 `extension.json` 配置
2. 查看控制台错误
3. 重启 EasyEDA Pro

### 问题：点击菜单后提示错误
1. 打开开发者工具（F12）
2. 查看控制台错误信息
3. 运行以下命令检查文档：
```javascript
await eda.dmt_SelectControl.getCurrentDocumentInfo();
```

---

## 📞 获取帮助

如遇问题，请提供：
1. 运行 `debug/check-bridge.bat` 的输出
2. EasyEDA 控制台日志（使用 `window.__IBOM_GET_LOGS__()` 获取）
3. 桥接服务器 `/eda-windows` 的响应
4. 具体的错误信息

---

## 📚 相关文档

- [debug/README.md](./README.md) - 详细调试指南
- [easyeda-api skill](C:\Users\AOC\.qwen\skills\easyeda-api\SKILL.md) - API 文档
- [extension.json](../extension.json) - 扩展配置
