import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";

import {
	getEdges,
	getHousePoints,
	getAccessRoads,
	drawBackground,
	drawEdges,
	drawHouses,
	drawShadows,
} from "./drawingHelpers";

function drawVoronoi(
	mode,
	{
		canvasSize,
		roadStep,
		roadWidth,
		roadRadius,
		points,
		spriteScale,
		numSprites,
		spriteWidth,
		spriteHeight,
		spritesPerRow,
		houseSheet,
	}
) {
	const canvasHouses = document.getElementById("houses");
	const ctxh = canvasHouses.getContext("2d");

	if (!points || points.length === 0) return null;

	drawBackground(canvasSize);

	const voronoiPoints = points.filter(
		([x, y]) => x > roadStep && x < canvasSize - roadStep && y > roadStep && y < canvasSize - roadStep
	);

	const delaunay = Delaunay.from(voronoiPoints);
	const voronoi = delaunay.voronoi([0, 0, canvasSize, canvasSize]);

	const edges = getEdges(voronoiPoints, voronoi, canvasSize);
	const housePoints = getHousePoints(edges, canvasSize, spriteScale, spriteHeight, numSprites);
	const accessRoads = getAccessRoads(edges, housePoints);
	//const simplifiedEdges = mergeColinearEdges(edgesWithAccessRoads);
	drawEdges(edges, accessRoads, roadWidth, roadRadius, canvasSize);

	//drawEdgeCorners(edgesWithAccessRoads, roadWidth);

	const sunPosition = 2;

	const spriteSettings = {
		spriteScale,
		numSprites,
		spriteWidth,
		spriteHeight,
		spritesPerRow,
		houseSheet,
	};
	ctxh.clearRect(0, 0, canvasSize, canvasSize);
	
	housePoints.forEach((p, i) => {
		drawShadows(p, spriteSettings, sunPosition);
		drawHouses(p, spriteSettings);
	});

	//voronoiPoints.forEach(([x, y]) => {ctxh.fillStyle = 'red';ctxh.fillRect(x, y, roadStep / 10, roadStep / 10);});
}

export default drawVoronoi;
