import { useContext, useState } from "react";
import { MapContext } from "./mapContext.jsx";

import JSZip from "jszip";

function RenderMapSettings() {
	const { mapSettings, setSettings, layers, safeCanvasSize } = useContext(MapContext);

	const [tab, setTab] = useState("settings");

	function handleChange(e) {
		const { id, name, value, type, min, max, dataset } = e.target;

		const mapMin = Number(dataset.mapMin);
		const mapMax = Number(dataset.mapMax);
		const reverse = dataset.reverse === "true";

		// Radios
		if (type === "radio") {
			setSettings((prev) => ({
				...prev,
				[name]: value,
			}));
			return;
		}

		let newValue;

		if (type === "color") {
			newValue = value;
		} else if (Number.isFinite(mapMin) && Number.isFinite(mapMax)) {
			newValue = mapValue(Number(value), Number(min), Number(max), mapMin, mapMax, reverse);
		} else {
			newValue = Number(value);
		}

		setSettings((prev) => ({
			...prev,
			[id]: newValue,
		}));
	}

	function mapValue(value, inMin, inMax, outMin, outMax, reverse = false) {
		let mapped = outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
		if (reverse) {
			mapped = outMax - (mapped - outMin);
		}
		return mapped;
	}

	const downloadMap = () => {
		const refs = Object.values(layers)
			.map((ref) => ref.current)
			.filter(Boolean);

		if (!refs.length) return;

		const combined = document.createElement("canvas");
		combined.width = safeCanvasSize;
		combined.height = safeCanvasSize;

		const ctx = combined.getContext("2d");

		refs.forEach((canvas) => {
			ctx.drawImage(canvas, 0, 0);
		});

		const link = document.createElement("a");
		link.download = "map.png";
		link.href = combined.toDataURL("image/png");
		link.click();
	};

	const downloadMapAsLayers = async () => {
		const zip = new JSZip();

		const layerEntries = [
			["background", layers.background],
			["roads", layers.roads],
			["houses", layers.houses],
			["trees", layers.trees],
		];

		if (mapSettings.shadowType !== "noShadow") {
			layerEntries.splice(2, 0, ["shadows", layers.shadows]);
		}

		for (const [name, ref] of layerEntries) {
			const canvas = ref.current;
			if (!canvas) continue;

			const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

			zip.file(`${name}.png`, blob);
		}

		const zipBlob = await zip.generateAsync({ type: "blob" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(zipBlob);
		link.download = "map.zip";
		link.click();

		URL.revokeObjectURL(link.href);
	};

	const settingsForm = () => {
		return (
			<section className="tab settings">
				<form id="settings">
					<fieldset>
						<h3>General settings</h3>
						<label>
							<p>Canvas Size:</p>
							<input
								type="number"
								id="canvasSize"
								value={mapSettings.canvasSize}
								step={10}
								onChange={handleChange}
							/>
						</label>
					</fieldset>

					<details>
						<summary>Main Roads</summary>
						<label>
							<p>Road Density</p>
							<input
								type="range"
								id="roadStep"
								min="0"
								max="100"
								step="10"
								value={mapValue(mapSettings.roadStep, 40, 100, 0, 100, true)}
								data-map-min={40}
								data-map-max={100}
								data-reverse={true}
								onChange={handleChange}
							/>
						</label>

						<label>
							<p>Road Width:</p>
							<input
								type="range"
								id="roadWidth"
								min="1"
								max="20"
								step="0.2"
								value={mapSettings.roadWidth}
								unit="px"
								onChange={handleChange}
							/>
						</label>

						<label>
							<p>Road Radius</p>
							<input
								type="range"
								id="roadRadius"
								min="0"
								max="20"
								step="0.1"
								value={mapSettings.roadRadius}
								unit="px"
								onChange={handleChange}
							/>
						</label>
						<label>
							<p>Road colors</p>
							<input type="color" id="roadColor" value={mapSettings.roadColor} onChange={handleChange} />
						</label>
						<label>
							<p>Road stroke color</p>
							<input
								type="color"
								id="roadStrokeColor"
								value={mapSettings.roadStrokeColor}
								onChange={handleChange}
							/>
						</label>
					</details>
					<details>
						<summary>Houses</summary>
						<label>
							<p>House sizes:</p>
							<input
								type="range"
								id="spriteScale"
								min="0.2"
								max="1.5"
								step="0.1"
								value={mapSettings.spriteScale}
								onChange={handleChange}
							/>
						</label>
						<div className="radioGroup">
							<label>
								<input
									type="radio"
									name="shadowType"
									value="noShadow"
									checked={mapSettings.shadowType === "noShadow"}
									onChange={handleChange}
								/>
								No Shadow
							</label>

							<label>
								<input
									type="radio"
									name="shadowType"
									value="simpleShadow"
									checked={mapSettings.shadowType === "simpleShadow"}
									onChange={handleChange}
								/>
								Simple Shadow
							</label>

							<label>
								<input
									type="radio"
									name="shadowType"
									value="blurredShadow"
									checked={mapSettings.shadowType === "blurredShadow"}
									onChange={handleChange}
								/>
								Blurred Shadow
							</label>
						</div>

						<label>
							<p>Shadow Angle</p>
							<input
								type="range"
								id="shadowAngle"
								min="0"
								max={(2 * Math.PI).toString()}
								step="0,785398"
								value={mapSettings.shadowAngle}
								unit="rad"
								onChange={handleChange}
								disabled={mapSettings.shadowType === "noShadow" || mapSettings.shadowLength < 1}
								title={
									mapSettings.shadowType === "noShadow" || mapSettings.shadowLength < 1
										? "There is no shadow."
										: ""
								}
							/>
						</label>
						<label>
							<p>Shadow Length</p>
							<input
								type="range"
								id="shadowLength"
								min="0"
								max="10"
								step="0.1"
								value={mapSettings.shadowLength}
								displayedvalue={Math.round(mapSettings.spriteScale * 10 * mapSettings.shadowLength)}
								unit="px"
								onChange={handleChange}
								disabled={mapSettings.shadowType === "noShadow"}
								title={mapSettings.shadowType === "noShadow" ? "There is no shadow." : ""}
							/>
							<small>Note: shadow blurriness depends on the length.</small>
						</label>
					</details>
					<details>
						<summary>Forests</summary>
						<label>
							<p>Forest size</p>
							<input
								type="range"
								id="treeStep"
								min="0"
								max="100"
								step="10"
								value={mapValue(mapSettings.treeStep, 40, 65, 0, 100)}
								data-map-min="40"
								data-map-max="65"
								onChange={handleChange}
							/>
						</label>
						<label>
							<p>Distance from forest to town</p>
							<input
								type="range"
								id="treeDistance"
								min="0"
								max="100"
								step="5"
								value={mapSettings.treeDistance}
								displayedvalue={Math.round(mapSettings.treeDistance)}
								unit="px"
								onChange={handleChange}
							/>
						</label>
					</details>
				</form>
			</section>
		);
	};

	const themePanel = () => {
		const themes = [
			{ id: "default", name: "Default", colors: [], houseSprite: "", treeSprite: "" },
			{ id: "b&w", name: "Black and white", colors: [], houseSprite: "", treeSprite: "" },
			{ id: "parchment", name: "Parchment", colors: [], houseSprite: "", treeSprite: "" },
		];
		console.log(mapSettings.theme);

		return (
			<section className="tab themes">
				<ul className="available">
					{themes.map((theme, i) => {
						return (
							<li key={theme.id}>
								<button
									className="theme"
									onClick={() => setSettings((prev) => ({ ...prev, theme: theme.id }))}
									data-active={mapSettings.theme === theme.id || undefined}
									aria-pressed={mapSettings.theme === theme.id}>
									{theme.name}
								</button>
							</li>
						);
					})}
				</ul>
			</section>
		);
	};

	return (
		<aside className="sidebar">
			<h2>Generator Settings</h2>
			<div className="tabs">
				<button onClick={() => setTab("settings")} data-active={tab === "settings"}>
					Settings
				</button>
				<button onClick={() => setTab("themes")} data-active={tab === "themes"}>
					Themes
				</button>
			</div>

			{tab === "settings" && settingsForm()}
			{tab === "themes" && themePanel()}
			<section className="downloads">
				<button onClick={downloadMap}>Download Map</button>
				<button onClick={downloadMapAsLayers}>Download Map as layers</button>
			</section>
		</aside>
	);
}

export default RenderMapSettings;
