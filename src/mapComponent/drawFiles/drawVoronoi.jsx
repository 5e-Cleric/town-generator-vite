import { Delaunay } from "https://cdn.jsdelivr.net/npm/d3-delaunay@6/+esm";

import {
	getMainRoads,
	getHousePoints,
	getAccessRoads,
	drawBackground,
	drawMainRoads,
	drawHouses,
	drawSimpleShadows,
	drawBlurredShadows,
} from "./drawingHelpers";

function drawVoronoi(mode, { points, mapSettings, spriteSettings, houseSheet }) {
	const {
		canvasSize,
		roadStep,
		roadWidth,
		roadRadius,
		numSprites,
		spriteScale,
		shadowType,
		shadowAngle,
		shadowLength,
	} = mapSettings;
	const { spriteHeight } = spriteSettings;

	const canvasHouses = document.getElementById("houses");
	const ctxh = canvasHouses.getContext("2d");

	if (!points || points.length === 0) return null;
	if (points.length > 500) throw new Error("This map is too big, sorry!");

	points = points.filter(
		([x, y]) => x > roadStep && x < canvasSize - roadStep && y > roadStep && y < canvasSize - roadStep
	);

	const mainRoads = getMainRoads(points, canvasSize);
	const housePoints = getHousePoints(mainRoads, canvasSize, spriteScale, spriteHeight, numSprites);

	drawBackground(canvasSize);

	const accessRoads = getAccessRoads(mainRoads, housePoints);

	drawMainRoads(mainRoads, accessRoads, roadWidth, roadRadius, canvasSize);

	ctxh.clearRect(0, 0, canvasSize, canvasSize);
	housePoints.forEach((p, i) => {
		if (shadowType !== "noShadow" && shadowLength > 0) {
			if (shadowType === "simpleShadow") drawSimpleShadows(p, spriteSettings, shadowAngle, shadowLength);
			if (shadowType === "blurredShadow") drawBlurredShadows(p, spriteSettings, shadowAngle, shadowLength);
		}

		drawHouses(p, spriteSettings, houseSheet);
	});

	//points.forEach(([x, y]) => {ctxh.fillStyle = 'red';ctxh.fillRect(x, y, roadStep / 10, roadStep / 10);});

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
}

export default drawVoronoi;
