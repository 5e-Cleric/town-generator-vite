import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";

function pointsEqual(a, b) {
	return a[0] === b[0] && a[1] === b[1];
}

function mainRoadsEqual(e1, e2) {
	return (
		(pointsEqual(e1.from, e2.from) && pointsEqual(e1.to, e2.to)) ||
		(pointsEqual(e1.from, e2.to) && pointsEqual(e1.to, e2.from))
	);
}

function distSquared([x1, y1], [x2, y2]) {
	const dx = x2 - x1,
		dy = y2 - y1;
	return dx * dx + dy * dy;
}

function isParallel(edgeA, edgeB) {
	const dx1 = edgeA.to[0] - edgeA.from[0];
	const dy1 = edgeA.to[1] - edgeA.from[1];
	const dx2 = edgeB.to[0] - edgeB.from[0];
	const dy2 = edgeB.to[1] - edgeB.from[1];
	return Math.abs(dx1 * dy2 - dy1 * dx2) < 0.01;
}

function isBorderEdge(edge, canvasSize) {
	const { from, to } = edge;
	return [from, to].some(([x, y]) => x === 0 || x === canvasSize || y === 0 || y === canvasSize);
}

function isFullBorderEdge(edge, canvasSize) {
	const { from, to } = edge;
	if (from[0] === to[0] && (from[0] === 0 || from[0] === canvasSize)) return true;
	if (from[1] === to[1] && (from[1] === 0 || from[1] === canvasSize)) return true;
	return false;
}

function mainRoadsTooClose(e1, e2, minDist = 50) {
	const dists = [
		distSquared(e1.from, e2.from),
		distSquared(e1.from, e2.to),
		distSquared(e1.to, e2.from),
		distSquared(e1.to, e2.to),
	];
	const minDistSq = minDist * minDist;
	return dists.some((d) => d < minDistSq);
}

function filterMainRoads(mainRoads, canvasSize) {
	const keptMainRoads = [];

	for (const edge of mainRoads) {
		if (!isBorderEdge(edge, canvasSize)) {
			keptMainRoads.push(edge);
			continue;
		}
		if (isFullBorderEdge(edge, canvasSize)) continue;

		let shouldSkip = false;
		for (const e of keptMainRoads) {
			if (isBorderEdge(e, canvasSize) && (isParallel(e, edge) || mainRoadsTooClose(e, edge))) {
				shouldSkip = true;
				break;
			}
		}
		if (!shouldSkip) keptMainRoads.push(edge);
	}

	return keptMainRoads;
}

function getMainRoads(points, canvasSize) {
	const unFilteredMainRoads = [];
	const voronoi = Delaunay.from(points).voronoi([0, 0, canvasSize, canvasSize]);

	for (let i = 0; i < points.length; i++) {
		const poly = voronoi.cellPolygon(i);
		if (!poly) continue;

		for (let j = 0; j < poly.length - 1; j++) {
			const from = poly[j];
			const to = poly[j + 1];
			if (!!from[0] && !!to[0]) unFilteredMainRoads.push({ from, to });
		}
	}

	const mainRoads = removeDuplicates(filterMainRoads(unFilteredMainRoads, canvasSize));
	return mainRoads;
}

function removeDuplicates(mainRoads) {
	const unique = [];
	for (const e of mainRoads) {
		if (!unique.some((u) => mainRoadsEqual(u, e))) {
			unique.push(e);
		}
	}
	return unique;
}

function getHousePoints(mainRoads, canvasSize, spriteHeight, numSprites) {
	const density = parseFloat(localStorage.getItem("houseDensity")) || 0.1;
	const minDist = Math.round(spriteHeight * 50);
	const offset = Math.round(spriteHeight * 50 + 5);
	//ideally values around 30

	const housePoints = [];
	const houseMainRoads = mainRoads.filter((e) => !isBorderEdge(e, canvasSize));

	function isTooCloseToEdge({ x, y }) {
		const minDistSq = (minDist - 5) ** 2;
		return mainRoads.some(({ from, to }) => {
			const dx = to[0] - from[0];
			const dy = to[1] - from[1];
			const lenSq = dx * dx + dy * dy;
			const t = Math.max(0, Math.min(1, ((x - from[0]) * dx + (y - from[1]) * dy) / lenSq));
			const projX = from[0] + t * dx;
			const projY = from[1] + t * dy;
			return distSquared([x, y], [projX, projY]) < minDistSq;
		});
	}

	for (const { from, to } of houseMainRoads) {
		const dx = to[0] - from[0];
		const dy = to[1] - from[1];
		const length = Math.sqrt(dx * dx + dy * dy);
		const count = Math.floor(length * density);
		const angle = Math.atan2(dy, dx);

		const offsetX = Math.sin(angle) * offset;
		const offsetY = -Math.cos(angle) * offset;

		for (let i = 0; i <= count; i++) {
			const t = i / count;
			const baseX = from[0] + dx * t;
			const baseY = from[1] + dy * t;
			const jitter = 3;
			const randX = baseX + (Math.random() * 2 - 1) * jitter;
			const randY = baseY + (Math.random() * 2 - 1) * jitter;

			const candidates = [
				{ x: randX + offsetX, y: randY + offsetY, angle },
				{ x: randX - offsetX, y: randY - offsetY, angle },
			];

			for (const p of candidates) {
				if (
					!isTooCloseToEdge(p) &&
					!housePoints.some((h) => distSquared([p.x, p.y], [h.x, h.y]) < minDist ** 2.2)
				) {
					p.spriteIndex = Math.floor(Math.random() * numSprites);
					housePoints.push(p);
				}
			}
		}
	}

	return housePoints;
}

