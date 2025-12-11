import { useContext } from "react";
import { MapContext } from "./mapContext.jsx";

function RenderMapSettings() {
	const { mapSettings, setSettings } = useContext(MapContext);

	const roadStepMaximum = 180;

	function handleChange(e) {
		const { id, value } = e.target;
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
				<label>
					<p>Canvas Size:</p>
					<input type="number" id="canvasSize" value={mapSettings.canvasSize} onChange={handleChange} />
				</label>

				<label>
					<p>Road Density:</p>
					<input
						type="range"
						id="roadStep"
						min="10"
						max={roadStepMaximum.toString()}
						step="1"
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
						step="0.1"
						value={mapSettings.roadWidth}
						onChange={handleChange}
					/>
				</label>

				<label>
					<p>Road Radius:</p>
					<input
						type="range"
						id="roadRadius"
						min="1"
						max="20"
						step="0.1"
						value={mapSettings.roadRadius}
						onChange={handleChange}
					/>
				</label>

				<label>
					<p>House sizes:</p>
					<input
						type="range"
						id="spriteScale"
						min="0.2"
						max="1.5"
						step="0.02"
						value={mapSettings.spriteScale}
						onChange={handleChange}
					/>
				</label>
				<label>
					<p>Shadow's Angle</p>
					<input
						type="range"
						id="shadowAngle"
						min="0"
						max={(2 * Math.PI).toString()}
						step="0.1"
						value={mapSettings.shadowAngle}
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
						onChange={handleChange}
					/>
				</label>
			</form>
		</aside>
	);
}

export default RenderMapSettings;
