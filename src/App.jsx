import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import CreatePage from "./pages/createPage.jsx";
import NaturalcritLogo from "../assets/svg/NaturalcritLogo.jsx";

const user = "";

function renderLoginButton() {
	if (!user) {
		return <a href={`https://www.naturalcrit.com/login?redirect=${window.location.href}`}>Log in</a>;
	} else {
		return <a href="/maps">My maps</a>;
	}
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
					<Route path="/create" element={<CreatePage />} />
					<Route path="/maps" element={<CreatePage />} />
				</Routes>
			</main>
		</Router>
	);
}

export default App;
