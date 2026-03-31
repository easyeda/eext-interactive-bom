/**
 * 封装渲染器
 * 
 * 将解析后的封装数据渲染到 Canvas
 */

/**
 * 渲染封装到 Canvas
 * @param {Object} footprintData - 封装数据
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {Object} options - 渲染选项
 */
function renderFootprint(footprintData, ctx, options = {}) {
	if (!footprintData || !ctx) {
		console.warn('[Renderer] No data or context');
		return;
	}

	console.log('[Renderer] Rendering footprint:', {
		pads: footprintData.pads?.length,
		silkScreen: footprintData.silkScreen?.length,
		canvas: footprintData.canvas
	});

	const {
		showPads = true,
		showSilkScreen = true,
		darkMode = false,
		isMirrored = false,
	} = options;

	// 渲染焊盘
	if (showPads && footprintData.pads && footprintData.pads.length > 0) {
		console.log('[Renderer] Rendering', footprintData.pads.length, 'pads');
		renderPads(footprintData.pads, ctx, darkMode, isMirrored);
	}

	// 渲染丝印层
	if (showSilkScreen && footprintData.silkScreen && footprintData.silkScreen.length > 0) {
		console.log('[Renderer] Rendering', footprintData.silkScreen.length, 'silkScreen shapes');
		renderSilkScreen(footprintData.silkScreen, ctx, darkMode, isMirrored);
	}
}

/**
 * 渲染形状（线、圆弧、多边形等）
 * @param {Array} shapes - 形状数组
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function renderShapes(shapes, ctx, darkMode) {
	ctx.save();
	
	// 丝印层颜色
	ctx.strokeStyle = darkMode ? '#e0e0e0' : '#333333';
	ctx.lineWidth = 0.1;
	
	shapes.forEach(shape => {
		ctx.save();
		
		if (shape.type === 'line') {
			ctx.beginPath();
			ctx.moveTo(shape.x1, shape.y1);
			ctx.lineTo(shape.x2, shape.y2);
			ctx.stroke();
		}
		else if (shape.type === 'arc') {
			ctx.beginPath();
			ctx.arc(shape.x, shape.y, shape.radius, 0, (shape.endAngle * Math.PI) / 180);
			ctx.stroke();
		}
		else if (shape.type === 'poly' && shape.points) {
			ctx.beginPath();
			ctx.moveTo(shape.points[0].x, shape.points[0].y);
			for (let i = 1; i < shape.points.length; i++) {
				ctx.lineTo(shape.points[i].x, shape.points[i].y);
			}
			ctx.closePath();
			ctx.stroke();
		}
		
		ctx.restore();
	});
	
	ctx.restore();
}

/**
 * 渲染焊盘
 * @param {Array} pads - 焊盘数组
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 * @param {boolean} isMirrored - 是否镜像（底层元件）
 */
function renderPads(pads, ctx, darkMode, isMirrored = false) {
	ctx.save();

	pads.forEach((pad, index) => {
		ctx.save();

		// 应用焊盘位置
		ctx.translate(pad.x, pad.y);

		// 应用焊盘旋转
		if (pad.angle) {
			ctx.rotate((pad.angle * Math.PI) / 180);
		}

		// 根据焊盘形状渲染
		switch (pad.shape) {
			case 'circle':
				drawCirclePad(pad, ctx, darkMode);
				break;

			case 'oval':
			case 'ellipse':
				drawOvalPad(pad, ctx, darkMode);
				break;

			case 'rectangle':
			case 'rect':
			default:
				drawRectPad(pad, ctx, darkMode);
				break;
		}

		// 绘制焊盘编号
		if (pad.number) {
			drawPadNumber(pad, ctx, darkMode, isMirrored);
		}

		ctx.restore();
	});

	ctx.restore();
}

