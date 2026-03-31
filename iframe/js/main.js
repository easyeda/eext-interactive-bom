// 初始化
async function init() {
	try {
		console.log('[iBom] ===== init START =====');

		// 初始化多语言
		await window.i18n.init();
		applyI18n();

		// 检查是否在浏览器中（没有 eda API）
		const isBrowser = typeof eda === 'undefined';
		console.log('[iBom] isBrowser:', isBrowser);

		if (isBrowser) {
			// 浏览器模式：显示提示
			document.getElementById('statusText').textContent = window.i18n.t('ui-status-ready');
			alert('提示：此 HTML 文件是从 EasyEDA 导出的静态快照。\n\n功能限制：\n- 无法获取实时 PCB 数据\n- 无法与 EasyEDA 交互\n- 仅用于查看和分享\n\n请使用"导出 CSV"功能获取可编辑的数据。');
			return;
		}

		// EasyEDA 模式：正常初始化
		console.log('[iBom] Waiting for eda...');
		await waitForEda();
		console.log('[iBom] eda ready');

		document.getElementById('statusText').textContent = window.i18n.t('ui-status-loading');

		// 获取 PCB 数据
		console.log('[iBom] Fetching PCB data...');
		const data = await fetchPcbData();
		state.components = data.components || [];
		state.boardOutline = data.boardOutline || null;
		console.log('[iBom] Got', state.components.length, 'components');

		// 获取封装数据
		console.log('[iBom] Fetching component footprints...');
		state.footprintMap = await fetchComponentFootprints(state.components);
		console.log('[iBom] footprintMap size:', state.footprintMap.size);

		// 获取导线和过孔数据
		console.log('[iBom] Fetching tracks and vias...');
		state.tracks = await getAllTracks();
		state.vias = await getAllVias();
		console.log('[iBom] Got', state.tracks.length, 'tracks and', state.vias.length, 'vias');

		console.log('[iBom] Components with footprint:', state.components.filter(c => c.footprintUuid).length);

		const { bomList, flatList, stats } = parseBom(state.components);
		state.bomData = bomList;
		state.flatBomData = flatList;

		const currentData = state.aggregateMode ? bomList : flatList;
		renderBomTable(currentData);

		updateCanvasBackground();
		renderPcb();
		
		// 自动适应画布，居中显示
		fitToContent();
		
		initColumnResizer();
		initCanvasPanZoom();
		initSplitter();

		document.getElementById('compCount').textContent = stats.total;
		const t = window.i18n.t.bind(window.i18n);
		document.getElementById('statusText').textContent = `${stats.total} ${t('ui-status-components')}, ${bomList.length} ${t('ui-status-items')}`;

		// 初始化表头排序
		initTableSort();
		
		console.log('[iBom] ===== init END =====');
	}
	catch (e) {
		console.error('[iBom] Init error:', e);
		const errorMsg = window.i18n ? window.i18n.t('Error') : 'Error';
		document.getElementById('statusText').textContent = `${errorMsg}: ${e.message}`;
		console.log('[iBom] ===== init ERROR END =====');
	}
}

// 初始化表头排序
function initTableSort() {
	const headers = document.querySelectorAll('.bom-table th[data-sort]');
	headers.forEach((th) => {
		th.style.cursor = 'pointer';
		th.title = '点击排序';

		let isClick = true;
		let startX = 0;

		// 使用 mousedown/mouseup 检测真正的点击
		th.addEventListener('mousedown', (e) => {
			// 如果点击的是拖动手柄，不处理
			if (e.target.classList.contains('resizer') || e.target.closest('.resizer')) {
				return;
			}
			isClick = true;
			startX = e.pageX;
		});

		th.addEventListener('mousemove', (e) => {
			// 如果鼠标移动超过 3px，认为不是点击
			if (Math.abs(e.pageX - startX) > 3) {
				isClick = false;
			}
		});

		th.addEventListener('mouseup', (e) => {
			// 如果点击的是拖动手柄，不处理
			if (e.target.classList.contains('resizer') || e.target.closest('.resizer')) {
				return;
			}

			// 如果不是点击（鼠标移动过），不触发排序
			if (!isClick) {
				return;
			}

			const column = th.dataset.sort;
			if (state.sortColumn === column) {
				// 切换排序方向
				state.sortAscending = !state.sortAscending;
			}
			else {
				// 新列，默认升序
				state.sortColumn = column;
				state.sortAscending = true;
			}

			// 更新表头图标
			document.querySelectorAll('.bom-table th').forEach((h) => {
				const icon = h.querySelector('.sort-icon');
				if (icon)
					icon.remove();
			});

			const icon = document.createElement('span');
			icon.className = 'sort-icon';
			icon.textContent = state.sortAscending ? ' ▲' : ' ▼';
			icon.style.fontSize = '10px';
			th.appendChild(icon);

			// 重新渲染表格
			const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
			renderBomTable(currentData);
		});
	});
}

