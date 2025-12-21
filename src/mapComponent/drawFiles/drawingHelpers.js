import { createNoise2D } from "simplex-noise";

// ############################   Drawing   #############################

export function drawBackground(ctx, canvasSize) {
	const noise2D = createNoise2D();
	const step = 1;
	const noiseScale = 0.001;

	const colorDark = "#80a070";
	const colorMid = "#90b080";
	const colorBright = "#a0c090";

	function hexToRgb(hex) {
		const bigint = parseInt(hex.slice(1), 16);
		return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
	}

	function lerpColor(a, b, t) {
		return a.map((v, i) => Math.floor(v + (b[i] - v) * t));
	}

	function toHex([r, g, b]) {
		return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
	}

	const rgbDark = hexToRgb(colorDark);
	const rgbMid = hexToRgb(colorMid);
	const rgbBright = hexToRgb(colorBright);

	const scale = 4;
	const lowRes = Math.round(canvasSize / scale);
	const offCanvas = document.createElement("canvas");
	offCanvas.width = offCanvas.height = lowRes;
	const offCtx = offCanvas.getContext("2d");
	const imageData = offCtx.createImageData(lowRes, lowRes);
	const data = imageData.data;

	for (let x = 0; x < lowRes; x++) {
		for (let y = 0; y < lowRes; y++) {
			const idx = (y * lowRes + x) * 4;
			const noiseVal = noise2D(x * noiseScale * scale, y * noiseScale * scale);

			let base, target, blend;
			if (noiseVal < 0.5) {
				base = rgbDark;
				target = rgbMid;
				blend = noiseVal * 2;
			} else {
				base = rgbMid;
				target = rgbBright;
				blend = (noiseVal - 0.5) * 2;
			}

			const [r, g, b] = lerpColor(base, target, blend);
			data[idx] = r;
			data[idx + 1] = g;
			data[idx + 2] = b;
			data[idx + 3] = 255;
		}
	}

	offCtx.putImageData(imageData, 0, 0);
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(offCanvas, 0, 0, canvasSize, canvasSize);
}

export function drawMainRoads(
	ctx,
	mainRoads,
	accessRoads,
	roadWidth,
	roadRadius,
	canvasSize,
	roadColor,
	roadOutlineColor
) {
	roadOutlineColor &&
		mainRoads.forEach(({ from, to }, i) => {
			drawEdge(ctx, from[0], from[1], to[0], to[1], roadWidth + 4, roadOutlineColor);
		});

	roadOutlineColor && roadRadius > 2 && drawEdgeCorners(mainRoads, roadWidth + 3, roadRadius, roadOutlineColor, ctx);

	roadOutlineColor &&
		accessRoads.forEach(({ from, to }, i) => {
			drawEdge(ctx, from[0], from[1], to[0], to[1], (roadWidth + 4) / 2, roadOutlineColor);
		});

	const tempCanvas = document.createElement("canvas");
	tempCanvas.width = canvasSize;
	tempCanvas.height = canvasSize;
	const tempCtx = tempCanvas.getContext("2d");

	mainRoads.forEach(({ from, to }) => {
		drawEdge(tempCtx, from[0], from[1], to[0], to[1], roadWidth, roadColor);
	});
	roadRadius > 2 && drawEdgeCorners(mainRoads, roadWidth, roadRadius, roadColor, tempCtx);

	accessRoads.forEach(({ from, to }, i) => {
		drawEdge(tempCtx, from[0], from[1], to[0], to[1], roadWidth / 2, roadColor);
	});

	function drawEdge(canvas, x0, y0, x1, y1, width, color) {
		canvas.beginPath();
		canvas.moveTo(x0, y0);
		canvas.lineTo(x1, y1);
		canvas.strokeStyle = color;
		canvas.lineCap = "round";
		canvas.lineJoin = "round";
		canvas.lineWidth = width;
		canvas.stroke();
	}

	ctx.drawImage(tempCanvas, 0, 0);
}

