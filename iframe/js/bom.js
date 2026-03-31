// 获取元件的值
function getComponentValue(comp) {
	// 1. 尝试使用 getState_Name() API 获取 Name
	if (comp.getState_Name && typeof comp.getState_Name === 'function') {
		try {
			const nameValue = comp.getState_Name();
			if (nameValue && typeof nameValue === 'string' && nameValue.trim() !== '') {
				const trimmedName = nameValue.trim();

				const match = trimmedName.match(/^=\{([^}]+)\}$/);
				if (match) {
					const propName = match[1].trim();

					if (comp.getState_OtherProperty && typeof comp.getState_OtherProperty === 'function') {
						try {
							const otherProp = comp.getState_OtherProperty();
							if (otherProp && typeof otherProp === 'object') {
								const possibleKeys = [
									propName,
									propName.toLowerCase(),
									propName.toUpperCase(),
									propName.replace(/\s+/g, ''),
									propName.replace(/\s+/g, '_'),
									propName.replace(/\s+/g, '-'),
								];

								for (const key of possibleKeys) {
									if (otherProp[key] !== undefined && otherProp[key] !== null) {
										const val = otherProp[key];
										const result = typeof val === 'string' ? val.trim() : String(val);
										if (result)
											return result;
									}
								}
							}
						}
						catch (e) {
							console.warn('[iBom] Failed to call getState_OtherProperty:', e);
						}
					}

					if (propName.toLowerCase() === 'manufacturer part') {
						if (comp.getState_ManufacturerId && typeof comp.getState_ManufacturerId === 'function') {
							try {
								const mfgId = comp.getState_ManufacturerId();
								if (mfgId && typeof mfgId === 'object') {
									if (mfgId.part || mfgId.Part || mfgId.partNumber || mfgId.PartNumber) {
										const result = mfgId.part || mfgId.Part || mfgId.partNumber || mfgId.PartNumber;
										return typeof result === 'string' ? result.trim() : String(result);
									}
								}
							}
							catch (e) {
								console.warn('[iBom] Failed to call getState_ManufacturerId:', e);
							}
						}

						if (comp.otherProperty && typeof comp.otherProperty === 'object') {
							if (comp.otherProperty.Device && typeof comp.otherProperty.Device === 'string' && comp.otherProperty.Device.trim() !== '') {
								return comp.otherProperty.Device.trim();
							}
						}

						if (comp.getState_Component && typeof comp.getState_Component === 'function') {
							try {
								const component = comp.getState_Component();
								if (component && typeof component === 'object') {
									if (component.title || component.Title || component.name || component.Name) {
										const result = component.title || component.Title || component.name || component.Name;
										return typeof result === 'string' ? result.trim() : String(result);
									}
									if (component.libraryUuid) {
										return component.libraryUuid;
									}
								}
							}
							catch (e) {
								console.warn('[iBom] Failed to call getState_Component:', e);
							}
						}
					}

					return propName;
				}

				return trimmedName.startsWith('=') ? trimmedName.substring(1) : trimmedName;
			}
		}
		catch (e) {
			console.warn('[iBom] Failed to call getState_Name:', e);
		}
	}

	// 2. 降级方案：使用 comp.name
	if (comp.name && typeof comp.name === 'string' && comp.name.trim() !== '') {
		const nameValue = comp.name.trim();
		const match = nameValue.match(/^=\{([^}]+)\}$/);
		if (match) {
			const propName = match[1].trim();
			if (comp.otherProperty && typeof comp.otherProperty === 'object') {
				const possibleKeys = [propName, propName.toLowerCase(), propName.toUpperCase(), propName.replace(/\s+/g, ''), propName.replace(/\s+/g, '_')];
				for (const key of possibleKeys) {
					if (comp.otherProperty[key] !== undefined && comp.otherProperty[key] !== null) {
						const val = comp.otherProperty[key];
						const result = typeof val === 'string' ? val.trim() : String(val);
						if (result)
							return result;
					}
				}
			}
			if (propName.toLowerCase() === 'manufacturer part') {
				if (comp.manufacturerPart && typeof comp.manufacturerPart === 'string' && comp.manufacturerPart.trim() !== '') {
					return comp.manufacturerPart.trim();
				}
			}
			return propName;
		}
		return nameValue.startsWith('=') ? nameValue.substring(1) : nameValue;
	}

	// 3. 使用 Value
	if (comp.value && typeof comp.value === 'string' && comp.value.trim() !== '') {
		return comp.value.trim();
	}

	// 4. 使用 Manufacturer Part
	if (comp.manufacturerPart && typeof comp.manufacturerPart === 'string' && comp.manufacturerPart.trim() !== '') {
		return comp.manufacturerPart.trim();
	}

	// 5. 使用 LCSC Part
	if (comp.lcscPart && typeof comp.lcscPart === 'string' && comp.lcscPart.trim() !== '') {
		return comp.lcscPart.trim();
	}

	return 'unknown';
}

