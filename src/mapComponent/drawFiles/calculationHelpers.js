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

export function getTreePoints(densePoints, canvasSize, mainRoads, housePoints, roadStep) {
	if (!densePoints || densePoints.length === 0) return null;

	const dist = Math.round(roadStep / 2);
	const minDistSq = 60 ** 2;

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

		if (dx === 0 && dy === 0) return (px - a.x) ** 2 + (py - a.y) ** 2;

		const t = ((px - a.x) * dx + (py - a.y) * dy) / (dx * dx + dy * dy);
		const clampedT = Math.max(0, Math.min(1, t));

		const closest = { x: a.x + clampedT * dx, y: a.y + clampedT * dy };
		return (px - closest.x) ** 2 + (py - closest.y) ** 2;
	};

	// --- Step 1: Fill holes first ---
	const filledPoints = new Set(densePoints.map(([x, y]) => `${x},${y}`));

	const directions8 = [
		[-dist, -dist],
		[0, -dist],
		[dist, -dist],
		[-dist, 0],
		[dist, 0],
		[-dist, dist],
		[0, dist],
		[dist, dist],
	];

	// Fill initial holes based on neighbors
	densePoints.forEach(([x, y]) => {
		directions8.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;
			const key = `${nx},${ny}`;

			if (filledPoints.has(key)) return;

			let neighborCount = 0;
			directions8.forEach(([ddx, ddy]) => {
				if (filledPoints.has(`${nx + ddx},${ny + ddy}`)) neighborCount++;
			});

			if (neighborCount >= 4) filledPoints.add(key);
		});
	});

	// --- Step 1b: Fill points toward canvas borders ---
	function isBorderPoint(point) {
		const { x, y } = point;
		return x === 0 || x === canvasSize || y === 0 || y === canvasSize;
	}

	[...filledPoints].forEach((pointKey) => {
		const [x, y] = pointKey.split(',').map(Number);

		directions8.forEach(([dx, dy]) => {
			let nx = x;
			let ny = y;

			while (true) {
				nx += dx;
				ny += dy;
				const key = `${nx},${ny}`;

				if (filledPoints.has(key) || isBorderPoint({ x: nx, y: ny })) break;

				filledPoints.add(key);
			}
		});
	});

	const filledPointArray = [...filledPoints].map((k) => {
		const [x, y] = k.split(",").map(Number);
		return { x, y };
	});

	// --- Step 2: Remove points too close to houses or main roads ---
	const validPoints = filledPointArray.filter((p) => {
		for (const h of housePoints || []) {
			if (distSq([p.x, p.y], h) < minDistSq) return false;
		}

		for (const road of mainRoads || []) {
			const a = { x: road.from[0], y: road.from[1] };
			const b = { x: road.to[0], y: road.to[1] };
			if (pointToSegmentDistSq([p.x, p.y], a, b) < minDistSq) return false;
		}

		return true;
	});

	const radians = (d) => d * (Math.PI / 180);

	const getSideAngle = ({ top, right, bottom, left }) => {
		if (left && !right) return radians(0);
		if (top && !bottom) return radians(90);
		if (right && !left) return radians(180);
		if (bottom && !top) return radians(270);
		if (left && right) return radians(0);
		if (top && bottom) return radians(90);
	};

	const getCornerAngle = ({ top, right, bottom, left }) => {
		if (left && top) return radians(0);
		if (top && right) return radians(90);
		if (right && bottom) return radians(180);
		if (bottom && left) return radians(270);
	};

	const getEndAngle = ({ top, right, bottom, left }) => {
		if (left) return radians(0);
		if (top) return radians(90);
		if (right) return radians(180);
		if (bottom) return radians(270);
	};

	const tiledTrees = () => {
		const points = validPoints;
		const newTiledTrees = [];
		const hasPoint = (x, y) => points.some((p) => p.x === x && p.y === y);

		points.forEach((point) => {
			const { x, y } = point;

			const neighbors = {
				top: hasPoint(x, y - dist),
				right: hasPoint(x + dist, y),
				bottom: hasPoint(x, y + dist),
				left: hasPoint(x - dist, y),
			};

			const count = Object.values(neighbors).filter(Boolean).length;

			let tile = "lone";
			let angle = null;

			if (count === 4 || isBorderPoint(point)) {
				tile = "center";
			} else if (count === 0) {
				tile = "lone";
			} else if (count === 1) {
				tile = "end";
				angle = getEndAngle(neighbors);
			} else if (count === 2) {
				const isOpposite = (neighbors.top && neighbors.bottom) || (neighbors.left && neighbors.right);
				if (isOpposite) {
					tile = "sides";
					angle = getSideAngle(neighbors);
				} else {
					tile = "corner";
					angle = getCornerAngle(neighbors);
				}
			} else if (count === 3) {
				tile = "side";
				angle = getSideAngle(neighbors);
			}

			newTiledTrees.push({ x, y, tile, ...(angle !== null && { angle }) });
		});

		return newTiledTrees;
	};

	return tiledTrees();
}
