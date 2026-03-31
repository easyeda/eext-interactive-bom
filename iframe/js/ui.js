// 高亮文本中的关键字
function highlightKeyword(text, keyword) {
	if (!keyword)
		return text;
	const regex = new RegExp(`(${escapeRegExp(keyword)})`, 'gi');
	return String(text).replace(regex, '<mark class="keyword-highlight">$1</mark>');
}

// 转义正则表达式特殊字符
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 渲染 BOM 表格
function renderBomTable(bomList) {
	const tbody = document.getElementById('bomBody');
	if (!tbody)
		return;
	tbody.innerHTML = '';
	document.getElementById('bomCount').textContent = bomList.length;

	// 应用排序
	const sortedList = [...bomList];
	if (state.sortColumn) {
		sortedList.sort((a, b) => {
			let aVal, bVal;
			switch (state.sortColumn) {
				case 'designators':
					aVal = a.designators[0];
					bVal = b.designators[0];
					break;
				case 'value':
					aVal = a.value;
					bVal = b.value;
					break;
				case 'package':
					aVal = a.package;
					bVal = b.package;
					break;
				case 'count':
					aVal = a.count;
					bVal = b.count;
					break;
				case 'layer':
					aVal = a.layerText;
					bVal = b.layerText;
					break;
				default:
					return 0;
			}

			// 数字比较
			if (typeof aVal === 'number' && typeof bVal === 'number') {
				return state.sortAscending ? aVal - bVal : bVal - aVal;
			}

			// 字符串比较
			const cmp = String(aVal).localeCompare(String(bVal), 'zh-CN', { numeric: true });
			return state.sortAscending ? cmp : -cmp;
		});
	}

	const query = state.searchQuery.toLowerCase();
	const filteredList = query
		? sortedList.filter((item) => {
				const desText = item.designators.join(' ').toLowerCase();
				const valueText = item.value.toLowerCase();
				const packageText = item.package.toLowerCase();
				const layerText = item.layerText.toLowerCase();
				return desText.includes(query) || valueText.includes(query) || packageText.includes(query) || layerText.includes(query);
			})
		: sortedList;

	const highlightQuery = state.highlightQuery.trim().toLowerCase();
	const highlightSet = highlightQuery
		? new Set(highlightQuery.split(/[\s,;]+/).map(s => s.trim()).filter(s => s))
		: new Set();

	clearHighlightExcept(state.selectedRow?.designators || []);
	const currentHighlightSet = new Set(state.selectedRow?.designators || []);

	filteredList.forEach((item) => {
		const tr = document.createElement('tr');
		tr.dataset.id = item.id;

		const desText = item.designators.join(', ');
		const needsHighlight = highlightQuery && item.designators.some(des => highlightSet.has(des.toLowerCase()));

		if (needsHighlight) {
			item.designators.forEach(des => currentHighlightSet.add(des));
		}

		const desHtml = query ? highlightKeyword(desText, query) : desText;
		const valueHtml = query ? highlightKeyword(item.value, query) : item.value;
		const packageHtml = query ? highlightKeyword(item.package, query) : item.package;
		const layerHtml = query ? highlightKeyword(item.layerText, query) : item.layerText;
		const layerClass = item.layer === 'F' ? 'layer-top' : 'layer-bottom';

		tr.innerHTML = `
      <td><input type="checkbox" class="bom-check" data-id="${item.id}"></td>
      <td title="${desText}">${desHtml}</td>
      <td title="${item.value}">${valueHtml}</td>
      <td title="${item.package}">${packageHtml}</td>
      <td>${item.count}</td>
      <td class="${layerClass}">${layerHtml}</td>
    `;

		if (needsHighlight)
			tr.classList.add('highlight');

		tr.addEventListener('click', (e) => {
			if (e.target.type !== 'checkbox')
				selectRow(item);
		});

		tr.querySelector('.bom-check').addEventListener('change', (e) => {
			if (e.target.checked) {
				state.checkedItems.add(item.id);
				tr.classList.add('checked');
			}
			else {
				state.checkedItems.delete(item.id);
				tr.classList.remove('checked');
			}
		});

		tbody.appendChild(tr);
	});

	highlightComponents(Array.from(currentHighlightSet));
}

