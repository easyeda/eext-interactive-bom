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

	t(key) {
		return this.translations[key] || key;
	}
};
