import react from 'react';
import './App.css';
import RenderMapAssets from './mapComponent/mapAssets';
import RenderMapCreator from './mapComponent/mapCanvas';
import RenderMapSettings from './mapComponent/mapSettings';
import MapProvider from './mapComponent/mapContext';

function App() {

	return (
		<>
			<main>
				<MapProvider>
					<RenderMapSettings />
					<RenderMapCreator />
					{//<RenderMapAssets />
					}
				</MapProvider>
			</main>
		</>
	);
}

export default App;
