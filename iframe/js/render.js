// 绘制焊盘轮廓
function drawPadOutline(ctx, pad) {
	const padX = Number.parseFloat(pad.x) || 0;
	const padY = Number.parseFloat(pad.y) || 0;
	let padW = Number.parseFloat(pad.width) || 1;
	let padH = Number.parseFloat(pad.height) || 1;
	const shape = (pad.shape || 'rectangle').toLowerCase();

	if (padW < 0.1)
		padW = 1;
	if (padH < 0.1)
		padH = 1;

	ctx.beginPath();

	if (shape === 'circle') {
		const r = Math.max(padW, padH) / 2;
		ctx.arc(padX, padY, r, 0, Math.PI * 2);
	}
	else if (shape === 'oval' || shape === 'ellipse') {
		ctx.ellipse(padX, padY, padW / 2, padH / 2, 0, 0, Math.PI * 2);
	}
	else if (shape === 'rectangle' || shape === 'rect') {
		ctx.rect(padX - padW / 2, padY - padH / 2, padW, padH);
	}
	else {
		ctx.rect(padX - padW / 2, padY - padH / 2, padW, padH);
	}

	ctx.closePath();
}

// 绘制元件
function drawComponent(ctx, comp, x, y, rotation, isTop, isMirrored = false, footprintData = null) {
	ctx.save();
	
	const ref = comp.ref || comp.designator || '';

	// 调试日志
	if (ref === 'C1' || ref === 'C2' || ref === 'R1') {
		console.log('[FootprintRender] Component', ref, 'footprintUuid:', comp.footprintUuid, 'hasFootprintData:', !!footprintData, 'canvas:', footprintData?.canvas);
	}

	// 移动到元件位置
	ctx.translate(x, y);
	
	// 应用旋转
	ctx.rotate(rotation * Math.PI / 180);

	// 如果有封装数据，使用封装渲染
	if (footprintData && footprintData.canvas) {
		// 封装的坐标系和PCB的坐标系是一样的，不需要额外的偏移
		// 封装内部的图元坐标已经是相对于封装原点(0,0)的
		// 注意：底层元件的镜像已经在外层的全局变换中处理了，这里不需要再次镜像

		// 渲染封装（焊盘和丝印层）
		renderFootprint(footprintData, ctx, {
			showPads: state.showPads,
			showSilkScreen: true,
			showFab: false,
			showOtherLayers: false,
			darkMode: state.darkMode,
			isMirrored: isMirrored,
		});

		// 高亮选中元件
		const needsHighlight = state.highlightedDesignators.has(ref);
		if (needsHighlight) {
			ctx.save();
			ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换
			ctx.translate(x, y);
			ctx.rotate(rotation * Math.PI / 180);
			if (isMirrored) {
				ctx.scale(-1, 1);
			}

			ctx.strokeStyle = '#ff5722';
			ctx.lineWidth = 2;
			const padding = 5;
			ctx.strokeRect(
				-footprintData.canvas.width / 2 - padding,
				-footprintData.canvas.height / 2 - padding,
				footprintData.canvas.width + padding * 2,
				footprintData.canvas.height + padding * 2
			);
			ctx.restore();
		}

		// 记录元件位置
		const layer = isTop ? 'F' : 'B';
		if (ref) {
			state.componentElements[layer][ref] = {
				x,
				y,
				rotation,
				width: footprintData.canvas.width,
				height: footprintData.canvas.height,
				isTop,
				isHighlighted: needsHighlight,
			};
		}
	}
	else {
		// 降级：使用矩形框渲染
		let pkgWidth = 20; let pkgHeight = 15;
		if (comp.bbox) {
			if (comp.bbox.width)
				pkgWidth = comp.bbox.width;
			if (comp.bbox.height)
				pkgHeight = comp.bbox.height;
		}

		pkgWidth = Math.max(pkgWidth, 5);
		pkgHeight = Math.max(pkgHeight, 3);

		if (isMirrored) {
			ctx.scale(-1, 1);
		}

		ctx.strokeStyle = isTop ? '#2196f3' : '#ff9800';
		ctx.lineWidth = 1;
		ctx.strokeRect(-pkgWidth / 2, -pkgHeight / 2, pkgWidth, pkgHeight);

		const needsHighlight = state.highlightedDesignators.has(ref);
		if (needsHighlight) {
			ctx.strokeStyle = '#ff5722';
			ctx.lineWidth = 2;
			ctx.strokeRect(-pkgWidth / 2 - 2, -pkgHeight / 2 - 2, pkgWidth + 4, pkgHeight + 4);
		}

		const layer = isTop ? 'F' : 'B';
		if (ref) {
			state.componentElements[layer][ref] = {
				x,
				y,
				rotation,
				width: pkgWidth,
				height: pkgHeight,
				isTop,
				isHighlighted: needsHighlight,
			};
		}

		// 渲染焊盘（如果有）
		if (state.showPads && comp.pads && comp.pads.length > 0) {
			ctx.strokeStyle = '#c9c942';
			ctx.lineWidth = 0.5;
			ctx.fillStyle = 'rgba(201, 201, 66, 0.3)';

			comp.pads.forEach((pad) => {
				drawPadOutline(ctx, pad);
				ctx.fill();
				ctx.stroke();
			});
		}
	}

	// 渲染位号和值
	// 获取封装尺寸用于定位文字
	let pkgWidth = 20;
	let pkgHeight = 15;
	if (footprintData && footprintData.canvas) {
		pkgWidth = footprintData.canvas.width;
		pkgHeight = footprintData.canvas.height;
	} else if (comp.bbox) {
		if (comp.bbox.width) pkgWidth = comp.bbox.width;
		if (comp.bbox.height) pkgHeight = comp.bbox.height;
	}

	// 渲染位号 - 左上角
	if (state.showRefs && ref) {
		ctx.save();
		// 恢复 Y 轴方向，让文字正常显示
		ctx.scale(1, -1);
		// 底层元件已经镜像了，文字需要再镜像一次才能正常显示
		// 顶层元件不镜像，文字正常显示
		if (isMirrored && !isTop)
			ctx.scale(-1, 1);
		// 浅色主题使用灰色，暗色主题使用白色
		ctx.fillStyle = state.darkMode ? '#fff' : '#666';
		ctx.font = 'bold 30px sans-serif';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'bottom';
		// 位号显示在封装左上角
		ctx.fillText(ref, -pkgWidth / 2, -pkgHeight / 2);
		ctx.restore();
	}

	// 渲染值 - 左下角
	if (state.showValues) {
		// 使用与元件列表相同的取值逻辑
		const val = getComponentValue(comp);
		if (val && val !== 'unknown') {
			ctx.save();
			// 恢复 Y 轴方向，让文字正常显示
			ctx.scale(1, -1);
			// 底层元件已经镜像了，文字需要再镜像一次才能正常显示
			// 顶层元件不镜像，文字正常显示
			if (isMirrored && !isTop)
				ctx.scale(-1, 1);
			ctx.fillStyle = '#aaa';
			ctx.font = '30px sans-serif';
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';
			// 值显示在封装左下角
			ctx.fillText(val, -pkgWidth / 2, pkgHeight / 2);
			ctx.restore();
		}
	}

	ctx.restore();
}