/**
 * 绘制圆形焊盘
 * @param {Object} pad - 焊盘对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function drawCirclePad(pad, ctx, darkMode) {
	const radius = pad.width / 2 || pad.height / 2 || 0.5;

	ctx.beginPath();
	ctx.arc(0, 0, radius, 0, Math.PI * 2);

	// 根据层设置颜色
	if (pad.layer === 'top') {
		ctx.fillStyle = darkMode ? 'rgba(255, 138, 128, 1)' : 'rgba(255, 138, 128, 1)';
		ctx.strokeStyle = '#ef5350';
	} else if (pad.layer === 'bottom') {
		ctx.fillStyle = darkMode ? 'rgba(173, 216, 230, 1)' : 'rgba(173, 216, 230, 1)';
		ctx.strokeStyle = '#87ceeb';
	} else {
		ctx.fillStyle = darkMode ? 'rgba(189, 189, 189, 1)' : 'rgba(189, 189, 189, 1)';
		ctx.strokeStyle = '#9e9e9e';
	}
	ctx.fill();
	ctx.lineWidth = 0.5;
	ctx.stroke();

	// 如果有孔
	if (pad.holeRadius > 0 || pad.holeDiameter > 0) {
		const holeRadius = pad.holeRadius || (pad.holeDiameter / 2);
		ctx.beginPath();
		ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
		ctx.fillStyle = darkMode ? '#262c30' : '#ffffff';
		ctx.fill();
		ctx.stroke();
	}
}

/**
 * 绘制椭圆形焊盘
 * @param {Object} pad - 焊盘对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function drawOvalPad(pad, ctx, darkMode) {
	const radiusX = pad.width / 2 || 0.5;
	const radiusY = pad.height / 2 || 0.5;

	ctx.beginPath();
	ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);

	// 根据层设置颜色
	if (pad.layer === 'top') {
		ctx.fillStyle = darkMode ? 'rgba(255, 138, 128, 1)' : 'rgba(255, 138, 128, 1)';
		ctx.strokeStyle = '#ef5350';
	} else if (pad.layer === 'bottom') {
		ctx.fillStyle = darkMode ? 'rgba(173, 216, 230, 1)' : 'rgba(173, 216, 230, 1)';
		ctx.strokeStyle = '#87ceeb';
	} else {
		ctx.fillStyle = darkMode ? 'rgba(189, 189, 189, 1)' : 'rgba(189, 189, 189, 1)';
		ctx.strokeStyle = '#9e9e9e';
	}
	ctx.fill();
	ctx.lineWidth = 0.5;
	ctx.stroke();

	// 如果有孔
	if (pad.holeRadius > 0 || pad.holeDiameter > 0) {
		const holeRadius = pad.holeRadius || (pad.holeDiameter / 2);
		ctx.beginPath();
		ctx.ellipse(0, 0, holeRadius, holeRadius, 0, 0, Math.PI * 2);
		ctx.fillStyle = darkMode ? '#262c30' : '#ffffff';
		ctx.fill();
		ctx.stroke();
	}
}

/**
 * 绘制矩形焊盘
 * @param {Object} pad - 焊盘对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function drawRectPad(pad, ctx, darkMode) {
	const x = -pad.width / 2;
	const y = -pad.height / 2;

	ctx.beginPath();
	ctx.rect(x, y, pad.width, pad.height);

	// 根据层设置颜色
	if (pad.layer === 'top') {
		ctx.fillStyle = darkMode ? 'rgba(255, 138, 128, 1)' : 'rgba(255, 138, 128, 1)';
		ctx.strokeStyle = '#ef5350';
	} else if (pad.layer === 'bottom') {
		ctx.fillStyle = darkMode ? 'rgba(173, 216, 230, 1)' : 'rgba(173, 216, 230, 1)';
		ctx.strokeStyle = '#87ceeb';
	} else {
		ctx.fillStyle = darkMode ? 'rgba(189, 189, 189, 1)' : 'rgba(189, 189, 189, 1)';
		ctx.strokeStyle = '#9e9e9e';
	}
	ctx.fill();
	ctx.lineWidth = 0.5;
	ctx.stroke();

	// 如果有孔
	if (pad.holeRadius > 0 || pad.holeDiameter > 0) {
		const holeRadius = pad.holeRadius || (pad.holeDiameter / 2);
		ctx.beginPath();
		ctx.arc(0, 0, holeRadius, 0, Math.PI * 2);
		ctx.fillStyle = darkMode ? '#262c30' : '#ffffff';
		ctx.fill();
		ctx.stroke();
	}
}

/**
 * 绘制焊盘编号
 * @param {Object} pad - 焊盘对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 * @param {boolean} isMirrored - 是否镜像
 */
function drawPadNumber(pad, ctx, darkMode, isMirrored = false) {
	ctx.save();

	// 反向旋转，让文字保持水平
	if (pad.angle) {
		ctx.rotate((-pad.angle * Math.PI) / 180);
	}

	// 文字需要抵消Y轴翻转（render.js中的ctx.scale(1, -1)）
	// 顶层元件：scale(1, -1) 抵消Y轴翻转
	// 底层元件：scale(-1, -1) 抵消Y轴翻转和X轴镜像
	if (isMirrored) {
		ctx.scale(-1, -1);
	} else {
		ctx.scale(1, -1);
	}

	ctx.fillStyle = darkMode ? '#fff' : '#666';
	ctx.font = '30px sans-serif';  // 焊盘编号字体大小
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// 在焊盘中心显示编号
	ctx.fillText(String(pad.number), 0, 0);

	ctx.restore();
}

/**
 * 绘制钻孔尺寸（多层焊盘专用）
 */
