function RenderMapAssets() {
	return (
		<aside className="sidebar">
			<h2>Assets</h2>
			<ul className="dropdownList">
				<li>
					<div className="dropdown">
						<div className="trigger">
							<h3>Roofs</h3>
						</div>
						<div className="box" data-load="roofs"></div>
					</div>
				</li>
				<li>
					<div className="dropdown">
						<div className="trigger">
							<h3>Roads</h3>
						</div>
					</div>
				</li>
				<li>
					<div className="dropdown">
						<div className="trigger">
							<h3>Background</h3>
						</div>
					</div>
				</li>
			</ul>
		</aside>
	);
}

export default RenderMapAssets;
