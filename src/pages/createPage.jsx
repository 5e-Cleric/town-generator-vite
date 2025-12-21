import RenderMapAssets from "../mapComponent/mapAssets";
import RenderMapCreator from "../mapComponent/mapCanvas";
import RenderMapSettings from "../mapComponent/mapSettings";
import MapProvider from "../mapComponent/mapContext.jsx";

function CreatePage() {
	return (
		<MapProvider>
			<RenderMapSettings />
			<RenderMapCreator />
			{/* <RenderMapAssets /> */}
		</MapProvider>
	);
}

export default CreatePage;