export function drawEdgeCorners(mainRoads, roadWidth, roadRadius, edgeColor, ctx) {
	let debugIndex = 1;

	// Track processed wedge pairs to prevent duplicates
	const seenPairs = new Set();

	const points = Array.from(new Set(mainRoads.flatMap((e) => [JSON.stringify(e.from), JSON.stringify(e.to)]))).map(
		(str) => JSON.parse(str)
	);

	points.forEach((point) => {
		const connectedMainRoads = mainRoads.filter(
			(e) => (e.from[0] === point[0] && e.from[1] === point[1]) || (e.to[0] === point[0] && e.to[1] === point[1])
		);

		if (connectedMainRoads.length < 2) return;

		// Get angles of connected mainRoads
		const angles = connectedMainRoads.map((e) => {
			const other = e.from[0] === point[0] && e.from[1] === point[1] ? e.to : e.from;
			const angle = Math.atan2(other[1] - point[1], other[0] - point[0]);
			return { edge: e, other, angle };
		});

		// Sort clockwise
		angles.sort((a, b) => a.angle - b.angle);

		for (let i = 0; i < angles.length; i++) {
			const curr = angles[i].other;
			const next = angles[(i + 1) % angles.length].other;

			// Create a unique key for "unordered pair at this point"
			const key = `${point[0]},${point[1]}|${curr[0]},${curr[1]}-${next[0]},${next[1]}`;
			const rkey = `${point[0]},${point[1]}|${next[0]},${next[1]}-${curr[0]},${curr[1]}`;

			// Skip if this wedge was already processed
			if (seenPairs.has(key) || seenPairs.has(rkey)) continue;
			seenPairs.add(key);

			// Skip if mainRoads are directly connected
			const isDirect = mainRoads.some(
				(e) =>
					(e.from[0] === curr[0] && e.from[1] === curr[1] && e.to[0] === next[0] && e.to[1] === next[1]) ||
					(e.from[0] === next[0] && e.from[1] === next[1] && e.to[0] === curr[0] && e.to[1] === curr[1])
			);
			if (isDirect) continue;

			// Compute angles
			const angle1 = Math.atan2(curr[1] - point[1], curr[0] - point[0]);
			const angle2 = Math.atan2(next[1] - point[1], next[0] - point[0]);

			let angleDiff = Math.abs(angle2 - angle1);
			if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

			const halfAngle = angleDiff / 2;

			// Check for tiny/straight angles or inner mainRoads
			const hasInnerEdge = connectedMainRoads.some((e) => {
				const other = e.from[0] === point[0] && e.from[1] === point[1] ? e.to : e.from;
				if (other === curr || other === next) return false;
				const a = Math.atan2(other[1] - point[1], other[0] - point[0]);
				const minA = Math.min(angle1, angle2);
				const maxA = Math.max(angle1, angle2);
				return a > minA && a < maxA;
			});

			if (angleDiff < 1e-3 || Math.abs(angleDiff - Math.PI) < 1e-3) {
				//console.log("Skipping point due to tiny/straight angle", point);
				continue;
			}

			if (hasInnerEdge) {
				//console.log("Skipping point due to inner edge at center", point);
				continue;
			}

			if (hasInnerEdge) continue; // skip this wedge

			//smaller radius and smaller distance if angle is too narrow
			const radius = angleDiff < Math.PI / 4 ? Math.sqrt(roadRadius) / 2 : roadRadius;

			const d_tangent = radius / Math.sin(halfAngle);

			const d_road = roadWidth / 2 / Math.sin(halfAngle);

			const d = d_tangent + d_road; //distance from angle corner point

			let bisector = (angle1 + angle2) / 2;
			if (Math.abs(angle1 - angle2) > Math.PI) bisector += Math.PI;

			const cx = point[0] + d * Math.cos(bisector);
			const cy = point[1] + d * Math.sin(bisector);
			const dist = Math.hypot(cx - point[0], cy - point[1]);

			const t1 = [point[0] + d * Math.cos(bisector - halfAngle), point[1] + d * Math.sin(bisector - halfAngle)];

			const t2 = [point[0] + d * Math.cos(bisector + halfAngle), point[1] + d * Math.sin(bisector + halfAngle)];

			//draw triangle from angle corner point to tangent points
			ctx.save();
			ctx.beginPath();
			ctx.globalCompositeOperation = "sourceOver";
			ctx.moveTo(point[0], point[1]);
			ctx.lineTo(t1[0], t1[1]);
			ctx.lineTo(t2[0], t2[1]);
			ctx.closePath();
			ctx.fillStyle = edgeColor;
			ctx.lineWidth = 1.5;
			ctx.fill();
			ctx.restore();

			//draw circle to erase corner
			ctx.save();
			ctx.globalCompositeOperation = "destination-out";
			ctx.beginPath();
			ctx.arc(cx, cy, radius, 0, Math.PI * 2);
			ctx.fillStyle = "#fff";
			ctx.fill();
			ctx.restore();
			ctx.save();

			debugIndex++;
		}
	});
}

