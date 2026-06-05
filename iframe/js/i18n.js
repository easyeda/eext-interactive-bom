// 多语言支持
window.i18n = {
	translations: {},
	currentLang: 'zh-Hans',

	// 内嵌翻译数据
	embeddedTranslations: {
		'zh-Hans': {
			'ui-filter-designator': '过滤位号...',
			'ui-filter': '过滤...',
			'ui-toggle-aggregate': '切换聚合模式',
			'ui-toggle-list': '切换到列表模式',
			'ui-export-csv': '导出 CSV',
			'ui-toggle-dark': '切换暗色模式',
			'ui-show-refs': '位号',
			'ui-show-values': '值',
			'ui-show-pads': '焊盘',
			'ui-show-tracks': '导线',
			'ui-auto-pan': '自动平移',
			'ui-auto-zoom': '自动缩放',
			'ui-layer-top': '顶层',
			'ui-layer-both': '双面',
			'ui-layer-bottom': '底层',
			'ui-status-ready': '准备就绪',
			'ui-status-loading': '正在加载...',
			'ui-status-components': '元件',
			'ui-status-items': '项',
			'ui-label-front': '顶层 (Front)',
			'ui-label-back': '底层 (Back)',
			'table-header-designators': '位号',
			'table-header-value': '值',
			'table-header-package': '封装',
			'table-header-quantity': '数量',
			'table-header-layer': '层',
			'layer-top': '顶层',
			'layer-bottom': '底层',
			'layer-both': '双面',
			'ui-sort-hint': '点击排序',
			'ui-toggle-light-mode': '切换到亮色模式',
			'ui-toggle-dark-mode': '切换到暗色模式',
			'ui-layer-top-name': '顶面',
			'ui-layer-bottom-name': '底面',
			'ui-toast-layer-switch': '元件在${1}，请切换${1}预览',
			'ui-status-selected': '选中：',
			'ui-reset-canvas': '重置画布',
			'ui-browser-alert': '提示：此 HTML 文件是从 EasyEDA 导出的静态快照。\n\n功能限制：\n- 无法获取实时 PCB 数据\n- 无法与 EasyEDA 交互\n- 仅用于查看和分享\n\n请使用"导出 CSV"功能获取可编辑的数据。',
			'ui-export-html-alert': 'HTML 已导出！\n\n注意：导出的 HTML 文件需要在 EasyEDA 环境中才能完整运行。\n如需在浏览器中使用，请使用"导出 CSV"功能。',
			'ui-page-title': '交互式BOM',
		},
		'en': {
			'ui-filter-designator': 'Filter designators...',
			'ui-filter': 'Filter...',
			'ui-toggle-aggregate': 'Toggle aggregate mode',
			'ui-toggle-list': 'Toggle list mode',
			'ui-export-csv': 'Export CSV',
			'ui-toggle-dark': 'Toggle dark mode',
			'ui-show-refs': 'Refs',
			'ui-show-values': 'Values',
			'ui-show-pads': 'Pads',
			'ui-show-tracks': 'Tracks',
			'ui-auto-pan': 'Auto Pan',
			'ui-auto-zoom': 'Auto Zoom',
			'ui-layer-top': 'Top',
			'ui-layer-both': 'Both',
			'ui-layer-bottom': 'Bottom',
			'ui-status-ready': 'Ready',
			'ui-status-loading': 'Loading...',
			'ui-status-components': 'components',
			'ui-status-items': 'items',
			'ui-label-front': 'Top (Front)',
			'ui-label-back': 'Bottom (Back)',
			'table-header-designators': 'Designators',
			'table-header-value': 'Value',
			'table-header-package': 'Package',
			'table-header-quantity': 'Qty',
			'table-header-layer': 'Layer',
			'layer-top': 'Top',
			'layer-bottom': 'Bottom',
			'layer-both': 'Both',
			'ui-sort-hint': 'Click to sort',
			'ui-toggle-light-mode': 'Switch to light mode',
			'ui-toggle-dark-mode': 'Switch to dark mode',
			'ui-layer-top-name': 'Top side',
			'ui-layer-bottom-name': 'Bottom side',
			'ui-toast-layer-switch': 'Component is on ${1}, please switch to ${1} view',
			'ui-status-selected': 'Selected: ',
			'ui-reset-canvas': 'Reset Canvas',
			'ui-browser-alert': 'Notice: This HTML file is a static snapshot exported from EasyEDA.\n\nFeature limitations:\n- Cannot get real-time PCB data\n- Cannot interact with EasyEDA\n- For viewing and sharing only\n\nPlease use "Export CSV" to get editable data.',
			'ui-export-html-alert': 'HTML exported!\n\nNote: The exported HTML file can only fully run in EasyEDA environment.\nFor browser use, please use "Export CSV" function.',
			'ui-page-title': 'Interactive BOM',
		}
	},

	async init() {
		try {
			if (typeof eda !== 'undefined' && eda.sys_I18n) {
				this.currentLang = await eda.sys_I18n.getCurrentLanguage();
				console.log('[i18n] Current language:', this.currentLang);
			}

			// 使用内嵌的翻译数据
			this.translations = this.embeddedTranslations[this.currentLang] || this.embeddedTranslations['zh-Hans'];
			console.log('[i18n] Translations loaded:', Object.keys(this.translations).length, 'keys');
		} catch (e) {
			console.warn('[i18n] Init failed:', e);
			this.translations = this.embeddedTranslations['zh-Hans'];
		}
	},

	t(key, ...args) {
		let text = this.translations[key] || key;
		args.forEach((arg, i) => {
			text = text.replace(new RegExp(`\\$\\{${i + 1}\\}`, 'g'), arg);
		});
		return text;
	}
};
