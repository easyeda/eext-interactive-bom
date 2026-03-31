// 全局状态
window.state = {
	components: [],
	bomData: [],
	flatBomData: [],
	boardOutline: null,
	footprintMap: new Map(), // 封装数据映射 footprintUuid -> footprintData
	darkMode: false,
	currentLayer: 'F',
	showRefs: true,
	showValues: true,
	showPads: true,
	showTracks: false,  // 显示导线和过孔
	tracks: [],  // 导线数据
	vias: [],    // 过孔数据
	checkedItems: new Set(),
	selectedRow: null,
	componentElements: { F: {}, B: {} },
	highlightedDesignators: new Set(),
	aggregateMode: false,
	searchQuery: '',
	highlightQuery: '',
	highlightFilterMode: false,
	columnWidths: {
		designators: 120,
		value: 150,
		package: 120,
		quantity: 50,
		layer: 60,
	},
	viewBox: { x: 0, y: 0, width: 0, height: 0 },
	panOffset: { x: 0, y: 0 },
	scale: 1,
	isPanning: false,
	panStart: { x: 0, y: 0 },
	// 排序状态
	sortColumn: null,
	sortAscending: true,
	// 自动平移/缩放
	autoPan: false,
	autoZoom: false,
};

// 方便访问
const state = window.state;

// 调试日志
console.log('[iBom] state.js loaded');
