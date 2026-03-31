// 初始化列宽拖拽
function initColumnResizer() {
	const ths = document.querySelectorAll('.bom-table th');
	let resizeIndicator = null;
	let currentTh = null;
	let startX = 0;
	let startWidth = 0;

	ths.forEach((th) => {
		if (th.classList.contains('col-check'))
			th.style.width = '30px';
		else if (th.classList.contains('col-designators'))
			th.style.width = `${state.columnWidths.designators}px`;
		else if (th.classList.contains('col-value'))
			th.style.width = `${state.columnWidths.value}px`;
		else if (th.classList.contains('col-package'))
			th.style.width = `${state.columnWidths.package}px`;
		else if (th.classList.contains('col-quantity'))
			th.style.width = `${state.columnWidths.quantity}px`;
		else if (th.classList.contains('col-layer'))
			th.style.width = `${state.columnWidths.layer}px`;
	});

	ths.forEach((th) => {
		const resizer = document.createElement('div');
		resizer.className = 'resizer';
		th.appendChild(resizer);

		let isResizing = false;

		// 使用 mousedown，在捕获阶段阻止所有后续事件
		resizer.addEventListener('mousedown', (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			isResizing = true;
			currentTh = th;
			startX = e.pageX;
			startWidth = th.offsetWidth;

			resizeIndicator = document.createElement('div');
			resizeIndicator.className = 'column-resize-indicator';
			resizeIndicator.style.left = `${startX - document.body.getBoundingClientRect().left}px`;
			document.body.appendChild(resizeIndicator);

			resizer.classList.add('resizing');
			document.body.style.cursor = 'col-resize';
			document.body.style.userSelect = 'none';
		}, { capture: true, passive: false });

		document.addEventListener('mousemove', (e) => {
			if (!isResizing || !resizeIndicator)
				return;
			e.preventDefault();
			const currentX = e.pageX;
			resizeIndicator.style.left = `${currentX - document.body.getBoundingClientRect().left}px`;
		}, { capture: true, passive: false });

		document.addEventListener('mouseup', (e) => {
			if (!isResizing)
				return;

			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();

			// 计算新宽度
			const diff = e.pageX - startX;
			const newWidth = Math.max(30, startWidth + diff);

			// 更新列宽状态
			if (currentTh) {
				if (currentTh.classList.contains('col-designators'))
					state.columnWidths.designators = newWidth;
				else if (currentTh.classList.contains('col-value'))
					state.columnWidths.value = newWidth;
				else if (currentTh.classList.contains('col-package'))
					state.columnWidths.package = newWidth;
				else if (currentTh.classList.contains('col-quantity'))
					state.columnWidths.quantity = newWidth;
				else if (currentTh.classList.contains('col-layer'))
					state.columnWidths.layer = newWidth;
				currentTh.style.width = `${newWidth}px`;
			}

			// 清理指示线
			if (resizeIndicator) { resizeIndicator.remove(); resizeIndicator = null; }
			if (currentTh) { currentTh.querySelector('.resizer')?.classList.remove('resizing'); currentTh = null; }

			isResizing = false;
			document.body.style.cursor = '';
			document.body.style.userSelect = '';
		}, { capture: true, passive: false });
	});
}

