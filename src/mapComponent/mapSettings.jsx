import { useState, useContext } from 'react';
import { MapContext } from './mapContext.jsx';

function RenderMapSettings() {
	const {
		error,
		setError,
		mode,
		setMode,
		pattern,
		setPattern,
		canvasSize,
		roadStep,
		roadWidth,
		spriteScale,
		setSettings,
	} = useContext(MapContext);

	// local state mirrors settings
	const [localSettings, setLocalSettings] = useState({
		pattern,
		mode,
		canvasSize,
		roadStep,
		roadWidth,
		spriteScale,
	});

	function handleChange(e) {
		const { id, value } = e.target;
		setLocalSettings((prev) => ({
			...prev,
			[id]: isNaN(value) ? value : Number(value),
		}));
	}

	function handleSubmit(e) {
		e.preventDefault();
		setSettings((prev) => ({
			...prev,
			...localSettings,
		}));
	}

	return (
		<aside className="sidebar">
			<h2>Generator Settings</h2>
			<form id="settings" onSubmit={handleSubmit}>
				<label>
					<p>Starting pattern:</p>
					<select id="pattern" value={localSettings.pattern} onChange={handleChange}>
						<option value="voronoi">Voronoi Pattern</option>
						<option value="noise">classic noise</option>
					</select>
				</label>

				<label>
					<p>Displayed output:</p>
					<select id="mode" value={localSettings.mode} onChange={handleChange}>
						<option value="pattern">Pattern</option>
						<option value="roads">Roads</option>
					</select>
				</label>

				<label>
					<p>Canvas Size:</p>
					<input type="number" id="canvasSize" value={localSettings.canvasSize} onChange={handleChange} />
				</label>

				<label>
					<p>Road Density:</p>
					<input
						type="range"
						id="roadStep"
						min="10"
						max="100"
						value={localSettings.roadStep}
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
						step="1"
						value={localSettings.roadWidth}
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
						step="0.1"
						value={localSettings.spriteScale}
						onChange={handleChange}
					/>
				</label>

				<button type="submit">Regenerate</button>
			</form>
		</aside>
	);
}

export default RenderMapSettings;
