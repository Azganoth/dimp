import React, { useReducer, useRef, useState } from 'react';
import { Button, Col, Layout, Row, Space, Tooltip, notification } from 'antd';
import { BarChartOutlined, ToolOutlined } from '@ant-design/icons';

import Toolbox from 'app/components/Toolbox';
import { getCanvasImage, setCanvasImage } from 'app/logic/helpers';
import { BorderMarker } from 'app/logic/challenges';

const { Header, Content } = Layout;

notification.config({
	duration: 2,
	placement: 'bottomRight',
});

let borderMarker: BorderMarker | undefined;

type PixelShowcase = {
	r: number | 'R';
	g: number | 'G';
	b: number | 'B';
	a: number | 'A';
};

export default () => {
	const [, forceUpdate] = useReducer((x) => x + 1, 0);

	const [toolboxVisible, setToolboxVisible] = useState(false);

	const openToolbox = () => {
		setToolboxVisible(true);
	};

	const closeToolbox = () => {
		setToolboxVisible(false);
	};

	const [challenges, setChallenges] = useState(false);

	// PIXEL SHOWCASE
	// stores each channel value of the pixel below the mouse pointer (only when the mouse is inside a canvas)

	const [pixelShowcase, setPixelShowcase] = useState<PixelShowcase>({ r: 'R', g: 'G', b: 'B', a: 'A' });

	const updatePixelShowcase = (value: PixelShowcase = { r: 'R', g: 'G', b: 'B', a: 'A' }) => {
		setPixelShowcase(value);
	};

	// CANVASES

	// eslint-disable-next-line unicorn/no-null
	const canvas1Ref = useRef<HTMLCanvasElement | null>(null);
	// eslint-disable-next-line unicorn/no-null
	const canvas2Ref = useRef<HTMLCanvasElement | null>(null);
	// eslint-disable-next-line unicorn/no-null
	const canvas3Ref = useRef<HTMLCanvasElement | null>(null);

	const canvasMouseMove = ({ target, nativeEvent: { offsetX, offsetY } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		const [r, g, b, a] = canvas.getContext('2d')!.getImageData(offsetX, offsetY, 1, 1).data;
		updatePixelShowcase({ r, g, b, a });

		if (!challenges) {
			return;
		}

		// border drawing
		if (borderMarker) {
			const { imageData } = borderMarker;

			// undo last marked border using the original image data
			setCanvasImage(imageData, canvas);

			// mark the image with a green border and redraw the image into the canvas
			setCanvasImage(borderMarker.draw(offsetX, offsetY), canvas);
		}
	};

	const canvasMouseDown = ({ target, nativeEvent: { offsetX, offsetY } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		if (!challenges) {
			return;
		}

		// border drawing
		if (!borderMarker) {
			borderMarker = new BorderMarker(getCanvasImage(canvas), offsetX, offsetY);
		}
	};

	const canvasMouseUp = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		if (!challenges) {
			return;
		}

		// border drawing
		if (borderMarker) {
			borderMarker = undefined;
		}
	};

	const canvasMouseOut = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		updatePixelShowcase();

		if (!challenges) {
			return;
		}

		// border drawing
		if (borderMarker) {
			borderMarker = undefined;
		}
	};

	const isCanvas1Empty = !(canvas1Ref.current?.width && canvas1Ref.current?.height);
	const isCanvas2Empty = !(canvas2Ref.current?.width && canvas2Ref.current?.height);
	const isCanvas3Empty = !(canvas3Ref.current?.width && canvas3Ref.current?.height);

	return (
		<Layout style={{ overflow: 'hidden' }}>
			<Toolbox
				visible={toolboxVisible}
				onClose={closeToolbox}
				forceUpdate={forceUpdate}
				canvas1Ref={canvas1Ref}
				canvas2Ref={canvas2Ref}
				canvas3Ref={canvas3Ref}
				challenges={[challenges, setChallenges]}
			/>

			<Header style={{ padding: '0 1rem', background: 'white' }}>
				<Row justify="center" align="middle">
					<Col>
						<Tooltip placement="bottomRight" title="Abrir caixa de ferramentas.">
							<Button
								type="primary"
								size="large"
								icon={<ToolOutlined />}
								onClick={openToolbox}
								style={{ width: '5rem' }}
							/>
						</Tooltip>
					</Col>

					<Col flex="auto">
						<Row justify="center">
							<Space size="large">
								<div id="r-showcase" className="pixel-channel-showcase">
									{pixelShowcase.r}
								</div>

								<div id="g-showcase" className="pixel-channel-showcase">
									{pixelShowcase.g}
								</div>

								<div id="b-showcase" className="pixel-channel-showcase">
									{pixelShowcase.b}
								</div>

								<div id="a-showcase" className="pixel-channel-showcase">
									{pixelShowcase.a}
								</div>
							</Space>
						</Row>
					</Col>

					<Col>
						<Tooltip placement="bottomLeft" title="Abrir histograma.">
							<Button disabled type="primary" size="large" icon={<BarChartOutlined />} style={{ width: '5rem' }} />
						</Tooltip>
					</Col>
				</Row>
			</Header>

			<Content style={{ display: 'flex', justifyContent: 'space-between', height: 'calc(100vh - 64px)' }}>
				<Row justify="center" align="middle" style={{ width: '100%' }}>
					<Col
						className="canvas-wrapper"
						span={
							// eslint-disable-next-line unicorn/no-nested-ternary
							isCanvas1Empty ? 0 : isCanvas2Empty && isCanvas3Empty ? '' : isCanvas2Empty || isCanvas3Empty ? 12 : 8
						}
					>
						{/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
						<canvas
							ref={canvas1Ref}
							id="canvas-1"
							width="0"
							height="0"
							data-title="canvas 1"
							onMouseMove={canvasMouseMove}
							onMouseOut={canvasMouseOut}
							onMouseDown={canvasMouseDown}
							onMouseUp={canvasMouseUp}
						/>
					</Col>

					<Col
						className="canvas-wrapper"
						span={
							// eslint-disable-next-line unicorn/no-nested-ternary
							isCanvas2Empty ? 0 : isCanvas1Empty && isCanvas3Empty ? '' : isCanvas1Empty || isCanvas3Empty ? 12 : 8
						}
					>
						{/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
						<canvas
							ref={canvas2Ref}
							id="canvas-2"
							width="0"
							height="0"
							data-title="canvas 2"
							onMouseMove={canvasMouseMove}
							onMouseOut={canvasMouseOut}
							onMouseDown={canvasMouseDown}
							onMouseUp={canvasMouseUp}
						/>
					</Col>
					<Col
						className="canvas-wrapper"
						span={
							// eslint-disable-next-line unicorn/no-nested-ternary
							isCanvas3Empty ? 0 : isCanvas1Empty && isCanvas2Empty ? '' : isCanvas1Empty || isCanvas2Empty ? 12 : 8
						}
					>
						{/* eslint-disable-next-line jsx-a11y/mouse-events-have-key-events */}
						<canvas
							ref={canvas3Ref}
							id="canvas-3"
							width="0"
							height="0"
							data-title="canvas 3 (resultado)"
							onMouseMove={canvasMouseMove}
							onMouseOut={canvasMouseOut}
							onMouseDown={canvasMouseDown}
							onMouseUp={canvasMouseUp}
						/>
					</Col>
				</Row>
			</Content>
		</Layout>
	);
};
