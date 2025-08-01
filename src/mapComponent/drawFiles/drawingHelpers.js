export function pointsEqual(a, b) {
	return a[0] === b[0] && a[1] === b[1];
}

export function edgesEqual(e1, e2) {
	return (
		(pointsEqual(e1.from, e2.from) && pointsEqual(e1.to, e2.to)) ||
		(pointsEqual(e1.from, e2.to) && pointsEqual(e1.to, e2.from))
	);
}

export function distSquared([x1, y1], [x2, y2]) {
	const dx = x2 - x1,
		dy = y2 - y1;
	return dx * dx + dy * dy;
}

export function isParallel(edgeA, edgeB) {
	const dx1 = edgeA.to[0] - edgeA.from[0];
	const dy1 = edgeA.to[1] - edgeA.from[1];
	const dx2 = edgeB.to[0] - edgeB.from[0];
	const dy2 = edgeB.to[1] - edgeB.from[1];
	return Math.abs(dx1 * dy2 - dy1 * dx2) < 0.01;
}

export function isBorderEdge(edge, canvasSize) {
	const { from, to } = edge;
	return [from, to].some(([x, y]) => x === 0 || x === canvasSize || y === 0 || y === canvasSize);
}

export function isFullBorderEdge(edge, canvasSize) {
	const { from, to } = edge;
	if (from[0] === to[0] && (from[0] === 0 || from[0] === canvasSize)) return true;
	if (from[1] === to[1] && (from[1] === 0 || from[1] === canvasSize)) return true;
	return false;
}

export function edgesTooClose(e1, e2, minDist = 50) {
	const dists = [
		distSquared(e1.from, e2.from),
		distSquared(e1.from, e2.to),
		distSquared(e1.to, e2.from),
		distSquared(e1.to, e2.to),
	];
	const minDistSq = minDist * minDist;
	return dists.some((d) => d < minDistSq);
}

export function filterEdges(edges, canvasSize) {
	const keptEdges = [];

	for (const edge of edges) {
		if (!isBorderEdge(edge, canvasSize)) {
			keptEdges.push(edge);
			continue;
		}
		if (isFullBorderEdge(edge, canvasSize)) continue;

		let shouldSkip = false;
		for (const e of keptEdges) {
			if (isBorderEdge(e, canvasSize) && (isParallel(e, edge) || edgesTooClose(e, edge))) {
				shouldSkip = true;
				break;
			}
		}
		if (!shouldSkip) keptEdges.push(edge);
	}

	return keptEdges;
}

export function getEdges(points, voronoi, canvasSize) {
	const unFilteredEdges = [];

	for (let i = 0; i < points.length; i++) {
		const poly = voronoi.cellPolygon(i);
		if (!poly) continue;

		for (let j = 0; j < poly.length - 1; j++) {
			const from = poly[j];
			const to = poly[j + 1];
			if (!!from[0] && !!to[0]) unFilteredEdges.push({ from, to });
		}
	}

	const edges = removeDuplicates(filterEdges(unFilteredEdges, canvasSize));
	return edges;
}

export function removeDuplicates(edges) {
	const unique = [];
	for (const e of edges) {
		if (!unique.some((u) => edgesEqual(u, e))) {
			unique.push(e);
		}
	}
	return unique;
}

