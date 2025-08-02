import { useContext, useEffect } from 'react';

import { MapContext } from './mapContext.jsx';
import drawNoise from './drawFiles/drawNoise.jsx';
import drawVoronoi from './drawFiles/drawVoronoi.jsx';
import { getEdges, drawEdges, drawHouses, drawShadows } from './drawFiles/drawingHelpers.js';

function RenderMapCreator() {
	const {
		error,
		setError,
		canvasSize,
		roadStep,
		roadWidth,
		points,
		spriteScale,
		numSprites,
		spriteWidth,
		spriteHeight,
		spritesPerRow,
	} = useContext(MapContext);

	useEffect(() => {
		if (!points || points.length === 0) return;

		const houseSheet = new Image();
		houseSheet.src = '../assets/images/roofs/spritesheet.png';
		houseSheet.onload = () => {
			drawVoronoi('all', {
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
			});
		};
		houseSheet.onerror = () => {
			console.error('Image failed to load');
		};
		//fillGrid();
	}, [points, roadWidth]);

	useEffect(() => {
		const houseSheet = new Image();
		houseSheet.src = '../assets/images/roofs/spritesheet.png';
		houseSheet.onload = () => {
			drawVoronoi('houses', {
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
			});
		};
		houseSheet.onerror = () => {
			console.error('Image failed to load');
		};
	}, [spriteScale]);

	function fillGrid() {
		const xLabels = document.querySelector('.grid .xLabels');
		const yLabels = document.querySelector('.grid .yLabels');
		const width = canvasSize;
		const height = canvasSize;
		const step = 100;

		xLabels.innerHTML = '';
		yLabels.innerHTML = '';

		for (let x = 0; x <= width; x += step) {
			const labelX = document.createElement('div');
			labelX.className = 'labelX';
			labelX.textContent = x;
			labelX.style.left = `${x}px`;
			labelX.style.transform = 'translateX(-50%)';
			xLabels.appendChild(labelX);
		}

		for (let y = 0; y <= height; y += step) {
			const labelY = document.createElement('div');
			labelY.className = 'labelY';
			labelY.textContent = y;
			labelY.style.top = `${y}px`;
			labelY.style.transform = 'translateY(-50%)';
			yLabels.appendChild(labelY);
		}
	}

	return (
		<div className="canvasHolder" style={{ height: canvasSize, width: canvasSize }}>
			<div className="grid">
				<div className="xLabels"></div>
				<div className="yLabels"></div>
			</div>

			<svg style={{ position: 'absolute', width: 0, height: 0 }}>
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

			<canvas
				id="roads"
				height={canvasSize}
				width={canvasSize}
				style={{ filter: 'url(#pencil-filter-)' }}></canvas>
			<canvas id="houses" height={canvasSize} width={canvasSize}></canvas>

			{//<div className="redGrid"></div>
			}
		</div>
	);
}

export default RenderMapCreator;