// 等待 DOM 加载完成后初始化
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		init();
	});
}
else {
	init();
}

// 事件绑定
document.getElementById('darkModeBtn').addEventListener('click', function () {
	state.darkMode = !state.darkMode;

	if (state.darkMode) {
		document.body.classList.add('dark');
	}
	else {
		document.body.classList.remove('dark');
	}

	this.textContent = state.darkMode ? '☀️' : '🌙';
	this.title = state.darkMode ? '切换到亮色模式' : '切换到暗色模式';

	updateCanvasBackground();
	renderPcb(true);
});

document.getElementById('showRefs').addEventListener('change', (e) => { state.showRefs = e.target.checked; renderPcb(true); });
document.getElementById('showValues').addEventListener('change', (e) => { state.showValues = e.target.checked; renderPcb(true); });
document.getElementById('showPads').addEventListener('change', (e) => { state.showPads = e.target.checked; renderPcb(true); });
document.getElementById('showTracks').addEventListener('change', (e) => { state.showTracks = e.target.checked; renderPcb(true); });

// 自动平移/缩放设置
document.getElementById('autoPan').addEventListener('change', (e) => { state.autoPan = e.target.checked; });
document.getElementById('autoZoom').addEventListener('change', (e) => { state.autoZoom = e.target.checked; });

document.getElementById('layerF').addEventListener('click', () => {
	state.currentLayer = 'F';
	['layerF', 'layerFB', 'layerB'].forEach(id => document.getElementById(id).classList.toggle('active', id === 'layerF'));
	// 调整 canvas 尺寸并居中
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	if (frontCanvas) resizeCanvas(frontCanvas);
	if (backCanvas) resizeCanvas(backCanvas);
	fitToContent();
});

document.getElementById('layerFB').addEventListener('click', () => {
	state.currentLayer = 'FB';
	['layerF', 'layerFB', 'layerB'].forEach(id => document.getElementById(id).classList.toggle('active', id === 'layerFB'));
	// 调整 canvas 尺寸并居中
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	if (frontCanvas) resizeCanvas(frontCanvas);
	if (backCanvas) resizeCanvas(backCanvas);
	fitToContent();
});

document.getElementById('layerB').addEventListener('click', () => {
	state.currentLayer = 'B';
	['layerF', 'layerFB', 'layerB'].forEach(id => document.getElementById(id).classList.toggle('active', id === 'layerB'));
	// 调整 canvas 尺寸并居中
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	if (frontCanvas) resizeCanvas(frontCanvas);
	if (backCanvas) resizeCanvas(backCanvas);
	fitToContent();
});

document.getElementById('searchInput').addEventListener('input', (e) => {
	state.searchQuery = e.target.value;
	state.highlightFilterMode = false;
	const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
	renderBomTable(currentData);
});

document.getElementById('highlightInput').addEventListener('input', (e) => {
	state.highlightQuery = e.target.value;
	state.highlightFilterMode = false;
	const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
	renderBomTable(currentData);
});

document.getElementById('highlightInput').addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		state.highlightFilterMode = true;
		const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
		renderBomTable(currentData);
	}
});

document.addEventListener('keydown', (e) => {
	if (e.key === 'Escape' && state.highlightFilterMode) {
		state.highlightFilterMode = false;
		state.highlightQuery = '';
		document.getElementById('highlightInput').value = '';
		const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
		renderBomTable(currentData);
	}
});