export function getHousePoints(edges, canvasSize, spriteHeight, numSprites) {
	const density = parseFloat(localStorage.getItem('houseDensity')) || 0.1;
	const minDist = spriteHeight / 5;
	const offset = spriteHeight / 2;
	const housePoints = [];
	const houseEdges = edges.filter((e) => !isBorderEdge(e, canvasSize));

	function isTooCloseToEdge({ x, y }) {
		const minDistSq = (minDist - 5) ** 2;
		return edges.some(({ from, to }) => {
			const dx = to[0] - from[0];
			const dy = to[1] - from[1];
			const lenSq = dx * dx + dy * dy;
			const t = Math.max(0, Math.min(1, ((x - from[0]) * dx + (y - from[1]) * dy) / lenSq));
			const projX = from[0] + t * dx;
			const projY = from[1] + t * dy;
			return distSquared([x, y], [projX, projY]) < minDistSq;
		});
	}
 
	for (const { from, to } of houseEdges) {
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

export function addAccessRoads(edges, housePoints) {
	const accessRoads = [];

	for (const house of housePoints) {
		let closestPoint = null;
		let minDistSq = Infinity;

		for (const { from, to } of edges) {
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

	return edges.concat(accessRoads);
}

export function mergeColinearEdges(edges) {
	const merged = [];
	const used = new Set();

	for (let i = 0; i < edges.length; i++) {
		if (used.has(i)) continue;

		let current = edges[i];
		used.add(i);

		let mergedThisRound;
		do {
			mergedThisRound = false;

			for (let j = 0; j < edges.length; j++) {
				if (used.has(j)) continue;
				const candidate = edges[j];
				if (!isParallel(current, candidate)) continue;

				let sharedPoint = null;
				if (pointsEqual(current.from, candidate.from)) sharedPoint = { from: current.to, to: candidate.to };
				else if (pointsEqual(current.from, candidate.to))
					sharedPoint = { from: current.to, to: candidate.from };
				else if (pointsEqual(current.to, candidate.from))
					sharedPoint = { from: current.from, to: candidate.to };
				else if (pointsEqual(current.to, candidate.to))
					sharedPoint = { from: current.from, to: candidate.from };

				if (sharedPoint) {
					current = sharedPoint;
					used.add(j);
					mergedThisRound = true;
					break;
				}
			}
		} while (mergedThisRound);

		merged.push(current);
	}

	return merged;
}

// ############################   Drawing   #############################

export function drawEdges(edges, roadWidth, canvasSize) {
	const canvas = document.getElementById('roads');
	const ctx = canvas.getContext('2d');

	ctx.clearRect(0, 0, canvasSize, canvasSize);

	const lengths = edges.map(({ from, to }) => Math.hypot(to[0] - from[0], to[1] - from[1]));

	const minLen = Math.min(...lengths);
	const maxLen = Math.max(...lengths);

	edges.forEach(({ from, to }, i) => {
		const norm = (lengths[i] - minLen) / (maxLen - minLen || 1);
		ctx.beginPath();
		ctx.moveTo(from[0], from[1]);
		ctx.lineTo(to[0], to[1]);
		ctx.strokeStyle = '#809070';
		ctx.lineCap = 'round';
		ctx.lineJoin = 'mitter';
		ctx.lineWidth = roadWidth * 10 * (0.03 + norm * 0.07) + 4;
		ctx.stroke();
	});

	edges.forEach(({ from, to }, i) => {
		const norm = (lengths[i] - minLen) / (maxLen - minLen || 1);
		ctx.beginPath();
		ctx.moveTo(from[0], from[1]);
		ctx.lineTo(to[0], to[1]);
		ctx.strokeStyle = '#d8d1bc';
		ctx.lineCap = 'round';
		ctx.lineJoin = 'mitter';
		ctx.lineWidth = roadWidth * 10 * (0.03 + norm * 0.07);
		ctx.stroke();
	});
}

function ensureClockwise(points) {
	let sum = 0;
	for (let i = 0; i < points.length; i++) {
		const p1 = points[i];
		const p2 = points[(i + 1) % points.length];
		sum += (p2.x - p1.x) * (p2.y + p1.y);
	}
	if (sum > 0) points.reverse();
	return points;
}

export function drawShadows(
	{ x, y, angle },
	{ spriteScale, numSprites, spriteWidth, spriteHeight, spritesPerRow, houseSheet },
	sunPosition
) {
	const canvas = document.getElementById('houses');
	const ctx = canvas.getContext('2d');

	const rectW = spriteWidth * spriteScale;
	const rectH = spriteHeight * spriteScale;

	let corners = [
		{ x: -rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: rectH / 2 },
		{ x: -rectW / 2, y: rectH / 2 },
	].map(({ x: cx, y: cy }) => {
		const rx = cx * Math.cos(angle) - cy * Math.sin(angle);
		const ry = cx * Math.sin(angle) + cy * Math.cos(angle);
		return { x: x + rx, y: y + ry };
	});

	corners = ensureClockwise(corners);

	const shadowLength = 10;
	const sunVec = {
		x: Math.cos(sunPosition),
		y: Math.sin(sunPosition),
	};

	const shadowPoints = corners.map(({ x: cx, y: cy }) => ({
		x: cx + sunVec.x * shadowLength,
		y: cy + sunVec.y * shadowLength,
	}));

	const polygon = [...corners, ...shadowPoints.slice().reverse()];

	ctx.save();
	ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
	ctx.beginPath();
	polygon.forEach(({ x: px, y: py }, i) => {
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	});
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

export function drawHouses(
	{ x, y, angle, spriteIndex },
	{ spriteScale, spriteWidth, spriteHeight, spritesPerRow, houseSheet }
) {
	const canvas = document.getElementById('houses');
	const ctx = canvas.getContext('2d');

	const rectW = spriteWidth * spriteScale;
	const rectH = spriteHeight * spriteScale;
	const sx = (spriteIndex % spritesPerRow) * spriteWidth;
	const sy = 0;
	const rectX = -rectW / 2;
	const rectY = -rectH / 2;

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.drawImage(houseSheet, sx, sy, spriteWidth, spriteHeight, rectX, rectY, rectW, rectH);
	ctx.restore();
}
