import { getMainRoads, getHousePoints, getAccessRoads } from "./drawingHelpers";

export function makeMap(points, canvasSize, roadStep, numSprites, spriteScale, spriteHeight) {
	if (!points || points.length === 0) return null;
	if (points.length > 500) return null;

	const minDistanceFromEdge = roadStep + roadStep*1.5;
	const filteredPoints = points.filter(
		([x, y]) =>
			x > minDistanceFromEdge &&
			x < canvasSize - minDistanceFromEdge &&
			y > minDistanceFromEdge &&
			y < canvasSize - minDistanceFromEdge
	);

	const mainRoads = getMainRoads(filteredPoints, canvasSize);
	const housePoints = getHousePoints(mainRoads, canvasSize, spriteScale, spriteHeight, numSprites);
	const accessRoads = getAccessRoads(mainRoads, housePoints);

	/*
	console.group("Numbers:");
	const Numbers = {
		"Points": points.length,
		"Voronoi Points": points.length,
		"Main Roads": mainRoads.length,
		"Main Roads Drawn": mainRoads.length * 2,
		"House Points": housePoints.length,
		"Access Roads": accessRoads.length,
	};
	console.table(Numbers);
	console.groupEnd("Numbers:");
	*/

	return {
		mainRoads,
		housePoints,
		accessRoads,
	};
}

export function getTreePoints(negativePoints, canvasSize, mainRoads, housePoints) {
	if (!negativePoints || negativePoints.length === 0) return null;

	const minDistSq = 40 ** 2;

	const distSq = (a, b) => {
		const ax = a[0],
			ay = a[1];
		const bx = b.x,
			by = b.y;
		return (ax - bx) ** 2 + (ay - by) ** 2;
	};

	const pointToSegmentDistSq = (pArr, a, b) => {
		const [px, py] = pArr;

		const dx = b.x - a.x;
		const dy = b.y - a.y;

		if (dx === 0 && dy === 0) {
			return (px - a.x) ** 2 + (py - a.y) ** 2;
		}

		const t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy);
		const clampedT = Math.max(0, Math.min(1, t));

		const closest = {
			x: a.x + clampedT * dx,
			y: a.y + clampedT * dy,
		};

		return (px - closest.x) ** 2 + (py - closest.y) ** 2;
	};

	return negativePoints.filter((p) => {
		for (const h of housePoints || []) {
			if (distSq(p, h) < minDistSq) return false;
		}

		for (const road of mainRoads || []) {
			const a = { x: road.from[0], y: road.from[1] };
			const b = { x: road.to[0], y: road.to[1] };
			if (pointToSegmentDistSq(p, a, b) < minDistSq) return false;
		}

		return true;
	});
}