// 选择行
function selectRow(item) {
	document.querySelectorAll('.bom-table tr.selected').forEach(tr => tr.classList.remove('selected'));
	document.querySelectorAll('.bom-table tr.highlight').forEach(tr => tr.classList.remove('highlight'));

	const tr = document.querySelector(`.bom-table tr[data-id="${item.id}"]`);
	if (tr) {
		tr.classList.add('selected');
		state.selectedRow = item;
	}

	if (item.designators) {
		item.designators.forEach((des) => {
			const row = Array.from(document.querySelectorAll('.bom-table tr')).find(r => r.cells[1]?.textContent.includes(des));
			if (row)
				row.classList.add('highlight');
		});
	}

	state.highlightQuery = '';
	state.highlightFilterMode = false;
	document.getElementById('highlightInput').value = '';

	// 获取所有元件并高亮
	const comps = [];
	if (item.designators) {
		item.designators.forEach((des) => {
			const comp = state.components.find(c => c.ref === des || c.designator === des);
			if (comp)
				comps.push(comp);
		});
	}

	// 高亮所有元件
	highlightComponentsByComps(comps);

	const firstDes = item.designators[0];
	const comp = state.components.find(c => c.ref === firstDes || c.designator === firstDes);

	if (comp) {
		const isTop = comp.layer === 1 || comp.layer === 11 || comp.layer === 'F';
		const targetLayer = isTop ? 'F' : 'B';

		const targetLayerName = isTop ? '顶面' : '底面';

		// 检查当前层与元件所在层是否不同
		if (state.currentLayer !== targetLayer && state.currentLayer !== 'FB') {
			// 当前是单面预览且与元件所在层不同，显示提示
			showToast(`元件在${targetLayerName}，请切换${targetLayerName}预览`);
		}
		else if (state.currentLayer === 'FB') {
			// 当前是双面预览，正常处理（不切换层）
			// 仅在勾选自动平移或自动缩放时才定位
			if (state.autoPan || state.autoZoom) {
				panToComponent(comp, state.autoZoom);
			}

			// 双面预览时，为所有元件显示十字线
			comps.forEach((c) => {
				showCrosshair(c.x, c.y, c);
			});
		}
		else {
			// 当前是单面预览且与元件所在层相同
			// 仅勾选自动平移时才平移，仅勾选自动缩放时也要平移（因为缩放后需要定位到元件）
			if (state.autoPan || state.autoZoom) {
				panToComponent(comp, state.autoZoom);
			}

			// 为所有元件显示十字线
			comps.forEach((c) => {
				showCrosshair(c.x, c.y, c);
			});
		}
	}

	document.getElementById('statusText').textContent = `选中：${item.designators.join(', ')}`;
}

// 显示提示消息
function showToast(message, duration = 3000) {
	// 移除旧的 toast
	const oldToast = document.querySelector('.toast-message');
	if (oldToast)
		oldToast.remove();

	// 创建 toast
	const toast = document.createElement('div');
	toast.className = 'toast-message';
	toast.textContent = message;
	toast.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;

	document.body.appendChild(toast);

	// 自动移除
	setTimeout(() => {
		toast.remove();
	}, duration);
}

// 定位到元件位置
function panToComponent(comp, shouldZoom = false) {
	if (!comp)
		return;

	const x = Number.parseFloat(comp.x) || 0;
	const y = Number.parseFloat(comp.y) || 0;

	const frontCanvas = document.getElementById('frontCanvas');
	const canvasWidth = frontCanvas.width / (window.devicePixelRatio || 1);
	const canvasHeight = frontCanvas.height / (window.devicePixelRatio || 1);

	// 如果需要缩放，按板框尺寸计算缩放比例
	if (shouldZoom && state.boardOutline && state.boardOutline.pointArr) {
		// 计算板框的边界
		let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
		state.boardOutline.pointArr.forEach((point) => {
			const px = point.x || point.X || 0;
			const py = point.y || point.Y || 0;
			if (px < minX)
				minX = px;
			if (py < minY)
				minY = py;
			if (px > maxX)
				maxX = px;
			if (py > maxY)
				maxY = py;
		});

		const boardWidth = maxX - minX;
		const boardHeight = maxY - minY;

		// 计算合适的缩放比例（板框占画布的 80%）
		if (boardWidth > 0 && boardHeight > 0) {
			const targetScaleX = (canvasWidth * 0.8) / boardWidth;
			const targetScaleY = (canvasHeight * 0.8) / boardHeight;
			const targetScale = Math.min(targetScaleX, targetScaleY, 3); // 最大 3 倍

			// 限制缩放范围
			state.scale = Math.max(0.1, Math.min(10, targetScale));
		}
	}

	// 如果勾选了自动平移，计算元件居中的偏移
	// 注意：因为 Y 轴已经翻转，所以需要调整计算方式
	if (state.autoPan) {
		// PCB 坐标系统：Y 轴向上为正
		// Canvas 坐标系统：Y 轴向下为正（已经通过 ctx.scale(1, -1) 翻转）
		// 所以居中计算需要：panOffset.x = canvasWidth/2 - x * scale
		//                   panOffset.y = canvasHeight/2 - (-y) * scale = canvasHeight/2 + y * scale
		const newOffsetX = canvasWidth / 2 - x * state.scale;
		const newOffsetY = canvasHeight / 2 + y * state.scale;
		state.panOffset = { x: newOffsetX, y: newOffsetY };
	}
	else if (shouldZoom) {
		// 如果只勾选了自动缩放而没有勾选自动平移，需要重新计算居中偏移
		// 让板框居中显示
		if (state.boardOutline && state.boardOutline.pointArr) {
			let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
			state.boardOutline.pointArr.forEach((point) => {
				const px = point.x || point.X || 0;
				const py = point.y || point.Y || 0;
				if (px < minX)
					minX = px;
				if (py < minY)
					minY = py;
				if (px > maxX)
					maxX = px;
				if (py > maxY)
					maxY = py;
			});

			const boardCenterX = (minX + maxX) / 2;
			const boardCenterY = (minY + maxY) / 2;

			const newOffsetX = canvasWidth / 2 - boardCenterX * state.scale;
			const newOffsetY = canvasHeight / 2 + boardCenterY * state.scale;
			state.panOffset = { x: newOffsetX, y: newOffsetY };
		}
	}

	// 重新渲染
	renderPcbWithTransform();

	console.log('[iBom] Panned to component:', comp.ref, 'at', x, y, 'zoom:', state.scale, 'autoPan:', state.autoPan, 'autoZoom:', shouldZoom);
}