// 绘制 PCB 板框
function drawBoardOutline(ctx, boardOutline, components, pad = 50) {
	if (boardOutline && boardOutline.pointArr && boardOutline.pointArr.length > 0) {
		// 板框颜色 - 紫蓝色
		ctx.strokeStyle = state.darkMode ? '#9575cd' : '#5e35b1';
		ctx.lineWidth = boardOutline.width || 2;
		ctx.beginPath();

		const points = boardOutline.pointArr;
		const pathCommands = boardOutline.pathCommands;

		// 如果有 pathCommands，使用路径命令绘制（支持曲线等复杂形状）
		if (pathCommands && pathCommands.length > 0) {
			for (const cmd of pathCommands) {
				switch (cmd.type) {
					case 'M': // 移动到起点
						ctx.moveTo(cmd.x, cmd.y);
						break;

					case 'L': // 直线
						ctx.lineTo(cmd.x, cmd.y);
						break;

					case 'C': // 三次贝塞尔曲线
						ctx.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y);
						break;

					case 'ARC': // 圆弧（SVG 格式）
						// 简化处理：使用圆弧到终点的直线
						ctx.lineTo(cmd.x, cmd.y);
						break;

					case 'CARC': // 反向圆弧
						ctx.lineTo(cmd.x, cmd.y);
						break;

					case 'R': // 矩形（已经在解析时展开为点）
						ctx.lineTo(cmd.x, cmd.y);
						break;

					case 'CIRCLE': // 圆
						ctx.moveTo(cmd.cx + cmd.r, cmd.cy);
						ctx.arc(cmd.cx, cmd.cy, cmd.r, 0, Math.PI * 2);
						break;

					case 'Z': // 闭合路径
						ctx.closePath();
						break;
				}
			}
		}
		else {
			// 降级：使用点数组绘制直线
			if (points.length > 0) {
				const firstPoint = points[0];
				const xKey = 'x' in firstPoint ? 'x' : 'X';
				const yKey = 'y' in firstPoint ? 'y' : 'Y';

				ctx.moveTo(firstPoint[xKey], firstPoint[yKey]);
				for (let i = 1; i < points.length; i++) {
					ctx.lineTo(points[i][xKey], points[i][yKey]);
				}
				ctx.closePath();
			}
		}

		ctx.stroke();

		// 计算边界
		let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
		points.forEach((p) => {
			const x = p.x || p.X || 0;
			const y = p.y || p.Y || 0;
			if (x < minX)
				minX = x;
			if (y < minY)
				minY = y;
			if (x > maxX)
				maxX = x;
			if (y > maxY)
				maxY = y;
		});

		return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
	}

	if (!components || components.length === 0) {
		return { x: -50, y: -50, width: 100, height: 100 };
	}

	let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;
	components.forEach((comp) => {
		const x = Number.parseFloat(comp.x) || 0;
		const y = Number.parseFloat(comp.y) || 0;
		let w = 10; let h = 10;
		if (comp.bbox) {
			w = comp.bbox.width || 10;
			h = comp.bbox.height || 10;
		}
		if (x - w / 2 < minX)
			minX = x - w / 2;
		if (y - h / 2 < minY)
			minY = y - h / 2;
		if (x + w / 2 > maxX)
			maxX = x + w / 2;
		if (y + h / 2 > maxY)
			maxY = y + h / 2;
	});

	const boardX = minX - pad;
	const boardY = minY - pad;
	const boardW = maxX - minX + pad * 2;
	const boardH = maxY - minY + pad * 2;

	ctx.strokeStyle = state.darkMode ? '#9575cd' : '#5e35b1';
	ctx.lineWidth = 2;
	ctx.strokeRect(boardX, boardY, boardW, boardH);

	return { x: boardX, y: boardY, width: boardW, height: boardH };
}

