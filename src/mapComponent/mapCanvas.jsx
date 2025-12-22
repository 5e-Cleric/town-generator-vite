import { useContext, useEffect, useMemo, useRef } from "react";

import { MapContext } from "./mapContext.jsx";
//import drawNoise from "./drawFiles/drawNoise.jsx";
import { makeMap, getTreePoints } from "./drawFiles/calculationHelpers.js";
import {
	drawBackground,
	drawMainRoads,
	drawHouses,
	drawSimpleShadows,
	drawBlurredShadows,
	drawTrees,
} from "./drawFiles/drawingHelpers";

function RenderMapCreator() {
	const {
		error,
		setError,

		mapSettings,
		layers,

		points,
		densePoints,

		spriteWidth,
		spriteHeight,
		spritesPerRow,
	} = useContext(MapContext);

	const ctxb = layers.background.current?.getContext("2d");
	const ctxr = layers.roads.current?.getContext("2d");
	const ctxs = layers.shadows.current?.getContext("2d");
	const ctxh = layers.houses.current?.getContext("2d");
	const ctxt = layers.trees.current?.getContext("2d");
	const ctxd = layers.debug.current?.getContext("2d");

	const {
		theme,
		canvasSize,

		roadStep,
		roadWidth,
		roadRadius,
		roadColor,
		roadStrokeColor,

		numSprites,
		spriteScale,

		shadowType,
		shadowAngle,
		shadowLength,

		treeStep,
		treeDistance,
	} = mapSettings;

	const spriteSettings = useMemo(
		() => ({
			spriteScale,
			numSprites,
			spriteWidth,
			spriteHeight,
			spritesPerRow,
		}),
		[spriteScale, numSprites, spriteWidth, spriteHeight, spritesPerRow]
	);

	const shadowSettings = useMemo(
		() => ({
			shadowType,
			shadowAngle,
			shadowLength,
		}),
		[shadowType, shadowAngle, shadowLength]
	);

	const safeCanvasSize = Math.min(Math.max(canvasSize, 100), 800);

	const map = useMemo(() => {
		return makeMap(points, safeCanvasSize, roadStep, numSprites, spriteScale, spriteHeight);
	}, [points, numSprites, spriteScale, spriteHeight]);

	const mainRoads = map?.mainRoads;
	const housePoints = map?.housePoints;
	const accessRoads = map?.accessRoads;

	const steppedRoadWidth = useMemo(() => Math.round(roadWidth / 10) * 10, [roadWidth]);
	const treePoints = useMemo(() => {
		return getTreePoints(
			densePoints,
			safeCanvasSize,
			mainRoads,
			housePoints,
			treeStep,
			treeDistance,
			spriteScale,
			steppedRoadWidth
		);
	}, [densePoints, mainRoads, housePoints, treeDistance, steppedRoadWidth, spriteScale]);

	useEffect(() => {
		if (!safeCanvasSize || !ctxb) return;
		drawBackground(ctxb, safeCanvasSize);
	}, [ctxb, safeCanvasSize]);

	const houseSheetRef = useRef(null);
	const treeSheetRef = useRef(null);

	useEffect(() => {
		const houseImg = new Image();
		houseImg.src = "assets/images/roofs/spritesheet3.png";
		houseImg.onload = () => {
			houseSheetRef.current = houseImg;
		};
		houseImg.onerror = () => {
			console.error("House tiles Image failed to load");
		};
		const treeImg = new Image();
		treeImg.src = "assets/images/trees/tree tiles4.png";
		treeImg.onload = () => {
			treeSheetRef.current = treeImg;
		};
		treeImg.onerror = () => {
			console.error("Tree tiles Image failed to load");
		};
	}, []);

	//Drawing the entire map
	useEffect(() => {
		const houseSheet = houseSheetRef.current;
		if (!map) setError({ errorCode: "10", errorText: "We couldn't generate this map, sorry" });
		if (!map || !ctxr || !ctxs || !ctxh || !houseSheet) return;

		if (error?.errorCode === "10") setError(null);

		/*
		//debug points
		ctxd.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		points.forEach((p) => {
			ctxd.save();
			ctxd.fillStyle = "red";
			ctxd.fillRect(p[0], p[1], 5, 5);
			ctxd.restore();
		});
		*/
		ctxr.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		ctxs.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		ctxh.clearRect(0, 0, safeCanvasSize, safeCanvasSize);

		drawMainRoads(ctxr, mainRoads, accessRoads, roadWidth, roadRadius, safeCanvasSize, roadColor, roadStrokeColor);
		housePoints.forEach((p) => {
			if (shadowType !== "noShadow" && shadowLength > 0) {
				if (shadowType === "simpleShadow")
					drawSimpleShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
				if (shadowType === "blurredShadow")
					drawBlurredShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
			}

			drawHouses(ctxh, p, spriteSettings, houseSheet);
		});
	}, [map, numSprites, spriteScale, spriteSettings, ctxh, ctxr, ctxs]);

	//redrawing just the roads
	useEffect(() => {
		const houseSheet = houseSheetRef.current;
		if (!map) setError({ errorCode: "10", errorText: "We couldn't generate this map, sorry" });
		if (!map || !ctxr || !ctxs || !ctxh || !houseSheet) return;

		if (error?.errorCode === "10") setError(null);
		ctxr.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		drawMainRoads(ctxr, mainRoads, accessRoads, roadWidth, roadRadius, safeCanvasSize, roadColor, roadStrokeColor);
	}, [roadWidth, roadRadius, roadColor, roadStrokeColor]);

	//redraw shadows
	useEffect(() => {
		if (!points || points.length === 0 || !map) return;
		if (!mapSettings) return;
		if (shadowType === "noShadow") {
			ctxs.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
			return;
		}
		ctxs.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		housePoints.forEach((p, i) => {
			if (shadowType !== "noShadow" && shadowLength > 0) {
				if (shadowType === "simpleShadow")
					drawSimpleShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
				if (shadowType === "blurredShadow")
					drawBlurredShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
			}
		});
	}, [ctxs, shadowSettings]);

	//drawing the trees
	useEffect(() => {
		const treeSheet = treeSheetRef.current;
		if (!treePoints || treePoints.length > 300 || !ctxt || !map || !treeSheet) return;

		if (error?.errorCode === "11") setError(null);

		ctxt.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
		drawTrees(ctxt, treeStep, treePoints, treeSheet);
	}, [ctxt, safeCanvasSize, treePoints, treeStep]);

	return (
		<div className="canvasHolder" style={{ height: safeCanvasSize, width: safeCanvasSize }}>
			<div className="grid">
				<div className="xLabels"></div>
				<div className="yLabels"></div>
			</div>

			<svg style={{ position: "absolute", width: 0, height: 0 }}>
				<filter id="pencil-filter-5" x="0" y="0" width="2" height="2" filterUnits="objectBoundingBox">
					<feTurbulence type="fractalNoise" baseFrequency="0.2" numOctaves="4" result="noise" />
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale="3"
						xChannelSelector="R"
						yChannelSelector="G"
					/>
				</filter>
			</svg>

			<canvas ref={layers.background} height={safeCanvasSize} width={safeCanvasSize}></canvas>
			<canvas
				ref={layers.roads}
				height={safeCanvasSize}
				width={safeCanvasSize}
				style={{ filter: "url(#pencil-filter-)" }}></canvas>
			<canvas ref={layers.shadows} height={safeCanvasSize} width={safeCanvasSize}></canvas>
			<canvas ref={layers.houses} height={safeCanvasSize} width={safeCanvasSize}></canvas>
			<canvas ref={layers.trees} height={safeCanvasSize} width={safeCanvasSize}></canvas>
			<canvas ref={layers.debug} height={safeCanvasSize} width={safeCanvasSize}></canvas>
		</div>
	);
}

export default RenderMapCreator;
