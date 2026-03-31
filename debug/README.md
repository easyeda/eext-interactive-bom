# EasyEDA Pro iBOM 扩展调试指南

## 目录
1. [桥接服务器设置](#桥接服务器设置)
2. [日志收集](#日志收集)
3. [调试步骤](#调试步骤)
4. [常见问题](#常见问题)

---

## 桥接服务器设置

### 1. 安装 run-api-gateway 扩展

在 EasyEDA Pro 中安装 API 网关扩展：
- 下载地址：https://ext.lceda.cn/item/oshwhub/run-api-gateway
- 安装后会自动建立 WebSocket 连接

### 2. 启动桥接服务器

```bash
# 在后台启动桥接服务器
node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
```

**重要**: 桥接服务器必须在后台运行，不要在前台运行，否则 AI 会阻塞等待服务器退出。

### 3. 验证连接

运行检查脚本：
```bash
cd D:\easyeda-eext\eext-interative-bom\debug
check-bridge.bat
```

或手动检查：
```bash
# 检查健康状态
curl http://localhost:49620/health

# 查看已连接的 EDA 窗口
curl http://localhost:49620/eda-windows
```

预期响应：
```json
{
	"windows": [
		{ "windowId": "abc-123", "connected": true, "active": true }
	],
	"activeWindowId": "abc-123",
	"count": 1
}
```

---

## 日志收集

### 方法 1: 使用日志收集器脚本

在 EasyEDA Pro 的开发者工具控制台中运行：

```javascript
// 复制并粘贴 debug/log-collector.js 的内容到控制台
// 或者加载远程脚本
const script = document.createElement('script');
script.src = 'file:///D:/easyeda-eext/eext-interative-bom/debug/log-collector.js';
document.head.appendChild(script);
```

然后使用以下命令：
```javascript
// 获取日志
window.edaLogCollector.getLogs();

// 导出日志
window.edaLogCollector.exportLogs();

// 清除日志
window.edaLogCollector.clearLogs();

// 查看缓冲区长度
window.edaLogCollector.bufferLength();
```

### 方法 2: 使用执行 API 获取日志

```bash
# 执行代码并获取 console.log 输出
curl -X POST http://localhost:49620/execute \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"console.log('[iBOM] Test log'); return 'done';\"}"
```

### 方法 3: 手动复制控制台日志

1. 在 EasyEDA Pro 中按 `F12` 打开开发者工具
2. 切换到 Console 标签
3. 右键点击日志区域 → 保存为...

---

## 调试步骤

### 步骤 1: 启动桥接服务器

```bash
# 后台启动
start /B node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
sleep 2
```

### 步骤 2: 验证连接

```bash
cd D:\easyeda-eext\eext-interative-bom\debug
check-bridge.bat
```

### 步骤 3: 加载扩展

1. 在 EasyEDA Pro 中打开扩展管理器
2. 点击"加载扩展"
3. 选择 `D:\easyeda-eext\eext-interative-bom\build\dist\eext-interative-bom_v1.0.0.eext`

### 步骤 4: 打开开发者工具

在 EasyEDA Pro 中按 `F12` 打开开发者工具控制台

### 步骤 5: 加载日志收集器（可选）

在控制台运行：
```javascript
// 粘贴 log-collector.js 的内容
```

### 步骤 6: 测试扩展

点击菜单：`Interactive BOM` → `打开交互式 BOM...`

### 步骤 7: 查看日志

在控制台中查看日志，或运行：
```javascript
window.edaLogCollector.exportLogs();
```

### 步骤 8: 执行测试代码

```bash
cd D:\easyeda-eext\eext-interative-bom\debug
test-eda.bat
```

---

## 常见问题

### 问题 1: 桥接服务器未启动

**症状**: `check-bridge.bat` 显示 "No bridge server found"

**解决**:
```bash
node C:\Users\AOC\.qwen\skills\easyeda-api\scripts\bridge-server.mjs
```

### 问题 2: 没有 EDA 窗口连接

**症状**: `/eda-windows` 返回 `count: 0`

**解决**:
1. 确保 run-api-gateway.eext 已安装
2. 重启 EasyEDA Pro
3. 检查扩展是否加载

### 问题 3: 扩展加载后菜单不显示

**解决**:
1. 检查 extension.json 配置
2. 重启 EasyEDA Pro
3. 查看控制台是否有错误

### 问题 4: 点击菜单后没有反应

**解决**:
1. 打开开发者工具控制台
2. 查看错误信息
3. 运行以下代码检查文档类型：
```javascript
await eda.dmt_SelectControl.getCurrentDocumentInfo();
```

---

## 快速参考命令

### 检查桥接状态
```bash
curl http://localhost:49620/health
curl http://localhost:49620/eda-windows
```

### 执行代码
```bash
curl -X POST http://localhost:49620/execute \
  -H "Content-Type: application/json" \
  -d "{\"code\": \"return await eda.dmt_Project.getCurrentProjectInfo();\"}"
```

### 选择窗口
```bash
curl -X POST http://localhost:49620/eda-windows/select \
  -H "Content-Type: application/json" \
  -d "{\"windowId\": \"abc-123\"}"
```

### 获取日志
```javascript
// 在 EasyEDA 控制台中
window.edaLogCollector.getLogs();
window.edaLogCollector.exportLogs();
```

---

## 联系支持

如有问题，请提供：
1. 控制台完整日志
2. 桥接服务器状态
3. EasyEDA Pro 版本信息
