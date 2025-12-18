import { getMainRoads, getHousePoints, getAccessRoads } from "./drawingHelpers";

export function makeMap(points, canvasSize, roadStep, numSprites, spriteScale, spriteHeight) {
	if (!points || points.length === 0) return null;
	if (points.length > 500) return null;

	const minDistanceFromEdge = roadStep + roadStep * 1.5;
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

export function getTreePoints(points, canvasSize, mainRoads, housePoints) {
	if (!points || points.length === 0) return null;

	const minDistSq = 70 ** 2;

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

	const finalPoints = points.filter((p) => {
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

	const getCornerAngle = ({ top, right, bottom, left }) => {
		if (top && right) return 0;
		if (right && bottom) return 90;
		if (bottom && left) return 180;
		if (left && top) return 270;
	};

	const getSideAngle = ({ top, right, bottom, left }) => {
		if (top && !bottom) return 0;
		if (right && !left) return 90;
		if (bottom && !top) return 180;
		if (left && !right) return 270;

		if (left && right) return 90;
		if (top && bottom) return 0;
	};

	const tiledTrees = () => {
		const points = finalPoints.map(([x, y]) => ({ x, y }));

		const newTiledTrees = [];

		const hasPoint = (x, y) => points.some((p) => p.x === x && p.y === y);

		points.forEach((point) => {
			const { x, y } = point;

			const neighbors = {
				top: hasPoint(x, y - 1),
				right: hasPoint(x + 1, y),
				bottom: hasPoint(x, y + 1),
				left: hasPoint(x - 1, y),
			};

			const count = Object.values(neighbors).filter(Boolean).length;

			let tile = "lone";
			let angle = null;

			if (count === 0) {
				tile = "lone";
			} else if (count === 4) {
				tile = "center";
			} else if (count === 3) {
				tile = "side";
				angle = getSideAngle(neighbors);
			} else if (count === 2) {
				const isOpposite = (neighbors.top && neighbors.bottom) || (neighbors.left && neighbors.right);

				if (isOpposite) {
					tile = "side";
					angle = getSideAngle(neighbors);
				} else {
					tile = "corner";
					angle = getCornerAngle(neighbors);
				}
			} else if (count === 1) {
				tile = "side";
				angle = getSideAngle(neighbors);
			}

			newTiledTrees.push({
				x,
				y,
				tile,
				...(angle !== null && { angle }),
			});
		});

		console.log(newTiledTrees);
		return newTiledTrees;
	};

	return tiledTrees();
}