function drawHoleSize(pad, holeDiam, ctx, isMirrored = false) {
	ctx.save();

	// 反向旋转，让文字保持水平
	if (pad.angle) {
		ctx.rotate((-pad.angle * Math.PI) / 180);
	}

	// 抵消Y轴翻转
	if (isMirrored) {
		ctx.scale(-1, -1);
	} else {
		ctx.scale(1, -1);
	}

	// 钻孔尺寸文字，使用深色，字体更大更明显
	ctx.fillStyle = '#000000';
	ctx.strokeStyle = '#ffffff';
	ctx.lineWidth = 0.3;
	const fontSize = Math.max(holeDiam * 0.5, 1.0);
	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	const text = `⌀${holeDiam.toFixed(2)}`;

	// 先绘制白色描边，再绘制黑色文字，确保可见
	ctx.strokeText(text, 0, 0);
	ctx.fillText(text, 0, 0);

	ctx.restore();
}

/**
 * 渲染丝印层
 * @param {Array} graphics - 图形数组
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 * @param {boolean} isMirrored - 是否镜像
 */
function renderSilkScreen(graphics, ctx, darkMode, isMirrored = false) {
	ctx.save();

	// 丝印层颜色
	ctx.strokeStyle = '#66cc33';
	ctx.fillStyle = 'none';

	graphics.forEach((graphic, index) => {
		ctx.save();

		// 使用实际线宽
		if (graphic.strokeWidth !== undefined) {
			ctx.lineWidth = graphic.strokeWidth;
			if (index < 3 && graphic.type === 'poly') {
				console.log('[SilkScreen] Poly', index, 'strokeWidth:', graphic.strokeWidth);
			}
		}

		switch (graphic.type) {
			case 'line':
				drawLine(graphic, ctx);
				break;

			case 'arc':
				drawArc(graphic, ctx);
				break;

			case 'poly':
				drawPoly(graphic, ctx);
				break;

			case 'fill':
				drawFill(graphic, ctx);
				break;

			case 'text':
				drawText(graphic, ctx, darkMode, isMirrored);
				break;

			case 'circle':
				drawCircle(graphic, ctx);
				break;

			case 'rect':
				drawRect(graphic, ctx);
				break;
		}

		ctx.restore();
	});

	ctx.restore();
}

function drawPoly(poly, ctx) {
	if (!poly.segments || poly.segments.length === 0) return;

	console.log('[DrawPoly] segments:', poly.segments.length, 'strokeWidth:', poly.strokeWidth, 'ctx.lineWidth:', ctx.lineWidth);

	ctx.beginPath();

	let currentX = 0;
	let currentY = 0;

	for (const segment of poly.segments) {
		if (segment.type === 'point') {
			ctx.moveTo(segment.x, segment.y);
			currentX = segment.x;
			currentY = segment.y;
		} else if (segment.type === 'line') {
			ctx.moveTo(segment.x1, segment.y1);
			ctx.lineTo(segment.x2, segment.y2);
			currentX = segment.x2;
			currentY = segment.y2;
		} else if (segment.type === 'arc') {
			// 绘制圆弧
			const startX = segment.x1;
			const startY = segment.y1;
			const endX = segment.x2;
			const endY = segment.y2;
			const angle = segment.angle;

			// 计算圆弧参数
			const dx = endX - startX;
			const dy = endY - startY;
			const chord = Math.sqrt(dx * dx + dy * dy);
			const midX = (startX + endX) / 2;
			const midY = (startY + endY) / 2;

			const angleRad = (angle * Math.PI) / 180;
			const radius = Math.abs(chord / (2 * Math.sin(angleRad / 2)));

			// 计算圆心
			const perpAngle = Math.atan2(dy, dx) + Math.PI / 2;
			const distToCenter = Math.sqrt(radius * radius - (chord / 2) * (chord / 2));
			const centerX = midX + distToCenter * Math.cos(perpAngle) * (angle > 0 ? 1 : -1);
			const centerY = midY + distToCenter * Math.sin(perpAngle) * (angle > 0 ? 1 : -1);

			// 计算起始和结束角度
			const startAngle = Math.atan2(startY - centerY, startX - centerX);
			const endAngle = Math.atan2(endY - centerY, endX - centerX);

			console.log('[Arc] start:', startX, startY, 'end:', endX, endY, 'angle:', angle);
			console.log('[Arc] chord:', chord, 'radius:', radius, 'center:', centerX, centerY);
			console.log('[Arc] startAngle:', startAngle, 'endAngle:', endAngle, 'anticlockwise:', angle > 0);

			ctx.moveTo(startX, startY);
			ctx.arc(centerX, centerY, radius, startAngle, endAngle, angle > 0);

			currentX = endX;
			currentY = endY;
		}
	}

	ctx.stroke();
}

function drawFill(fill, ctx) {
	if (!fill.points || fill.points.length === 0) return;

	ctx.beginPath();
	ctx.moveTo(fill.points[0].x, fill.points[0].y);
	for (let i = 1; i < fill.points.length; i++) {
		ctx.lineTo(fill.points[i].x, fill.points[i].y);
	}
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
}

