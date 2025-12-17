import { useContext, useEffect, useMemo, useRef } from "react";

import { MapContext } from "./mapContext.jsx";
//import drawNoise from "./drawFiles/drawNoise.jsx";
import makeMap from "./drawFiles/makeMap.js";
import {
	drawBackground,
	drawMainRoads,
	drawHouses,
	drawSimpleShadows,
	drawBlurredShadows,
} from "./drawFiles/drawingHelpers";

function RenderMapCreator() {
	const {
		error,
		setError,
		devMode,
		setDevMode,

		mapSettings,
		points,

		spriteWidth,
		spriteHeight,
		spritesPerRow,
	} = useContext(MapContext);

	const layers = {
		background: useRef(null),
		roads: useRef(null),
		shadows: useRef(null),
		houses: useRef(null),
	};
	const ctxb = layers.background.current?.getContext("2d");
	const ctxr = layers.roads.current?.getContext("2d");
	const ctxs = layers.shadows.current?.getContext("2d");
	const ctxh = layers.houses.current?.getContext("2d");

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
	const roadColor = "#d8d1bc";
	const roadOutlineColor = "#809070";

	const map = useMemo(() => {
		return makeMap(points, safeCanvasSize, roadStep, numSprites, spriteScale, spriteHeight);
	}, [points, roadStep, numSprites, spriteScale, spriteHeight]);

	const mainRoads = map?.mainRoads;
	const housePoints = map?.housePoints;
	const accessRoads = map?.accessRoads;

	useEffect(() => {
		if (!safeCanvasSize || !ctxb) return;
		if (devMode) {
			ctxb.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
			ctxb.fillStyle = "#aaa";
			ctxb.fillRect(0, 0, safeCanvasSize, safeCanvasSize);
			return;
		}
		drawBackground(ctxb, safeCanvasSize);
	}, [ctxb, devMode, safeCanvasSize]);

	useEffect(() => {
		if (!map) setError({ errorCode: "10", errorText: "We couldn't generate this map, sorry" });
		if (!map || !ctxr || !ctxs || !ctxh) return;

		setError(null);
		const houseSheet = new Image();
		houseSheet.src = "assets/images/roofs/spritesheet3.png";
		houseSheet.onload = async () => {
			try {
				ctxr.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
				!devMode &&
					drawMainRoads(
						ctxr,
						mainRoads,
						accessRoads,
						roadWidth,
						roadRadius,
						safeCanvasSize,
						roadColor,
						roadOutlineColor
					);
				ctxs.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
				ctxh.clearRect(0, 0, safeCanvasSize, safeCanvasSize);
				!devMode &&
					housePoints.forEach((p, i) => {
						if (shadowType !== "noShadow" && shadowLength > 0) {
							if (shadowType === "simpleShadow")
								drawSimpleShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
							if (shadowType === "blurredShadow")
								drawBlurredShadows(ctxs, p, spriteSettings, shadowAngle, shadowLength);
						}

						drawHouses(ctxh, p, spriteSettings, houseSheet);
					});

				if (devMode) {
					drawMainRoads(ctxr, mainRoads, accessRoads, 5, 0, safeCanvasSize, "#c679c0ff", null);

					housePoints.forEach((housePoint) => {
						const rectW = spriteWidth * spriteScale;
						const rectH = spriteHeight * spriteScale;
						const hw = rectW / 2;
						const hh = rectH / 2;
						ctxh.save();
						ctxh.translate(housePoint.x, housePoint.y);
						ctxh.rotate(housePoint.angle);

						// Polygon from center
						ctxh.beginPath();
						ctxh.moveTo(-hw, -hh);
						ctxh.lineTo(hw, -hh);
						ctxh.lineTo(hw, hh);
						ctxh.lineTo(-hw, hh);
						ctxh.closePath();
						ctxh.fillStyle = `hsl(${Math.random() * 360}, 60%, 55%)`;
						ctxh.fill();
						ctxh.clip();
						ctxh.restore();
					});

					points.forEach(([x, y]) => {
						ctxh.fillStyle = "red";
						ctxh.fillRect(x, y, roadStep / 10, roadStep / 10);
					}); //Drawing the points
				}
			} catch (error) {
				console.error(error);
				setError(error);
			}
		};
		houseSheet.onerror = () => {
			console.error("Image failed to load");
		};
		//fillGrid();
	}, [map, devMode, roadWidth, roadRadius, numSprites, spriteScale, spriteSettings, ctxh, ctxr, ctxs]);

	useEffect(() => {
		//redraw shadows
		if (!points || points.length === 0 || !map) return;
		if (!mapSettings) return;
		if (shadowType === "noShadow") return;
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

	function fillGrid() {
		const xLabels = document.querySelector(".grid .xLabels");
		const yLabels = document.querySelector(".grid .yLabels");
		const width = safeCanvasSize;
		const height = safeCanvasSize;
		const step = 100;

		xLabels.innerHTML = "";
		yLabels.innerHTML = "";

		for (let x = 0; x <= width; x += step) {
			const labelX = document.createElement("div");
			labelX.className = "labelX";
			labelX.textContent = x;
			labelX.style.left = `${x}px`;
			labelX.style.transform = "translateX(-50%)";
			xLabels.appendChild(labelX);
		}

		for (let y = 0; y <= height; y += step) {
			const labelY = document.createElement("div");
			labelY.className = "labelY";
			labelY.textContent = y;
			labelY.style.top = `${y}px`;
			labelY.style.transform = "translateY(-50%)";
			yLabels.appendChild(labelY);
		}
	}

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
						scale="5"
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

			{
				//	<div className="redGrid"></div>
			}
		</div>
	);
}

export default RenderMapCreator;
