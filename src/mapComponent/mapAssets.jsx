import { useEffect } from 'react';

const roofAssets = [
	'Rectangular Roof 4A.png',
	'Rectangular Roof 4B.png',
	'Rectangular Roof 4C.png',
	'Rectangular Roof 4D.png',
	'Rectangular Roof 4E.png',
	'Rectangular Roof 4F.png',
	'Rectangular Roof 4G.png',
	'Rectangular Roof 4H.png',
];

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
						<div className="box">
							{roofAssets.map((filename) => (
								<div key={filename}  className="asset">
									<img src={`/assets/images/roofs/${filename}`} alt={filename} />
									<label>
										<p>Use asset:</p>
										<input type="checkbox" />
									</label>
								</div>
							))}
						</div>
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
