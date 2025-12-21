import { useContext } from "react";
import { MapContext } from "./mapContext.jsx";

function RenderMapSettings() {
	const { mapSettings, setSettings } = useContext(MapContext);
	const ROAD_STEP_MIN = 40; // densest
	const ROAD_STEP_MAX = 100; // sparsest
	const ROAD_STEP_RANGE = ROAD_STEP_MAX - ROAD_STEP_MIN;

	function handleChange(e) {
		const { id, name, value, type } = e.target;

		// Radios
		if (type === "radio") {
			setSettings((prev) => ({
				...prev,
				[name]: value,
			}));
			return;
		}

		let newValue = Number(value);

		if (id === "roadStep") {
			// Map 0-100 slider inversely to ROAD_STEP_MIN - ROAD_STEP_MAX
			newValue = ROAD_STEP_MAX - ROAD_STEP_RANGE * (Number(value) / 100);
		}

		setSettings((prev) => ({
			...prev,
			[id]: newValue,
		}));
	}

	return (
		<aside className="sidebar">
			<h2>Generator Settings</h2>
			<form id="settings">
				<fieldset>
					<h3>General settings</h3>
					<label>
						<p>Canvas Size:</p>
						<input type="number" id="canvasSize" value={mapSettings.canvasSize} step={10} onChange={handleChange} />
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
							value={Math.round(((ROAD_STEP_MAX - mapSettings.roadStep) / ROAD_STEP_RANGE) * 100)}
							onChange={handleChange}
						/>
					</label>

					<label>
						<p>Road Width:</p>
						<input
							type="range"
							id="roadWidth"
							min="5"
							max="20"
							step="0.2"
							value={mapSettings.roadWidth}
							unit="px"
							onChange={handleChange}
						/>
					</label>

					<label>
						<p>Road Radius:</p>
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
							title={mapSettings.shadowType === "noShadow" ? "There is no shadow type selected." : ""}
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
							min="40"
							max="65"
							step="5"
							value={mapSettings.treeStep}
							displayedvalue={Math.round(mapSettings.treeStep)}
							unit="px"
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
		</aside>
	);
}

export default RenderMapSettings;
