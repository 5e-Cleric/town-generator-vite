function drawNoise({ canvasSize, roadStep, points}) {
	const canvas = document.getElementById('town');
	const ctx = canvas.getContext('2d');


	//points are interpreted all over the tool as objects, and some places as arrays 

	ctx.clearRect(0, 0, canvasSize, canvasSize);

	let roadPoints = points;

	for (let i = 0; i <= canvasSize; i += roadStep) {
		roadPoints.push({ x: 0, y: i });
		roadPoints.push({ x: canvasSize - roadStep / 2, y: i });
		roadPoints.push({ x: i, y: 0 });
		roadPoints.push({ x: i, y: canvasSize - roadStep / 2 });
	}

	console.log(`${roadPoints.length} points`);
	const mainRoads = joinPoints(roadPoints);

	const squares = joinMainRoads(mainRoads);

	const corners = joinCorners(mainRoads);
	//draw mainRoads


	console.log(mainRoads, squares, corners);
	const pointSize = roadStep / 4;

	ctx.beginPath();
	ctx.strokeStyle = 'black';
	ctx.lineWidth = pointSize * 2;
	mainRoads.forEach(({ from, to }) => {
		ctx.moveTo(from.x + pointSize, from.y + pointSize);
		ctx.lineTo(to.x + pointSize, to.y + pointSize);
	});
	ctx.stroke();

	ctx.beginPath();
	ctx.beginPath();
	ctx.fillStyle = '#000000';
	squares.forEach(({ from, to }) => {
		const height = to.y - from.y;
		const width = to.x - from.x;
		ctx.fillRect(from.x, from.y, width, height);
	});
	ctx.stroke();

	ctx.beginPath();
	ctx.fillStyle = '#000000';
	corners.forEach(({ center, points }) => {
		ctx.moveTo(center.x, center.y);
		ctx.lineTo(points[0].x, points[0].y);
		ctx.lineTo(points[1].x, points[1].y);

		ctx.closePath();
	});
	ctx.fill();

	function joinPoints(points) {
			console.log(points);
		let pointsUpdated = [];
		let mainRoads = [];

		for (let j = 0; j < points.length; j++) {
			let point = { i: j, x: points[j].x, y: points[j].y, pathTo: [] };

			let leftCoord = { x: point.x - roadStep, y: point.y };
			let rightCoord = { x: point.x + roadStep, y: point.y };
			let topCoord = { x: point.x, y: point.y + roadStep };
			let botCoord = { x: point.x, y: point.y - roadStep };
			//console.log("punto", j+1, ": ", points[j]);
			//console.log('busco: ', leftCoord);

			for (let k = j + 1; k < points.length; k++) {
				if (points[k].x === leftCoord.x && points[k].y === leftCoord.y) {
					point.pathTo.push(k);
				}
				if (points[k].x === rightCoord.x && points[k].y === rightCoord.y) {
					point.pathTo.push(k);
				}
				if (points[k].x === topCoord.x && points[k].y === topCoord.y) {
					point.pathTo.push(k);
				}
				if (points[k].x === botCoord.x && points[k].y === botCoord.y) {
					point.pathTo.push(k);
				}
			}

			pointsUpdated.push(point);
		}

		for (let l = 0; l < pointsUpdated.length; l++) {
			const currentPoint = pointsUpdated[l];
			if (currentPoint.pathTo.length !== 0) {
				for (let n = 0; n < currentPoint.pathTo.length; n++) {
					mainRoads.push({ from: pointsUpdated[l], to: pointsUpdated[pointsUpdated[l].pathTo[n]] });
				}
			}
		}

		//console.table(pointsUpdated);;
		return mainRoads;
	}

	function joinMainRoads(mainRoads) {
		let squares = [];
		let seen = new Set();

		for (let i = 0; i < mainRoads.length; i++) {
			const edge1 = mainRoads[i];

			for (let j = i + 1; j < mainRoads.length; j++) {
				const edge2 = mainRoads[j];

				if (isSquare(edge1, edge2)) {
					const xs = [edge1.from.x, edge1.to.x, edge2.from.x, edge2.to.x];
					const ys = [edge1.from.y, edge1.to.y, edge2.from.y, edge2.to.y];

					const from = { x: Math.min(...xs), y: Math.min(...ys) };
					const to = { x: Math.max(...xs), y: Math.max(...ys) };
					const key = `${from.x},${from.y},${to.x},${to.y}`;

					if (seen.has(key)) continue;
					seen.add(key);

					squares.push({ from, to });
				}
			}
		}

		return squares;
	}

	function joinCorners(mainRoads) {
		let corners = [];
		let seen = new Set();

		for (let i = 0; i < mainRoads.length; i++) {
			const edge1 = mainRoads[i];

			for (let j = i + 1; j < mainRoads.length; j++) {
				const edge2 = mainRoads[j];

				if (isCorner(edge1, edge2)) {
					const points = [edge1.from, edge1.to, edge2.from, edge2.to];
					const unique = {};

					points.forEach((p) => {
						const key = `${p.x},${p.y}`;
						unique[key] = p;
					});

					const shared = Object.values(unique).filter(
						(p) => points.filter((q) => q.x === p.x && q.y === p.y).length > 1
					)[0];

					const others = Object.values(unique).filter((p) => p !== shared);
					const key = `${shared.x},${shared.y},${others.map((p) => `${p.x},${p.y}`).join(',')}`;

					if (seen.has(key)) continue;
					seen.add(key);

					corners.push({ center: shared, points: others });
				}
			}
		}

		return corners;
	}

	function isCorner(edge1, edge2) {
		const sharedX =
			edge1.from.x === edge2.from.x ||
			edge1.from.x === edge2.to.x ||
			edge1.to.x === edge2.from.x ||
			edge1.to.x === edge2.to.x;
		const sharedY =
			edge1.from.y === edge2.from.y ||
			edge1.from.y === edge2.to.y ||
			edge1.to.y === edge2.from.y ||
			edge1.to.y === edge2.to.y;

		const isPerpendicular =
			(edge1.from.x === edge1.to.x && edge2.from.y === edge2.to.y) ||
			(edge1.from.y === edge1.to.y && edge2.from.x === edge2.to.x);

		return sharedX && sharedY && isPerpendicular;
	}

	function isSquare(edge1, edge2) {
		const isHorizontal = edge1.from.y === edge1.to.y && edge2.from.y === edge2.to.y;
		const isVertical = edge1.from.x === edge1.to.x && edge2.from.x === edge2.to.x;

		if (!(isHorizontal || isVertical)) return false;

		// Check distance between mainRoads
		if (isHorizontal) {
			const dy = Math.abs(edge1.from.y - edge2.from.y);
			if (dy !== roadStep) return false;
		} else {
			const dx = Math.abs(edge1.from.x - edge2.from.x);
			if (dx !== roadStep) return false;
		}

		// Calculate bounding box
		const xs = [edge1.from.x, edge1.to.x, edge2.from.x, edge2.to.x];
		const ys = [edge1.from.y, edge1.to.y, edge2.from.y, edge2.to.y];

		const xMin = Math.min(...xs);
		const xMax = Math.max(...xs);
		const yMin = Math.min(...ys);
		const yMax = Math.max(...ys);

		// Check if bounding box is square of roadStep size
		return xMax - xMin === roadStep && yMax - yMin === roadStep;
	}
}

export default drawNoise;
