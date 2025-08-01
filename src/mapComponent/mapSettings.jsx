import { useContext } from 'react';
import { MapContext } from './mapContext.jsx';

function RenderMapSettings() {
	const { canvasSize, roadStep, roadWidth, spriteScale, setSettings } =
		useContext(MapContext);

	function handleChange(e) {
		const { id, value } = e.target;
		const newValue = id === 'roadStep' ? 100 - Number(value) : isNaN(value) ? value : Number(value);
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
					<input type="number" id="canvasSize" value={canvasSize} onChange={handleChange} />
				</label>

				<label>
					<p>Road Density:</p>
					<input
						type="range"
						id="roadStep"
						min="10"
						max="100"
						step='1'
						value={100 - roadStep}
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
						value={roadWidth}
						onChange={handleChange}
					/>
				</label>

				<label>
					<p>House sizes:</p>
					<input
						type="range"
						id="spriteScale"
						min="0"
						max="2"
						step="0.02"
						value={spriteScale}
						onChange={handleChange}
					/>
				</label>
			</form>
		</aside>
	);
}

export default RenderMapSettings;
