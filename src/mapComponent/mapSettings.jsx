import { useContext } from "react";
import { MapContext } from "./mapContext.jsx";

function RenderMapSettings() {
	const { devMode, setDevMode, mapSettings, setSettings } = useContext(MapContext);

	const roadStepMaximum = 200;

	function handleChange(e) {
		const { id, name, value, type } = e.target;

		// Radios: use name, raw value
		if (type === "radio") {
			setSettings((prev) => ({
				...prev,
				[name]: value,
			}));
			return;
		}

		// Existing numeric + special case handling
		const newValue = id === "roadStep" ? roadStepMaximum - Number(value) : isNaN(value) ? value : Number(value);

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
						<input type="number" id="canvasSize" value={mapSettings.canvasSize} onChange={handleChange} />
					</label>
					<label>
						<p>Dev mode:</p>
						<input type="checkbox" id="devMode" value={devMode} onChange={()=> setDevMode(!devMode)} />
					</label>
				</fieldset>
				<details>
					<summary>Main Roads</summary>
					<label>
						<p>Road Density:</p>
						<input
							type="range"
							id="roadStep"
							min="40"
							max={roadStepMaximum.toString()}
							step="5"
							value={roadStepMaximum - mapSettings.roadStep}
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
						/>
						<small>Note: shadow blurriness depends on the length.</small>
					</label>
				</details>
			</form>
		</aside>
	);
}

export default RenderMapSettings;
