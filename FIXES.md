# 封装解析修复说明

## 问题
封装文件源码解析未正常工作，无法正常渲染在交互式BOM弹窗的预览图上。

## 根本原因
解析器未正确处理EasyEDA Pro的封装文件格式，主要问题：

1. **PAD焊盘**：未解析 `defaultPad` 数组来获取焊盘形状和尺寸
2. **LINE直线**：字段名称错误（应使用 `startX/startY/endX/endY`）
3. **ARC圆弧**：未正确计算圆弧的中心点和半径
4. **POLY折线**：未正确解析混合格式的path数组

## 修复内容

### 1. PAD焊盘解析 (footprint-parser.js:120-158)
- 解析 `defaultPad` 数组：`["ROUND", width, height]` 或 `["RECT", width, height, radius]`
- 根据 `defaultPad[0]` 判断形状：ROUND → circle/oval, RECT → rectangle
- 正确提取宽度和高度：`defaultPad[1]` 和 `defaultPad[2]`

### 2. LINE直线解析 (footprint-parser.js:159-183)
- 使用正确的字段名：`startX`, `startY`, `endX`, `endY`
- 添加 `Number()` 类型转换确保数值正确

### 3. ARC圆弧解析 (footprint-parser.js:186-220)
- 从 `startX/startY/endX/endY` 计算圆心和半径
- 使用圆的包围盒更新边界

### 4. POLY折线解析 (footprint-parser.js:221-270)
- 正确解析混合数组格式：`[x, y, "L", x, y, "ARC", angle, x, y, ...]`
- 跳过命令字符串（L, ARC, CARC, C等）
- 只提取坐标点

## 参考文档
EasyEDA Pro文件格式文档：https://prodocs.lceda.cn/cn/format/index/