document.getElementById('aggregateToggle').addEventListener('click', function () {
	state.aggregateMode = !state.aggregateMode;
	this.classList.toggle('active');
	this.textContent = state.aggregateMode ? '📦' : '📄';
	const t = window.i18n.t.bind(window.i18n);
	this.title = state.aggregateMode ? t('ui-toggle-list') : t('ui-toggle-aggregate');
	const currentData = state.aggregateMode ? state.bomData : state.flatBomData;
	renderBomTable(currentData);
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
	exportToCsv();
});

document.getElementById('selectAll').addEventListener('change', (e) => {
	const checked = e.target.checked;
	document.querySelectorAll('.bom-check').forEach((cb) => {
		cb.checked = checked;
		const tr = cb.closest('tr');
		if (checked) {
			state.checkedItems.add(Number.parseInt(cb.dataset.id));
			tr.classList.add('checked');
		}
		else {
			state.checkedItems.delete(Number.parseInt(cb.dataset.id));
			tr.classList.remove('checked');
		}
	});
});

window.addEventListener('resize', () => { renderPcb(); });

// 应用多语言到 UI
function applyI18n() {
	try {
		console.log('[iBom] applyI18n start');
		const t = window.i18n.t.bind(window.i18n);
		console.log('[iBom] Test translation:', t('ui-show-refs'));

		// 输入框占位符
		const highlightInput = document.getElementById('highlightInput');
		const searchInput = document.getElementById('searchInput');
		if (highlightInput) highlightInput.placeholder = t('ui-filter-designator');
		if (searchInput) searchInput.placeholder = t('ui-filter');

		// 按钮标题
		const aggregateToggle = document.getElementById('aggregateToggle');
		const exportCsvBtn = document.getElementById('exportCsvBtn');
		const darkModeBtn = document.getElementById('darkModeBtn');
		if (aggregateToggle) aggregateToggle.title = t('ui-toggle-aggregate');
		if (exportCsvBtn) exportCsvBtn.title = t('ui-export-csv');
		if (darkModeBtn) darkModeBtn.title = t('ui-toggle-dark');

		// 表头
		const thDesignators = document.getElementById('thDesignators');
		const thValue = document.getElementById('thValue');
		const thPackage = document.getElementById('thPackage');
		const thQuantity = document.getElementById('thQuantity');
		const thLayer = document.getElementById('thLayer');
		if (thDesignators) thDesignators.textContent = t('table-header-designators');
		if (thValue) thValue.textContent = t('table-header-value');
		if (thPackage) thPackage.textContent = t('table-header-package');
		if (thQuantity) thQuantity.textContent = t('table-header-quantity');
		if (thLayer) thLayer.textContent = t('table-header-layer');

		// 复选框标签 - 通过 input ID 找到父 label
		const updateLabel = (inputId, text) => {
			console.log('[iBom] Updating label for input:', inputId, text);
			const input = document.getElementById(inputId);
			if (input) {
				const label = input.parentElement;
				if (label && label.tagName === 'LABEL') {
					label.textContent = '';
					label.appendChild(input);
					label.appendChild(document.createTextNode(' ' + text));
					console.log('[iBom] Label updated:', inputId);
				} else {
					console.warn('[iBom] Parent is not a label:', inputId, label);
				}
			} else {
				console.warn('[iBom] Input not found:', inputId);
			}
		};

		updateLabel('showRefs', t('ui-show-refs'));
		updateLabel('showValues', t('ui-show-values'));
		updateLabel('showPads', t('ui-show-pads'));
		updateLabel('showTracks', t('ui-show-tracks'));
		updateLabel('autoPan', t('ui-auto-pan'));
		updateLabel('autoZoom', t('ui-auto-zoom'));

		// 层切换按钮
		const layerF = document.getElementById('layerF');
		const layerFB = document.getElementById('layerFB');
		const layerB = document.getElementById('layerB');
		if (layerF) layerF.textContent = t('ui-layer-top');
		if (layerFB) layerFB.textContent = t('ui-layer-both');
		if (layerB) layerB.textContent = t('ui-layer-bottom');

		// Canvas 标签
		const frontLabel = document.querySelector('#frontContainer .canvas-label');
		const backLabel = document.querySelector('#backContainer .canvas-label');
		if (frontLabel) frontLabel.textContent = t('ui-label-front');
		if (backLabel) backLabel.textContent = t('ui-label-back');

		console.log('[iBom] applyI18n complete');
	} catch (e) {
		console.error('[iBom] applyI18n error:', e);
	}
}
