import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import RenderMapAssets from "./mapComponent/mapAssets";
import RenderMapCreator from "./mapComponent/mapCanvas";
import RenderMapSettings from "./mapComponent/mapSettings";
import MapProvider from "./mapComponent/mapContext";

import NaturalcritLogo from "../assets/svg/NaturalcritLogo.jsx";

const user = "";

function renderLoginButton() {
	if (!user) {
		return <a href={`https://www.naturalcrit.com/login?redirect=${window.location.href}`}>Log in</a>;
	} else {
		return <a href="/maps">My maps</a>;
	}
}

// Separate MapPage component to wrap with MapProvider
function MapPage() {
	return (
		<MapProvider>
			<RenderMapSettings />
			<RenderMapCreator />
			{/* <RenderMapAssets /> */}
		</MapProvider>
	);
}

function App() {
	return (
		<Router basename="/town-generator-vite">
			<header>
				<NaturalcritLogo />
				{renderLoginButton()}
			</header>
			<main>
				<Routes>
					<Route path="/" element={<Navigate to="/create" />} />
					<Route path="/create" element={<MapPage />} />
					<Route path="/maps" element={<MapPage />} />
				</Routes>
			</main>
		</Router>
	);
}

export default App;