// 绘制导线
function drawTracks(ctx, tracks, layer) {
	if (!tracks || tracks.length === 0) return;

	tracks.forEach(track => {
		const trackLayer = track.layer;
		if (layer === 'F' && trackLayer !== 1) return;
		if (layer === 'B' && trackLayer !== 2) return;

		ctx.strokeStyle = state.darkMode ? '#888' : '#666';
		// 导线宽度：使用 lineWidth 属性
		const width = Number(track.lineWidth) || 0.2;
		ctx.lineWidth = width;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.beginPath();
		ctx.moveTo(Number(track.startX) || 0, Number(track.startY) || 0);
		ctx.lineTo(Number(track.endX) || 0, Number(track.endY) || 0);
		ctx.stroke();
	});
}

// 绘制过孔
function drawVias(ctx, vias) {
	if (!vias || vias.length === 0) return;

	vias.forEach(via => {
		const x = Number(via.x || via.centerX) || 0;
		const y = Number(via.y || via.centerY) || 0;
		const diameter = Number(via.diameter || via.outerDiameter) || 1;
		const holeDiameter = Number(via.holeDiameter || via.holeWidth) || 0.5;

		ctx.fillStyle = state.darkMode ? '#666' : '#888';
		ctx.beginPath();
		ctx.arc(x, y, diameter / 2, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = state.darkMode ? '#252c30' : '#fff';
		ctx.beginPath();
		ctx.arc(x, y, holeDiameter / 2, 0, Math.PI * 2);
		ctx.fill();
	});
}

// 调整 canvas 尺寸
function resizeCanvas(canvas) {
	const container = canvas.parentElement;
	const rect = container.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;

	if (rect.width === 0 || rect.height === 0) {
		const parentRect = container.parentElement.getBoundingClientRect();
		canvas.width = parentRect.width * dpr;
		canvas.height = parentRect.height * dpr;
		canvas.style.width = `${parentRect.width}px`;
		canvas.style.height = `${parentRect.height}px`;
	}
	else {
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;
	}
}

// 渲染 PCB
function renderPcb(keepTransform = false) {
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	const frontCtx = frontCanvas.getContext('2d');
	const backCtx = backCanvas.getContext('2d');

	state.componentElements = { F: {}, B: {} };

	resizeCanvas(frontCanvas);
	resizeCanvas(backCanvas);

	if (!keepTransform) {
		let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;

		// 1. 首先考虑所有元件
		state.components.forEach((comp) => {
			const x = Number.parseFloat(comp.x) || 0;
			const y = Number.parseFloat(comp.y) || 0;
			// 考虑元件尺寸
			let w = 10; let h = 10;
			if (comp.bbox) {
				w = comp.bbox.width || 10;
				h = comp.bbox.height || 10;
			}
			if (x - w / 2 < minX)
				minX = x - w / 2;
			if (y - h / 2 < minY)
				minY = y - h / 2;
			if (x + w / 2 > maxX)
				maxX = x + w / 2;
			if (y + h / 2 > maxY)
				maxY = y + h / 2;
		});

		// 2. 如果有板框，也要考虑板框的边界
		if (state.boardOutline && state.boardOutline.pointArr) {
			state.boardOutline.pointArr.forEach((point) => {
				const x = point.x || point.X || 0;
				const y = point.y || point.Y || 0;
				if (x < minX)
					minX = x;
				if (y < minY)
					minY = y;
				if (x > maxX)
					maxX = x;
				if (y > maxY)
					maxY = y;
			});
		}

		// 增加边距，确保左右上下都有间隙
		const pad = 100;
		const contentWidth = maxX - minX + pad * 2 || 500;
		const contentHeight = maxY - minY + pad * 2 || 500;

		state.viewBox = { x: minX - pad, y: minY - pad, width: contentWidth, height: contentHeight };

		const canvasWidth = frontCanvas.width / (window.devicePixelRatio || 1);
		const canvasHeight = frontCanvas.height / (window.devicePixelRatio || 1);

		let scaleX, scaleY, scale;
		if (state.currentLayer === 'FB') {
			const singleCanvasHeight = canvasHeight / 2;
			scaleX = canvasWidth / contentWidth;
			scaleY = singleCanvasHeight / contentHeight;
			scale = Math.min(scaleX, scaleY) * 0.90;
		}
		else {
			scaleX = canvasWidth / contentWidth;
			scaleY = canvasHeight / contentHeight;
			scale = Math.min(scaleX, scaleY) * 0.90;
		}

		state.scale = scale;

		const offsetX = (canvasWidth - contentWidth * scale) / 2 - minX * scale;
		const offsetY = (canvasHeight - contentHeight * scale) / 2 - minY * scale;
		state.panOffset = { x: offsetX, y: offsetY };
	}

	function drawLayer(ctx, canvas, isTop, isMirrored = false) {
		const dpr = window.devicePixelRatio || 1;

		// 完全清除 canvas（使用实际像素尺寸）
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 填充背景色
		const bgColor = state.darkMode ? 'rgb(38, 44, 48)' : '#ffffff';
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 应用变换
		ctx.translate(state.panOffset.x * dpr, state.panOffset.y * dpr);
		ctx.scale(state.scale * dpr, state.scale * dpr);

		// 镜像处理（底层视图：左右翻转）
		if (isMirrored) {
			const boardCenterX = state.viewBox.x + state.viewBox.width / 2;
			ctx.translate(boardCenterX, 0);
			ctx.scale(-1, 1);
			ctx.translate(-boardCenterX, 0);
		}

		// 翻转 Y 轴，让 PCB 坐标系统与 Canvas 坐标系统一致
		// PCB: Y 轴向上为正，Canvas: Y 轴向下为正
		// 注意：Y 轴翻转必须在最后，在绘制内容之前
		ctx.scale(1, -1);

		// 绘制板框（在镜像变换之后）
		drawBoardOutline(ctx, state.boardOutline, state.components, 50);

		// 绘制导线和过孔
		if (state.showTracks) {
			const trackLayer = isTop ? 'F' : 'B';
			drawTracks(ctx, state.tracks, trackLayer);
			drawVias(ctx, state.vias);
		}

		// 绘制元件
		state.components.forEach((comp) => {
			const compIsTop = comp.layer === 1 || comp.layer === 11 || comp.layer === 'F';
			if (compIsTop === isTop) {
				const x = Number.parseFloat(comp.x) || 0;
				const y = Number.parseFloat(comp.y) || 0;
				const rot = Number.parseFloat(comp.rotation) || 0;
				// 获取元件的封装数据
				const footprintData = getComponentFootprint(comp, state.footprintMap);
				// 底层元件传递 isMirrored=true，让元件内部也进行镜像
				drawComponent(ctx, comp, x, y, rot, isTop, isMirrored, footprintData);
			}
		});

		ctx.restore();
	}

	const frontContainer = document.getElementById('frontContainer');
	const backContainer = document.getElementById('backContainer');

	// 先隐藏所有容器
	frontContainer.classList.add('hidden');
	backContainer.classList.add('hidden');

	if (state.currentLayer === 'F') {
		// 顶层预览：只显示顶层
		frontContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(frontCanvas);
		drawLayer(frontCtx, frontCanvas, true, false);
	}
	else if (state.currentLayer === 'B') {
		// 底层预览：只显示底层
		backContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(backCanvas);
		drawLayer(backCtx, backCanvas, false, true);
	}
	else {
		// 双面预览：显示两层
		frontContainer.classList.remove('hidden');
		backContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(frontCanvas);
		resizeCanvas(backCanvas);
		drawLayer(frontCtx, frontCanvas, true, false);
		drawLayer(backCtx, backCanvas, false, true);
	}

	const frontCount = state.components.filter(c => c.layer === 1 || c.layer === 11 || c.layer === 'F').length;
	const backCount = state.components.length - frontCount;
	const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;
	document.getElementById('layerInfo').textContent = `${t('layer-top')}: ${frontCount} | ${t('layer-bottom')}: ${backCount}`;
}

// 使用当前变换状态重新渲染 PCB
function renderPcbWithTransform() {
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	const frontCtx = frontCanvas.getContext('2d');
	const backCtx = backCanvas.getContext('2d');

	state.componentElements = { F: {}, B: {} };

	const dpr = window.devicePixelRatio || 1;
	const canvasWidth = frontCanvas.width / dpr;
	const canvasHeight = frontCanvas.height / dpr;

	const { x: minX, y: minY, width: contentWidth, height: contentHeight } = state.viewBox;

	function clearAndDraw(ctx, canvas, isTop, isMirrored = false) {
		// 完全清除 canvas（使用实际像素尺寸）
		ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// 填充背景色
		const bgColor = state.darkMode ? 'rgb(38, 44, 48)' : '#ffffff';
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		// 应用变换
		ctx.translate(state.panOffset.x * dpr, state.panOffset.y * dpr);
		ctx.scale(state.scale * dpr, state.scale * dpr);

		// 镜像处理（底层视图：左右翻转）
		if (isMirrored) {
			const boardCenterX = minX + contentWidth / 2;
			ctx.translate(boardCenterX, 0);
			ctx.scale(-1, 1);
			ctx.translate(-boardCenterX, 0);
		}

		// 翻转 Y 轴，让 PCB 坐标系统与 Canvas 坐标系统一致
		// PCB: Y 轴向上为正，Canvas: Y 轴向下为正
		// 注意：Y 轴翻转必须在最后，在绘制内容之前
		ctx.scale(1, -1);

		// 绘制板框（在镜像变换之后）
		drawBoardOutline(ctx, state.boardOutline, state.components, 50);

		// 绘制导线和过孔
		if (state.showTracks) {
			const trackLayer = isTop ? 'F' : 'B';
			drawTracks(ctx, state.tracks, trackLayer);
			drawVias(ctx, state.vias);
		}

		// 绘制元件
		state.components.forEach((comp) => {
			const compIsTop = comp.layer === 1 || comp.layer === 11 || comp.layer === 'F';
			if (compIsTop === isTop) {
				const x = Number.parseFloat(comp.x) || 0;
				const y = Number.parseFloat(comp.y) || 0;
				const rot = Number.parseFloat(comp.rotation) || 0;
				// 获取元件的封装数据
				const footprintData = getComponentFootprint(comp, state.footprintMap);
				// 底层元件传递 isMirrored=true，让元件内部也进行镜像
				drawComponent(ctx, comp, x, y, rot, isTop, isMirrored, footprintData);
			}
		});

		ctx.restore();
	}

	const frontContainer = document.getElementById('frontContainer');
	const backContainer = document.getElementById('backContainer');

	// 先隐藏所有容器
	frontContainer.classList.add('hidden');
	backContainer.classList.add('hidden');

	if (state.currentLayer === 'F') {
		// 顶层预览：只显示顶层
		frontContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(frontCanvas);
		clearAndDraw(frontCtx, frontCanvas, true, false);
	}
	else if (state.currentLayer === 'B') {
		// 底层预览：只显示底层
		backContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(backCanvas);
		clearAndDraw(backCtx, backCanvas, false, true);
	}
	else {
		// 双面预览：显示两层
		frontContainer.classList.remove('hidden');
		backContainer.classList.remove('hidden');
		// 调整 canvas 尺寸
		resizeCanvas(frontCanvas);
		resizeCanvas(backCanvas);
		clearAndDraw(frontCtx, frontCanvas, true, false);
		clearAndDraw(backCtx, backCanvas, false, true);
	}
}

// 自动适应画布尺寸
function fitToContent() {
	// 先调整 canvas 尺寸，确保容器高度正确
	const frontCanvas = document.getElementById('frontCanvas');
	const backCanvas = document.getElementById('backCanvas');
	resizeCanvas(frontCanvas);
	resizeCanvas(backCanvas);

	let minX = Infinity; let minY = Infinity; let maxX = -Infinity; let maxY = -Infinity;

	// 1. 首先考虑所有元件
	state.components.forEach((comp) => {
		const x = Number.parseFloat(comp.x) || 0;
		const y = Number.parseFloat(comp.y) || 0;
		// 考虑元件尺寸
		let w = 10; let h = 10;
		if (comp.bbox) {
			w = comp.bbox.width || 10;
			h = comp.bbox.height || 10;
		}
		if (x - w / 2 < minX)
			minX = x - w / 2;
		if (y - h / 2 < minY)
			minY = y - h / 2;
		if (x + w / 2 > maxX)
			maxX = x + w / 2;
		if (y + h / 2 > maxY)
			maxY = y + h / 2;
	});

	// 2. 如果有板框，也要考虑板框的边界
	if (state.boardOutline && state.boardOutline.pointArr) {
		state.boardOutline.pointArr.forEach((point) => {
			const x = point.x || point.X || 0;
			const y = point.y || point.Y || 0;
			if (x < minX)
				minX = x;
			if (y < minY)
				minY = y;
			if (x > maxX)
				maxX = x;
			if (y > maxY)
				maxY = y;
		});
	}

	// 增加边距，确保左右上下都有间隙
	const pad = 100;
	const contentWidth = maxX - minX + pad * 2 || 500;
	const contentHeight = maxY - minY + pad * 2 || 500;

	state.viewBox = { x: minX - pad, y: minY - pad, width: contentWidth, height: contentHeight };

	const canvasWidth = frontCanvas.width / (window.devicePixelRatio || 1);
	const canvasHeight = frontCanvas.height / (window.devicePixelRatio || 1);

	let scaleX, scaleY, scale;
	let singleCanvasHeight;

	if (state.currentLayer === 'FB') {
		// 双面预览：每个 canvas 占一半高度
		singleCanvasHeight = canvasHeight / 2;
		scaleX = canvasWidth / contentWidth;
		scaleY = singleCanvasHeight / contentHeight;
		scale = Math.min(scaleX, scaleY) * 0.90;
	}
	else {
		// 单面预览：使用完整高度
		singleCanvasHeight = canvasHeight;
		scaleX = canvasWidth / contentWidth;
		scaleY = canvasHeight / contentHeight;
		scale = Math.min(scaleX, scaleY) * 0.90;
	}

	state.scale = scale;

	// 计算居中偏移 - 确保内容在画布中央
	// 内容中心点
	const centerX = (minX + maxX) / 2;
	const centerY = (minY + maxY) / 2;

	// 计算让内容居中的偏移量
	// 注意：双面预览时，每个 canvas 的高度是 singleCanvasHeight
	state.panOffset = {
		x: canvasWidth / 2 - centerX * scale,
		y: singleCanvasHeight / 2 + centerY * scale
	};

	renderPcb(true);
}

// 重置画布视图
function resetView() {
	fitToContent();
}
