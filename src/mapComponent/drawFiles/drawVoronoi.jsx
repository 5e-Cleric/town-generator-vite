import { Delaunay } from 'https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm';

import {
	getEdges,
	getHousePoints,
	addAccessRoads,
	mergeColinearEdges,
	drawEdges,
	drawHouses,
	drawShadows,
} from './drawingHelpers';

function drawVoronoi({
	mode,
	canvasSize,
	roadStep,
	roadWidth,
	points,
	spriteScale,
	numSprites,
	spriteWidth,
	spriteHeight,
	spritesPerRow,
	houseSheet,
}) {
	const canvas = document.getElementById('town');
	const ctx = canvas.getContext('2d');

	if (!points) return null;

	const voronoiPoints = points.filter(
		([x, y]) => x > roadStep && x < canvasSize - roadStep && y > roadStep && y < canvasSize - roadStep
	);

	const delaunay = Delaunay.from(voronoiPoints);
	const voronoi = delaunay.voronoi([0, 0, canvas.width, canvas.height]);

	ctx.clearRect(0, 0, canvasSize, canvasSize);

	const edges = getEdges(voronoiPoints, voronoi, canvasSize);
	const housePoints = getHousePoints(edges, canvasSize, spriteHeight, numSprites);

	const edgesWithAccessRoads = addAccessRoads(edges, housePoints);

	const simplifiedEdges = mergeColinearEdges(edgesWithAccessRoads);

	const sunPosition = 2;

	const spriteSettings = {
		spriteScale,
		numSprites,
		spriteWidth,
		spriteHeight,
		spritesPerRow,
		houseSheet,
	};

	drawEdges(simplifiedEdges, roadWidth);

	housePoints.forEach((p) => {
		drawShadows(p, spriteSettings, sunPosition);
		drawHouses(p, spriteSettings);
	});

	//voronoiPoints.forEach(([x, y]) => {ctx.fillRect(x, y, roadStep / 10, roadStep / 10);});
}

export default drawVoronoi;