// 显示十字线标记
function showCrosshair(x, y, comp) {
	const crosshair = document.createElement('div');
	crosshair.className = 'crosshair';

	// 将 PCB 坐标转换为 canvas 坐标
	// 注意：Y 轴已经翻转，所以需要考虑翻转后的坐标
	let screenX = (x * state.scale) + state.panOffset.x;
	let screenY = (-y * state.scale) + state.panOffset.y;

	// 底层需要镜像翻转十字线
	if (state.currentLayer === 'B' || (state.currentLayer === 'FB' && comp && (!(comp.layer === 1 || comp.layer === 11 || comp.layer === 'F')))) {
		// 获取 viewBox 中心
		const boardCenterX = state.viewBox.x + state.viewBox.width / 2;
		// 计算镜像后的 X 坐标
		screenX = ((boardCenterX * 2 - x) * state.scale) + state.panOffset.x;
	}

	crosshair.style.left = `${screenX}px`;
	crosshair.style.top = `${screenY}px`;
	crosshair.style.width = '200px';
	crosshair.style.height = '200px';
	crosshair.style.marginLeft = '-100px';
	crosshair.style.marginTop = '-100px';

	// 根据当前预览模式选择容器
	let container;
	if (state.currentLayer === 'FB' && comp) {
		// 双面预览时，根据元件所在层选择容器
		const isTop = comp.layer === 1 || comp.layer === 11 || comp.layer === 'F';
		container = isTop
			? document.getElementById('frontContainer')
			: document.getElementById('backContainer');
	}
	else {
		// 单面预览
		container = state.currentLayer === 'B'
			? document.getElementById('backContainer')
			: document.getElementById('frontContainer');
	}

	if (container) {
		container.appendChild(crosshair);
	}

	// 3 秒后移除
	setTimeout(() => { crosshair.remove(); }, 3000);
}

// 高亮元件
function highlightComponents(designators) {
	state.highlightedDesignators.clear();
	designators.forEach(des => state.highlightedDesignators.add(des));
	// 保持当前视图，不自动适应
	renderPcb(true);
}

// 高亮多个元件（通过元件对象列表）
function highlightComponentsByComps(comps) {
	state.highlightedDesignators.clear();
	comps.forEach((comp) => {
		const ref = comp.ref || comp.designator;
		if (ref)
			state.highlightedDesignators.add(ref);
	});
	// 保持当前视图，不自动适应
	renderPcb(true);
}

// 清除高亮
function clearHighlightExcept(selectedDesignators) {
	state.highlightedDesignators.clear();
	if (selectedDesignators) {
		selectedDesignators.forEach(des => state.highlightedDesignators.add(des));
	}
}

// 更新 canvas 容器背景色
function updateCanvasBackground() {
	const containers = document.querySelectorAll('.canvas-container');
	containers.forEach((container) => {
		if (state.darkMode) {
			container.style.backgroundColor = 'rgb(38, 44, 48)';
			container.style.background = 'rgb(38, 44, 48)';
		}
		else {
			container.style.backgroundColor = '#f0f0f0';
			container.style.background = '#f0f0f0';
		}
	});
}

// 导出 CSV 文件
function exportToCsv() {
	const currentData = state.aggregateMode ? state.bomData : state.flatBomData;

	let csv = '\uFEFF'; // BOM for UTF-8
	csv += '"Designators","Value","Footprint","Quantity","Layer"\n';

	currentData.forEach((item) => {
		const desText = item.designators.join(';').replace(/"/g, '""');
		const value = item.value.replace(/"/g, '""');
		const package_ = item.package.replace(/"/g, '""');
		const layer = item.layerText.replace(/"/g, '""');
		csv += `"${desText}","${value}","${package_}",${item.count},"${layer}"\n`;
	});

	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
	const filename = `BOM_${timestamp}.csv`;

	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

// 导出 HTML 文件（仅用于 EasyEDA 环境）
function exportToHtml() {
	const htmlContent = document.documentElement.outerHTML;
	const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `iBOM_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}.html`;
	link.style.display = 'none';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
	alert('HTML 已导出！\n\n注意：导出的 HTML 文件需要在 EasyEDA 环境中才能完整运行。\n如需在浏览器中使用，请使用"导出 CSV"功能。');
}