function getAccessRoads(mainRoads, housePoints) {
	const accessRoads = [];

	for (const house of housePoints) {
		let closestPoint = null;
		let minDistSq = Infinity;

		for (const { from, to } of mainRoads) {
			const dx = to[0] - from[0];
			const dy = to[1] - from[1];
			const lenSq = dx * dx + dy * dy;
			const t = Math.max(0, Math.min(1, ((house.x - from[0]) * dx + (house.y - from[1]) * dy) / lenSq));
			const projX = from[0] + t * dx;
			const projY = from[1] + t * dy;

			const dSq = distSquared([house.x, house.y], [projX, projY]);
			if (dSq < minDistSq) {
				minDistSq = dSq;
				closestPoint = [projX, projY];
			}
		}

		if (closestPoint) {
			accessRoads.push({ from: [house.x, house.y], to: closestPoint });
		}
	}

	return accessRoads;
}

export function makeMap(points, canvasSize, roadStep, numSprites, spriteScale, spriteHeight) {
	if (!points || points.length === 0) return null;
	if (points.length > 500) return null;

	const minDistanceFromEdge = roadStep * 4;
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

export function getTreePoints(densePoints, canvasSize, mainRoads, housePoints, treeStep, treeDistance, spriteScale, roadWidth) {
	if (!densePoints || densePoints.length === 0) return null;

	const dist = treeStep;
	const minDistSqRoads = (treeDistance + roadWidth) ** 2;
	const minDistSqHouses = (treeDistance *spriteScale + 30) ** 2

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

	// Step 1b: Add border candidate points and fill toward canvas edges
	const borderCandidates = [];

	densePoints.forEach(([x, y]) => {
		const dirs = [
			[0, -dist * 2], // up
			[dist * 2, 0], // right
			[0, dist * 2], // down
			[-dist * 2, 0], // left
		];

		dirs.forEach(([dx, dy]) => {
			const nx = x + dx;
			const ny = y + dy;

			// only add if inside canvas
			if (nx >= 0 && nx <= canvasSize && ny >= 0 && ny <= canvasSize) {
				const key = `${nx},${ny}`;
				if (!filledPoints.has(key)) {
					borderCandidates.push({ x: nx, y: ny });
					filledPoints.add(key);
				}
			}
		});
	});

	// Now fill each candidate outward toward the canvas edge
	borderCandidates.forEach(({ x, y }) => {
		const dirs = [
			[0, -dist], // up
			[dist, 0], // right
			[0, dist], // down
			[-dist, 0], // left
		];

		dirs.forEach(([dx, dy]) => {
			let nx = x;
			let ny = y;

			while (nx >= 0 && nx <= canvasSize && ny >= 0 && ny <= canvasSize) {
				const key = `${nx},${ny}`;
				if (filledPoints.has(key) || isBorderPoint({ x: nx, y: ny })) break;

				filledPoints.add(key);
				nx += dx;
				ny += dy;
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
			if (distSq([p.x, p.y], h) < minDistSqHouses) return false;
		}

		for (const road of mainRoads || []) {
			const a = { x: road.from[0], y: road.from[1] };
			const b = { x: road.to[0], y: road.to[1] };
			if (pointToSegmentDistSq([p.x, p.y], a, b) < minDistSqRoads) return false;
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
	function isBorderPoint(point) {
		const { x, y } = point;
		return x === 0 || x === canvasSize || y === 0 || y === canvasSize;
	}
	function isCornerPoint(point) {
		const { x, y } = point;
		return (
			(x === 0 && y === 0) ||
			(x === canvasSize && y === 0) ||
			(x === 0 && y === 0) ||
			(x === 0 && y === canvasSize)
		);
	}

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

			if (count === 0) {
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
				if (isCornerPoint(point)) {
					tile = "center";
				}
			} else if (count === 3) {
				tile = "side";
				angle = getSideAngle(neighbors);
			} else if (count === 4) tile = "center";

			newTiledTrees.push({ x, y, tile, ...(angle !== null && { angle }) });
		});

		return newTiledTrees;
	};

	return tiledTrees();
}