/**
 * 渲染装配层
 * @param {Array} graphics - 图形数组
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function renderFab(graphics, ctx, darkMode) {
	ctx.save();

	// 装配层颜色
	ctx.strokeStyle = darkMode ? '#888' : '#666';
	ctx.lineWidth = 0.1;
	ctx.fillStyle = 'none';
	ctx.setLineDash([0.5, 0.5]); // 虚线

	graphics.forEach(graphic => {
		ctx.save();

		switch (graphic.type) {
			case 'line':
				drawLine(graphic, ctx);
				break;

			case 'arc':
				drawArc(graphic, ctx);
				break;

			case 'circle':
				drawCircle(graphic, ctx);
				break;

			case 'rect':
				drawRect(graphic, ctx);
				break;
		}

		ctx.restore();
	});

	ctx.restore();
	ctx.setLineDash([]); // 恢复实线
}

/**
 * 渲染其他层
 * @param {Map} layers - 层数据 Map
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 */
function renderOtherLayers(layers, ctx, darkMode) {
	ctx.save();

	layers.forEach((graphics, layerName) => {
		// 跳过已经渲染的层
		if (layerName === 'SilkScreen' || layerName === 'Fab') {
			return;
		}

		ctx.save();

		// 根据层名设置颜色
		ctx.strokeStyle = getLayerColor(layerName, darkMode);
		ctx.lineWidth = 0.1;

		graphics.forEach(graphic => {
			ctx.save();

			switch (graphic.type) {
				case 'line':
					drawLine(graphic, ctx);
					break;

				case 'arc':
					drawArc(graphic, ctx);
					break;

				case 'circle':
					drawCircle(graphic, ctx);
					break;

				case 'rect':
					drawRect(graphic, ctx);
					break;
			}

			ctx.restore();
		});

		ctx.restore();
	});

	ctx.restore();
}

/**
 * 绘制线条
 * @param {Object} line - 线条对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 */
function drawLine(line, ctx) {
	ctx.beginPath();
	ctx.moveTo(line.x1, line.y1);
	ctx.lineTo(line.x2, line.y2);
	ctx.stroke();
}

/**
 * 绘制圆弧
 * @param {Object} arc - 圆弧对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 */
function drawArc(arc, ctx) {
	ctx.beginPath();
	ctx.arc(
		arc.centerX,
		arc.centerY,
		arc.radius,
		arc.startAngle,
		arc.endAngle,
		arc.counterclockwise
	);
	ctx.stroke();
}

/**
 * 绘制圆
 * @param {Object} circle - 圆对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 */
function drawCircle(circle, ctx) {
	ctx.beginPath();
	ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
	ctx.stroke();
}

/**
 * 绘制矩形
 * @param {Object} rect - 矩形对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 */
function drawRect(rect, ctx) {
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.width, rect.height);
	ctx.stroke();
}

/**
 * 绘制文本
 * @param {Object} text - 文本对象
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {boolean} darkMode - 是否暗色模式
 * @param {boolean} isMirrored - 是否镜像
 */
function drawText(text, ctx, darkMode, isMirrored = false) {
	ctx.save();

	ctx.translate(text.x, text.y);

	if (text.angle) {
		ctx.rotate((text.angle * Math.PI) / 180);
	}

	// 文字需要抵消Y轴翻转
	// 顶层元件：scale(1, -1) 抵消Y轴翻转
	// 底层元件：scale(-1, -1) 抵消Y轴翻转和X轴镜像
	if (isMirrored) {
		ctx.scale(-1, -1);
	} else {
		ctx.scale(1, -1);
	}

	ctx.fillStyle = darkMode ? '#fff' : '#333';
	ctx.font = `${text.fontSize || 10}px sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text.text, 0, 0);

	ctx.restore();
}

/**
 * 获取层的颜色
 * @param {string} layerName - 层名
 * @param {boolean} darkMode - 是否暗色模式
 * @returns {string} 颜色值
 */
function getLayerColor(layerName, darkMode) {
	const layerColors = {
		'TopOverlay': darkMode ? '#e0e0e0' : '#333',
		'BottomOverlay': darkMode ? '#e0e0e0' : '#333',
		'TopPaste': darkMode ? '#aaa' : '#666',
		'BottomPaste': darkMode ? '#aaa' : '#666',
		'TopSolder': darkMode ? '#0a0' : '#006400',
		'BottomSolder': darkMode ? '#0a0' : '#006400',
		'MultiLayer': darkMode ? '#c9c942' : '#808000',
		'KeepOutLayer': darkMode ? '#f00' : '#ff0000',
		'Mechanical': darkMode ? '#888' : '#666',
	};

	return layerColors[layerName] || (darkMode ? '#888' : '#666');
}