// Helper function: Convex Hull using Graham Scan
function convexHull(points) {
	if (points.length <= 3) return points.slice();

	// Sort points by x, then y
	points = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

	const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

	const lower = [];
	for (const p of points) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
			lower.pop();
		}
		lower.push(p);
	}

	const upper = [];
	for (let i = points.length - 1; i >= 0; i--) {
		const p = points[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
			upper.pop();
		}
		upper.push(p);
	}

	lower.pop();
	upper.pop();
	return lower.concat(upper);
}

export function drawSimpleShadows(
	ctx,
	{ x, y, angle },
	{ spriteScale, spriteWidth, spriteHeight },
	shadowAngle,
	shadowLength
) {
	const rectW = spriteWidth * spriteScale;
	const rectH = spriteHeight * spriteScale;

	// House corners rotated around its center
	const corners = [
		{ x: -rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: rectH / 2 },
		{ x: -rectW / 2, y: rectH / 2 },
	].map(({ x: cx, y: cy }) => {
		const rx = cx * Math.cos(angle) - cy * Math.sin(angle);
		const ry = cx * Math.sin(angle) + cy * Math.cos(angle);
		return { x: x + rx, y: y + ry };
	});

	// Shadow offset
	const length = spriteScale * 10 * shadowLength;
	const sunVec = {
		x: Math.cos(shadowAngle),
		y: Math.sin(shadowAngle),
	};

	// Projected shadow points
	const shadowPoints = corners.map(({ x: cx, y: cy }) => ({
		x: cx + sunVec.x * length,
		y: cy + sunVec.y * length,
	}));

	// Combine house corners + shadow points and compute convex hull
	const allPoints = [...corners, ...shadowPoints];
	const hullPoints = convexHull(allPoints);

	// Draw shadow polygon
	ctx.save();
	ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
	ctx.beginPath();
	hullPoints.forEach(({ x: px, y: py }, i) => {
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	});
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

export function drawHouses(
	ctx,
	{ x, y, angle, spriteIndex },
	{ spriteScale, spriteWidth, spriteHeight, spritesPerRow },
	houseSheet
) {
	const rectW = spriteWidth * spriteScale;
	const rectH = spriteHeight * spriteScale;
	const sx = (spriteIndex % spritesPerRow) * spriteWidth;
	const sy = 0;
	const rectX = -rectW / 2;
	const rectY = -rectH / 2;

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.imageSmoothingEnabled = true;
	ctx.drawImage(houseSheet, sx, sy, spriteWidth, spriteHeight, rectX, rectY, rectW, rectH);
	ctx.restore();
}

export function drawBlurredShadows(
	ctx,
	{ x, y, angle },
	{ spriteScale, spriteWidth, spriteHeight },
	shadowAngle,
	shadowLength
) {
	const rectW = spriteWidth * spriteScale;
	const rectH = spriteHeight * spriteScale;

	// --- 1. ROTATE HOUSE CORNERS ---
	const corners = [
		{ x: -rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: -rectH / 2 },
		{ x: rectW / 2, y: rectH / 2 },
		{ x: -rectW / 2, y: rectH / 2 },
	].map(({ x: cx, y: cy }) => {
		const rx = cx * Math.cos(angle) - cy * Math.sin(angle);
		const ry = cx * Math.sin(angle) + cy * Math.cos(angle);
		return { x: x + rx, y: y + ry };
	});

	// --- 2. SHADOW OFFSET ---
	const length = spriteScale * 10 * shadowLength;
	const sunVec = {
		x: Math.cos(shadowAngle),
		y: Math.sin(shadowAngle),
	};

	const shadowPoints = corners.map(({ x: cx, y: cy }) => ({
		x: cx + sunVec.x * length,
		y: cy + sunVec.y * length,
	}));

	// --- 3. COMBINE + CONVEX HULL ---
	const allPoints = [...corners, ...shadowPoints];
	const hullPoints = convexHull(allPoints);

	// --- 4. DRAW SHADOW USING SLICED BLUR ---
	drawBlurredSlices(ctx, hullPoints, shadowAngle, shadowLength);
}

function drawBlurredSlices(ctx, polygon, shadowAngle, shadowLength) {
	function clipPolygonBetween(polygon, lower, upper) {
		function intersection(a, b, nx, ny, d) {
			const dx = b.x - a.x;
			const dy = b.y - a.y;
			const t = (d - (nx * a.x + ny * a.y)) / (nx * dx + ny * dy);
			return { x: a.x + t * dx, y: a.y + t * dy };
		}

		function clipPolygon(polygon, nx, ny, d, keepAbove) {
			const output = [];

			for (let i = 0; i < polygon.length; i++) {
				const a = polygon[i];
				const b = polygon[(i + 1) % polygon.length];

				const da = nx * a.x + ny * a.y - d;
				const db = nx * b.x + ny * b.y - d;

				const aInside = keepAbove ? da >= 0 : da <= 0;
				const bInside = keepAbove ? db >= 0 : db <= 0;

				if (aInside && bInside) {
					output.push(b);
				} else if (aInside && !bInside) {
					output.push(intersection(a, b, nx, ny, d));
				} else if (!aInside && bInside) {
					output.push(intersection(a, b, nx, ny, d));
					output.push(b);
				}
			}

			return output;
		}

		let poly = clipPolygon(polygon, lower.nx, lower.ny, lower.d, true);
		if (!poly || poly.length === 0) return null;

		poly = clipPolygon(poly, upper.nx, upper.ny, upper.d, false);
		return poly && poly.length > 0 ? poly : null;
	}

	const sliceWidth = 4; // 1px thick slices
	const minBlur = 0.1; // starting blur
	const maxBlur = shadowLength * 0.9; // ending blur

	// Normal vector perpendicular to shadow direction
	const nx = Math.cos(shadowAngle - 0.8 + Math.PI / 2);
	const ny = Math.sin(shadowAngle - 0.8 + Math.PI / 2);

	// Projection range
	const projections = polygon.map((p) => p.x * nx + p.y * ny);
	const minProj = Math.min(...projections);
	const maxProj = Math.max(...projections);
	const totalSlices = Math.ceil(maxProj - minProj);

	for (let t = minProj; t < maxProj; t += sliceWidth) {
		const slicePoly = clipPolygonBetween(polygon, { nx, ny, d: t }, { nx, ny, d: t + sliceWidth });

		if (!slicePoly || slicePoly.length < 3) continue;

		const i = Math.floor(t - minProj);
		const k = i / totalSlices; // 0 → 1 progress
		const blur = minBlur + k * (maxBlur - minBlur);

		ctx.save();
		ctx.filter = `blur(${blur}px)`;
		ctx.fillStyle = "rgba(0,0,0,0.22)";

		ctx.beginPath();
		slicePoly.forEach((p, idx) => {
			if (idx === 0) ctx.moveTo(p.x, p.y);
			else ctx.lineTo(p.x, p.y);
		});
		ctx.closePath();
		ctx.fill();

		ctx.restore();
	}
}

export function drawTrees(ctx, treeStep, treePoints, treeSheet) {
	if (!treePoints || treePoints.length === 0) return null;

	const tileSize = 64;
	const spriteWidth = tileSize;
	const spriteHeight = tileSize;

	treePoints.forEach(({ x, y, tile, angle }) => {
		const randomTile = Math.floor(Math.random() * 3);

		const yCoord = randomTile * tileSize;

		const scale = 1;
		let rectW = treeStep * scale;
		let rectH = treeStep * scale;

		rectW -= (rectW % 2) - 2;
		rectH -= (rectH % 2) - 2;
		const rectX = -rectW / 2;
		const rectY = -rectH / 2;

		let xCoord = 0;
		switch (tile) {
			case "lone":
				ctx.strokeStyle = "white";
				angle = 0;
				xCoord = 0;
				break;
			case "end":
				ctx.strokeStyle = "pink";
				xCoord = 1 * tileSize;
				break;
			case "corner":
				ctx.strokeStyle = "green";
				xCoord = 2 * tileSize;
				break;
			case "sides":
				ctx.strokeStyle = "yellow";
				xCoord = 3 * tileSize;
				break;
			case "side":
				ctx.strokeStyle = "red";
				xCoord = 4 * tileSize;
				break;
			case "center":
				ctx.strokeStyle = "blue";
				xCoord = 5 * tileSize;
				break;
			default:
				break;
		}
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(angle);
		ctx.imageSmoothingEnabled = true;
		//console.table({ x, y, tile, spriteWidth, spriteHeight, angle, xCoord, yCoord, rectX, rectY, rectW, rectH });
		ctx.drawImage(
			treeSheet, // 1️⃣ image
			xCoord, // 2️⃣ source x
			yCoord, // 3️⃣ source y
			spriteWidth, // 4️⃣ source width
			spriteHeight, // 5️⃣ source height
			rectX, // 6️⃣ destination x
			rectY, // 7️⃣ destination y
			rectW, // 8️⃣ destination width
			rectH // 9️⃣ destination height
		);
		//ctx.lineWidth = 1;
		//ctx.strokeRect(rectX, rectY, rectW, rectH);

		ctx.restore();
	});
}
