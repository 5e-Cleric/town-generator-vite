import { drawBackground, drawMainRoads, drawHouses, drawSimpleShadows, drawBlurredShadows } from "./drawingHelpers";

function drawVoronoi(layers, { mapSettings, spriteSettings, mainRoads, housePoints, accessRoads, houseSheet }) {

	const { canvasSize, roadWidth, roadRadius, shadowType, shadowAngle, shadowLength } = mapSettings;

	const ctxh = layers.houses.current.getContext("2d");

	drawBackground(layers.background.current, canvasSize);
	drawMainRoads(layers.roads.current, mainRoads, accessRoads, roadWidth, roadRadius, canvasSize);

	ctxh.clearRect(0, 0, canvasSize, canvasSize);
	housePoints.forEach((p, i) => {
		if (shadowType !== "noShadow" && shadowLength > 0) {
			if (shadowType === "simpleShadow") drawSimpleShadows(layers.houses.current, p, spriteSettings, shadowAngle, shadowLength);
			if (shadowType === "blurredShadow") drawBlurredShadows(layers.houses.current, p, spriteSettings, shadowAngle, shadowLength);
		}

		drawHouses(layers.houses.current, p, spriteSettings, houseSheet);
	});

	//points.forEach(([x, y]) => {ctxh.fillStyle = 'red';ctxh.fillRect(x, y, roadStep / 10, roadStep / 10);});
}

export default drawVoronoi;