// 获取元件的封装
function getComponentPackage(comp) {
	// 1. 优先使用 getState_OtherProperty() API
	if (comp.getState_OtherProperty && typeof comp.getState_OtherProperty === 'function') {
		try {
			const otherProp = comp.getState_OtherProperty();
			if (otherProp && typeof otherProp === 'object') {
				if (otherProp.Footprint && typeof otherProp.Footprint === 'string') {
					return otherProp.Footprint.trim();
				}
			}
		}
		catch (e) {
			console.warn('[iBom] Failed to call getState_OtherProperty:', e);
		}
	}

	// 2. 降级方案：使用 comp.otherProperty
	if (comp.otherProperty && typeof comp.otherProperty === 'object') {
		if (comp.otherProperty.Footprint && typeof comp.otherProperty.Footprint === 'string') {
			return comp.otherProperty.Footprint.trim();
		}
	}

	// 3. 使用其他属性
	if (comp.footprint && typeof comp.footprint === 'string' && comp.footprint.trim()) {
		return comp.footprint.trim();
	}
	if (comp.footprintName && typeof comp.footprintName === 'string' && comp.footprintName.trim()) {
		return comp.footprintName.trim();
	}
	if (comp.package && typeof comp.package === 'string' && comp.package.trim()) {
		return comp.package.trim();
	}

	return 'unknown';
}

// 解析 BOM 数据
function parseBom(components) {
	const bomMap = new Map();
	const flatList = [];
	let frontCount = 0; let backCount = 0;
	const t = window.i18n ? window.i18n.t.bind(window.i18n) : (key) => key;

	components.forEach((comp) => {
		const isTop = comp.layer === 1 || comp.layer === 11 || comp.layer === 'F';
		if (isTop)
			frontCount++; else backCount++;

		const value = getComponentValue(comp);
		const pkg = getComponentPackage(comp);
		const ref = comp.ref || comp.designator || 'unknown';

		flatList.push({
			id: `flat-${ref}`,
			designators: [ref],
			value,
			package: pkg,
			count: 1,
			layer: isTop ? 'F' : 'B',
			layerText: isTop ? t('layer-top') : t('layer-bottom'),
			rawComponent: comp,
			isFlat: true,
		});

		const key = `${value}+${pkg}`;
		if (!bomMap.has(key)) {
			bomMap.set(key, {
				value,
				package: pkg,
				designators: [],
				layer: isTop ? 'F' : 'B',
				hasTop: isTop,
				hasBottom: !isTop,
				rawComponent: comp,
			});
		}
		const item = bomMap.get(key);
		if (!item.designators.includes(ref))
			item.designators.push(ref);
		if (isTop)
			item.hasTop = true;
		else item.hasBottom = true;
	});

	return {
		bomList: Array.from(bomMap.values()).map((item, i) => ({
			id: i,
			...item,
			count: item.designators.length,
			isFlat: false,
			layerText: (item.hasTop && item.hasBottom) ? t('layer-both') : (item.hasTop ? t('layer-top') : t('layer-bottom')),
		})),
		flatList,
		stats: { front: frontCount, back: backCount, total: components.length },
	};
}