// 初始化分隔线拖动
function initSplitter() {
	const splitter = document.getElementById('splitter');
	const bomPanel = document.querySelector('.bom-panel');
	const previewPanel = document.querySelector('.preview-panel');

	if (!splitter || !bomPanel || !previewPanel)
		return;

	let isDragging = false;
	let startX = 0;
	let startWidth = 0;

	splitter.addEventListener('mousedown', (e) => {
		isDragging = true;
		startX = e.pageX;
		startWidth = bomPanel.offsetWidth;
		splitter.classList.add('dragging');
		document.body.style.cursor = 'col-resize';
		document.body.style.userSelect = 'none';
		e.preventDefault();
	});

	document.addEventListener('mousemove', (e) => {
		if (!isDragging)
			return;
		e.preventDefault();
		const diff = e.pageX - startX;
		const newWidth = Math.max(300, Math.min(startWidth + diff, window.innerWidth - 300));
		bomPanel.style.width = `${newWidth}px`;
	});

	document.addEventListener('mouseup', () => {
		if (!isDragging)
			return;
		isDragging = false;
		splitter.classList.remove('dragging');
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
		
		// 调整 canvas 尺寸并重新渲染
		const frontCanvas = document.getElementById('frontCanvas');
		const backCanvas = document.getElementById('backCanvas');
		if (frontCanvas) resizeCanvas(frontCanvas);
		if (backCanvas) resizeCanvas(backCanvas);
		renderPcb(true);
	});
}

// 初始化 Canvas 平移和缩放
function initCanvasPanZoom() {
	const containers = ['frontContainer', 'backContainer'].map(id => document.getElementById(id));

	containers.forEach((container) => {
		if (!container)
			return;

		const canvas = container.querySelector('canvas');
		if (!canvas)
			return;

		let isDragging = false;
		let startX, startY;
		let startPanX = 0; let startPanY = 0;

		canvas.addEventListener('mousedown', (e) => {
			// 检查容器是否可见
			if (container.classList.contains('hidden'))
				return;
				
			isDragging = true;
			startX = e.clientX;
			startY = e.clientY;
			startPanX = state.panOffset.x;
			startPanY = state.panOffset.y;
			canvas.style.cursor = 'grabbing';
			e.preventDefault();
		});

		document.addEventListener('mousemove', (e) => {
			if (!isDragging)
				return;
			const dx = e.clientX - startX;
			const dy = e.clientY - startY;
			state.panOffset.x = startPanX + dx;
			state.panOffset.y = startPanY + dy;
			renderPcbWithTransform();
		});

		document.addEventListener('mouseup', () => {
			isDragging = false;
			if (canvas)
				canvas.style.cursor = 'grab';
		});

		canvas.addEventListener('wheel', (e) => {
			// 检查容器是否可见
			if (container.classList.contains('hidden'))
				return;
				
			e.preventDefault();
			const rect = canvas.getBoundingClientRect();
			const mouseX = e.clientX - rect.left;
			const mouseY = e.clientY - rect.top;
			const delta = -e.deltaY;
			const zoomFactor = delta > 0 ? 1.1 : 0.9;
			const newScale = Math.max(0.1, Math.min(20, state.scale * zoomFactor));
			if (newScale === state.scale)
				return;
			const pcbX = (mouseX - state.panOffset.x) / state.scale;
			const pcbY = (mouseY - state.panOffset.y) / state.scale;
			state.scale = newScale;
			state.panOffset.x = mouseX - pcbX * newScale;
			state.panOffset.y = mouseY - pcbY * newScale;
			renderPcbWithTransform();
		}, { passive: false });

		canvas.style.cursor = 'grab';

		// 右键菜单
		canvas.addEventListener('contextmenu', (e) => {
			// 检查容器是否可见
			if (container.classList.contains('hidden'))
				return;
				
			e.preventDefault();
			const oldMenu = document.querySelector('.context-menu');
			if (oldMenu)
				oldMenu.remove();

			const menu = document.createElement('div');
			menu.className = 'context-menu';
			menu.style.left = `${e.clientX}px`;
			menu.style.top = `${e.clientY}px`;

			const menuItem = document.createElement('div');
			menuItem.className = 'context-menu-item';
			menuItem.textContent = '🔄 重置画布';
			menuItem.addEventListener('click', () => {
				resetView();
				menu.remove();
			});

			menu.appendChild(menuItem);
			document.body.appendChild(menu);

			const closeMenu = () => {
				menu.remove();
				document.removeEventListener('click', closeMenu);
			};
			setTimeout(() => { document.addEventListener('click', closeMenu); }, 100);
		});
	});
}
