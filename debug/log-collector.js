/**
 * EasyEDA Pro 扩展日志收集器
 *
 * 使用方法：
 * 1. 在 EasyEDA Pro 中打开开发者工具控制台
 * 2. 运行此脚本收集日志
 * 3. 日志将保存到本地文件
 */

// 日志收集配置
const LOG_CONFIG = {
	outputFile: 'D:\\easyeda-eext\\eext-interative-bom\\debug\\eda-console.log',
	maxLines: 1000,
	includeTimestamp: true,
};

// 保存原始 console 方法
const originalConsole = {
	log: console.log,
	warn: console.warn,
	error: console.error,
	info: console.info,
	debug: console.debug,
};

// 日志缓冲区
let logBuffer = [];

// 格式化日志
function formatLog(level, args) {
	const timestamp = LOG_CONFIG.includeTimestamp ? new Date().toISOString() : '';
	const message = args.map((arg) => {
		if (typeof arg === 'object') {
			try {
				return JSON.stringify(arg, null, 2);
			}
			catch {
				return String(arg);
			}
		}
		return String(arg);
	}).join(' ');

	return `[${timestamp}] [${level}] ${message}`;
}

// 重写 console 方法
function interceptConsole() {
	console.log = (...args) => {
		const log = formatLog('LOG', args);
		logBuffer.push(log);
		originalConsole.log.apply(console, args);
		trimBuffer();
	};

	console.warn = (...args) => {
		const log = formatLog('WARN', args);
		logBuffer.push(log);
		originalConsole.warn.apply(console, args);
		trimBuffer();
	};

	console.error = (...args) => {
		const log = formatLog('ERROR', args);
		logBuffer.push(log);
		originalConsole.error.apply(console, args);
		trimBuffer();
	};

	console.info = (...args) => {
		const log = formatLog('INFO', args);
		logBuffer.push(log);
		originalConsole.info.apply(console, args);
		trimBuffer();
	};

	console.debug = (...args) => {
		const log = formatLog('DEBUG', args);
		logBuffer.push(log);
		originalConsole.debug.apply(console, args);
		trimBuffer();
	};
}

// 修剪缓冲区
function trimBuffer() {
	while (logBuffer.length > LOG_CONFIG.maxLines) {
		logBuffer.shift();
	}
}

// 获取日志
function getLogs() {
	return logBuffer.join('\n');
}

// 清除日志
function clearLogs() {
	logBuffer = [];
	originalConsole.log('Logs cleared');
}

// 导出日志到文件（需要用户手动复制）
function exportLogs() {
	const logs = getLogs();
	originalConsole.log('=== Exported Logs Start ===');
	originalConsole.log(logs);
	originalConsole.log('=== Exported Logs End ===');
	originalConsole.log(`Total lines: ${logBuffer.length}`);
	return logs;
}

// 拦截未捕获的错误
window.addEventListener('error', (event) => {
	const log = formatLog('UNCAUGHT_ERROR', [
		event.message,
		`${event.filename}:${event.lineno}:${event.colno}`,
		event.error?.stack,
	]);
	logBuffer.push(log);
	trimBuffer();
});

// 拦截未处理的 Promise rejection
window.addEventListener('unhandledrejection', (event) => {
	const log = formatLog('UNHANDLED_REJECTION', [
		event.reason?.message || event.reason,
		event.reason?.stack,
	]);
	logBuffer.push(log);
	trimBuffer();
});

// 启动拦截
interceptConsole();

// 暴露全局函数供外部调用
window.edaLogCollector = {
	getLogs,
	clearLogs,
	exportLogs,
	getConfig: () => LOG_CONFIG,
	bufferLength: () => logBuffer.length,
};

originalConsole.log('[iBOM Log Collector] Started!');
originalConsole.log('Use window.edaLogCollector.getLogs() to get logs');
originalConsole.log('Use window.edaLogCollector.exportLogs() to export logs');
