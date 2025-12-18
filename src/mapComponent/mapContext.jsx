import { createContext, useState, useEffect } from "react";
import { createNoise2D } from "simplex-noise";

export const MapContext = createContext();

export const MapProvider = ({ children }) => {
	const [error, setError] = useState({ errorCode: null, errorText: null });

	const noise2D = createNoise2D();

	const spriteWidth = 38;
	const spriteHeight = 64;
	const spritesPerRow = 8;

	const [mapSettings, setSettings] = useState({
		canvasSize: 600,
		roadStep: 60,
		noiseScale: 0.1,
		roadThreshold: 0,
		roadWidth: 10,
		roadRadius: 5,
		spriteScale: 0.5,
		numSprites: 8,
		shadowType: "simpleShadows",
		shadowAngle: 2,
		shadowLength: 18,
	});

	//settings that warrant a recalculation of the road structure
	const { canvasSize, roadStep, noiseScale, roadThreshold } = mapSettings;

	const safeCanvasSize = Math.min(Math.max(canvasSize, 100), 800);

	const [points, setPoints] = useState([]);
	const [negativePoints, setNegativePoints] = useState([]);

	const [settingsLoaded, setSettingsLoaded] = useState(false);

	useEffect(() => {
		setSettings((prev) => ({
			...prev,
			canvasSize: parseInt(localStorage.getItem("canvasSize")) || prev.canvasSize,
			roadStep: parseInt(localStorage.getItem("roadDensity")) || prev.roadStep,
			roadWidth: parseInt(localStorage.getItem("roadWidth")) || prev.roadWidth,
			roadRadius: parseInt(localStorage.getItem("roadWidth")) || prev.roadRadius,
			spriteScale: parseFloat(localStorage.getItem("houseSize")) || prev.spriteScale,
			shadowType: localStorage.getItem("shadowType") || prev.shadowType,
			shadowAngle: parseFloat(localStorage.getItem("shadowAngle")) || prev.shadowAngle,
			shadowLength: parseFloat(localStorage.getItem("shadowLength")) || prev.shadowLength,
			numSprites: prev.numSprites,
		}));

		setSettingsLoaded(true);
	}, []);

	useEffect(() => {
		if (!settingsLoaded) return;

		const newPoints = [];
		const negatives = [];
		for (let x = 0; x < canvasSize; x += roadStep) {
			for (let y = 0; y < canvasSize; y += roadStep) {
				const noiseVal = noise2D(x * noiseScale, y * noiseScale);
				if (noiseVal > roadThreshold) {
					newPoints.push([x, y]);
				} else {
					negatives.push([x, y]);
				}
			}
		}

		setPoints(newPoints);
		setNegativePoints(negatives);
	}, [safeCanvasSize, roadStep, noiseScale, roadThreshold, settingsLoaded]);

	useEffect(() => {
		if (!settingsLoaded) return;

		localStorage.setItem("canvasSize", mapSettings.canvasSize);
		localStorage.setItem("roadDensity", mapSettings.roadStep);
		localStorage.setItem("roadWidth", mapSettings.roadWidth);
		localStorage.setItem("roadRadius", mapSettings.roadRadius);
		localStorage.setItem("houseSize", mapSettings.spriteScale);
		localStorage.setItem("shadowType", mapSettings.shadowType);
		localStorage.setItem("shadowAngle", mapSettings.shadowAngle);
		localStorage.setItem("shadowLength", mapSettings.shadowLength);
	}, [mapSettings, settingsLoaded]);

	function renderError() {
		if (!error) return null;

		return (
			<div className="error">
				Error {error.errorCode}: {error.errorText}
			</div>
		);
	}

	return (
		<MapContext.Provider
			value={{
				error,
				setError,
				mapSettings,
				setSettings,

				points,
				negativePoints,
				spriteWidth,
				spriteHeight,
				spritesPerRow,
			}}>
			{renderError()}
			{children}
		</MapContext.Provider>
	);
};

export default MapProvider;
