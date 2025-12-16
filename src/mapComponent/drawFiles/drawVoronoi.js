import { drawBackground, drawMainRoads, drawHouses, drawSimpleShadows, drawBlurredShadows } from "./drawingHelpers";

function drawVoronoi(layers, { mapSettings, spriteSettings, mainRoads, housePoints, accessRoads, houseSheet }) {
	const { canvasSize, roadWidth, roadRadius, shadowType, shadowAngle, shadowLength } = mapSettings;

	drawBackground(layers.background.current, canvasSize);
	drawMainRoads(layers.roads.current, mainRoads, accessRoads, roadWidth, roadRadius, canvasSize);

	const ctxh = layers.houses.current.getContext("2d");
	ctxh.clearRect(0, 0, canvasSize, canvasSize);
	housePoints.forEach((p, i) => {
		if (shadowType !== "noShadow" && shadowLength > 0) {
			if (shadowType === "simpleShadow")
				drawSimpleShadows(ctxh, p, spriteSettings, shadowAngle, shadowLength);
			if (shadowType === "blurredShadow")
				drawBlurredShadows(ctxh, p, spriteSettings, shadowAngle, shadowLength);
		}

		drawHouses(ctxh, p, spriteSettings, houseSheet);
	});

	//points.forEach(([x, y]) => {ctxh.fillStyle = 'red';ctxh.fillRect(x, y, roadStep / 10, roadStep / 10);});
}

export default drawVoronoi;
