/**
 * Interactive BOM for EasyEDA Pro
 *
 * 注意：此扩展现在使用 iframe/ibom-viewer.html 作为主界面
 * 所有功能都在 iframe 中通过 eda API 直接实现
 */

// 日志缓冲区
const logBuffer: string[] = [];

// 内嵌翻译数据
const embeddedTranslations: Record<string, Record<string, string>> = {
	'zh-Hans': {
		'InteractiveBOM': '交互式 BOM',
		'About': '关于',
		'Error': '错误',
		'PCBDataNotFound': '无法获取 PCB 数据，请确保当前处于 PCB 编辑器中',
		'GeneratingHTML': '正在生成 HTML...',
	},
	'en': {
		'InteractiveBOM': 'Interactive BOM',
		'About': 'About',
		'Error': 'Error',
		'PCBDataNotFound': 'Cannot get PCB data, please make sure you are in PCB editor',
		'GeneratingHTML': 'Generating HTML...',
	},
};

// 翻译数据缓存
let translations: Record<string, string> = {};
let translationsLoaded = false;

/**
 * 加载翻译数据
 */
async function loadTranslations(): Promise<void> {
	if (translationsLoaded)
		return;

	try {
		// 获取当前语言
		let lang = 'zh-Hans';
		// @ts-expect-error - sys_I18n 可能不存在
		if (eda.sys_I18n && typeof eda.sys_I18n.getCurrentLanguage === 'function') {
			lang = await eda.sys_I18n.getCurrentLanguage();
			console.log('[iBOM] Current language:', lang);
		}

		// 使用内嵌的翻译数据
		translations = embeddedTranslations[lang] || embeddedTranslations['zh-Hans'];
		console.log('[iBOM] Translations loaded:', Object.keys(translations).length, 'keys');
		translationsLoaded = true;
	}
	catch (e) {
		console.error('[iBOM] Load translations failed:', e);
		// 使用默认翻译
		translations = embeddedTranslations['zh-Hans'];
		translationsLoaded = true;
	}
}

/**
 * 获取翻译文本
 */
async function t(key: string): Promise<string> {
	await loadTranslations();
	return translations[key] || key;
}

/**
 * 激活扩展
 */
export function activate(): void {
	// console.log('[iBOM] Extension activated');
	logBuffer.push('[LOG] Extension activated');
}

/**
 * 显示交互式 BOM（弹出窗口模式）
 */
export function showInteractiveBomPopup(): Promise<void> {
	return showInteractiveBom('popup');
}

/**
 * 显示交互式 BOM（新窗口模式）
 */
export function showInteractiveBomWindow(): Promise<void> {
	return showInteractiveBom('window');
}

/**
 * 显示交互式 BOM
 */
async function showInteractiveBom(mode: 'popup' | 'window' = 'popup'): Promise<void> {
	try {
		// 检查当前是否为 PCB 文档
		const isPcbDoc = await checkPcbDocumentActive();

		if (!isPcbDoc) {
			const msg = await t('PCBDataNotFound');
			const title = await t('Error');
			await eda.sys_Dialog.showConfirmationMessage(msg, title);
			return;
		}

		const htmlFilePath = './iframe/ibom-viewer.html';

		if (mode === 'popup') {
			// 打开 IFrame 弹出窗口
			const iframeId = `ibom-${Date.now()}`;
			const title = await t('InteractiveBOM');

			// @ts-expect-error - sys_IFrame 可能不存在
			if (eda.sys_IFrame && typeof eda.sys_IFrame.openIFrame === 'function') {
				await eda.sys_IFrame.openIFrame(
					htmlFilePath,
					1400,
					900,
					iframeId,
					{
						title,
						maximizeButton: true,
						minimizeButton: true,
						grayscaleMask: true,
					},
				);
			}
			else {
				const errorMsg = await t('Error');
				await eda.sys_Dialog.showConfirmationMessage('sys_IFrame.openIFrame not available', errorMsg);
			}
		}
		else {
			// 新窗口模式：使用 sys_Window.open 打开新标签页
			// @ts-expect-error - sys_Window 可能不存在
			if (eda.sys_Window && typeof eda.sys_Window.open === 'function') {
				const resourceUrl = `resource://${htmlFilePath}`;
				eda.sys_Window.open(resourceUrl, '_blank');
			}
			else {
				const errorMsg = await t('Error');
				await eda.sys_Dialog.showConfirmationMessage('sys_Window.open not available', errorMsg);
			}
		}
	}
	catch (error) {
		console.error('[iBOM] Error:', error);
		const errorMsg = await t('Error');
		await eda.sys_Dialog.showConfirmationMessage(`Error: ${(error as Error).message}`, errorMsg);
	}
}

/**
 * 生成并下载 HTML
 */
export function generateAndDownload(): Promise<void> {
	return (async () => {
		try {
			const isPcbDoc = await checkPcbDocumentActive();
			if (!isPcbDoc) {
				const msg = await t('PCBDataNotFound');
				const title = await t('Error');
				await eda.sys_Dialog.showConfirmationMessage(msg, title);
				return;
			}

			const msg = await t('GeneratingHTML');
			await eda.sys_Dialog.showConfirmationMessage(msg, 'Info');
		}
		catch (error) {
			console.error('[iBOM] Error:', error);
			const errorMsg = await t('Error');
			await eda.sys_Dialog.showConfirmationMessage(`${errorMsg}: ${(error as Error).message}`, errorMsg);
		}
	})();
}

/**
 * 关于对话框
 */
export function about(): Promise<void> {
	return (async () => {
		try {
			const htmlFilePath = './iframe/about.html';
			const iframeId = 'ibom-about';
			const title = await t('About');

			// @ts-expect-error - sys_IFrame 可能不存在
			if (eda.sys_IFrame && typeof eda.sys_IFrame.openIFrame === 'function') {
				await eda.sys_IFrame.openIFrame(
					htmlFilePath,
					500,
					600,
					iframeId,
					{
						title,
						maximizeButton: false,
						minimizeButton: false,
						grayscaleMask: true,
					},
				);
			}
			else {
				await eda.sys_Dialog.showInformationMessage('Interactive BOM for EasyEDA Pro\n\nVersion: 1.0.0\n\n© 2024 EasyEDA Community', title);
			}
		}
		catch (error) {
			console.error('[iBOM] About error:', error);
		}
	})();
}

/**
 * 检查 PCB 文档是否激活
 */
async function checkPcbDocumentActive(): Promise<boolean> {
	try {
		const docInfo = await eda.dmt_SelectControl.getCurrentDocumentInfo();
		return docInfo.documentType === 3; // PCB = 3
	}
	catch (e) {
		console.error('[iBOM] checkPcbDocumentActive error:', e);
		return false;
	}
}
