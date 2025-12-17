import { getMainRoads, getHousePoints, getAccessRoads } from "./drawingHelpers";

function makeMap(points, canvasSize, roadStep, numSprites, spriteScale, spriteHeight) {
	if (!points || points.length === 0) return null;
	if (points.length > 500) return null;
		
	const minDistanceFromEdge = roadStep + 10;
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

export default makeMap;
