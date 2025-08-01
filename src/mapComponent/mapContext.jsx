import { createContext, useState, useEffect } from 'react';
import { createNoise2D } from 'simplex-noise';

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
		spriteScale: 0.5,
		numSprites: 8,
	});

	const { canvasSize, roadStep, noiseScale, roadThreshold } = mapSettings;

	const [points, setPoints] = useState([]);

	const [settingsLoaded, setSettingsLoaded] = useState(false);

	useEffect(() => {
		setSettings((prev) => ({
			...prev,
			canvasSize: parseInt(localStorage.getItem('canvasSize')) || prev.canvasSize,
			roadStep: parseInt(localStorage.getItem('roadDensity')) || prev.roadStep,
			roadWidth: parseInt(localStorage.getItem('roadWidth')) || prev.roadWidth,
			spriteScale: parseFloat(localStorage.getItem('houseSize')) || prev.spriteScale,
			numSprites: prev.numSprites,
		}));

		setSettingsLoaded(true);
	}, []);

	useEffect(() => {
		if (!settingsLoaded) return;

		const newPoints = [];
		for (let x = 0; x < canvasSize; x += roadStep) {
			for (let y = 0; y < canvasSize; y += roadStep) {
				const noiseVal = noise2D(x * noiseScale, y * noiseScale);
				if (noiseVal > roadThreshold) {
					newPoints.push([x, y]);
				}
			}
		}

		console.log('reloading points');
		setPoints(newPoints);
	}, [canvasSize, roadStep, noiseScale, roadThreshold, settingsLoaded]);

	useEffect(() => {
		if (!settingsLoaded) return;

		localStorage.setItem('canvasSize', mapSettings.canvasSize);
		localStorage.setItem('roadDensity', mapSettings.roadStep);
		localStorage.setItem('roadWidth', mapSettings.roadWidth);
		localStorage.setItem('houseSize', mapSettings.spriteScale);
	}, [mapSettings, settingsLoaded]);

	return (
		<MapContext.Provider
			value={{
				error,
				setError,

				...mapSettings,
				setSettings,

				points,
				spriteWidth,
				spriteHeight,
				spritesPerRow,
			}}>
			{children}
		</MapContext.Provider>
	);
};

export default MapProvider;
