import React, { useReducer, useRef, useState } from 'react';
import { Button, Col, Layout, Modal, Row, Space, Tooltip, Typography, notification } from 'antd';
import { BarChartOutlined, ToolOutlined } from '@ant-design/icons';

import Toolbox from 'app/components/Toolbox';
import Histogram from 'app/components/Histogram';
import RegionSelection from 'app/logic/RegionSelection';
import { getCanvasImage, setCanvasImage } from 'app/logic/helpers';
import { ChallengesOptions, PixelShowcase } from 'app/logic/types';
import * as algorithms from 'app/logic/algorithms';

const { Header, Content } = Layout;
const { Text } = Typography;

notification.config({
	duration: 2,
	placement: 'bottomRight',
});

let regionSelection: RegionSelection | undefined;

export default () => {
	const [, forceUpdate] = useReducer((x) => x + 1, 0);

	// TOOLBOX

	const [toolboxVisible, setToolboxVisible] = useState(false);

	const openToolbox = () => {
		setToolboxVisible(true);
	};

	const closeToolbox = () => {
		setToolboxVisible(false);
	};

	// CHALLENGES

	const [challengesOptions, setChallengesOptions] = useState<ChallengesOptions>({
		borderMarking: { active: false, color: { r: 0, g: 255, b: 0, a: 255 } },
	});

	const updateChallengesOptions = (
		options: { [P in keyof ChallengesOptions]?: { [Q in keyof ChallengesOptions[P]]?: ChallengesOptions[P][Q] } }
	) => {
		setChallengesOptions({
			borderMarking: {
				active: options.borderMarking?.active ?? challengesOptions.borderMarking.active,
				color: options.borderMarking?.color ?? challengesOptions.borderMarking.color,
			},
		});
	};

	// HISTOGRAM

	const [histogramVisible, setHistogramVisible] = useState(false);

	const openHistogram = () => {
		setHistogramVisible(true);
	};

	const closeHistogram = () => {
		setHistogramVisible(false);
	};

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

		if (regionSelection) {
			regionSelection.updateEndPoint(offsetX, offsetY);

			const { imageData, startX, startY, endX, endY } = regionSelection;

			// undo the last drawn border by recovering the original image
			setCanvasImage(imageData, canvas);

			const { borderMarking } = challengesOptions;

			if (borderMarking.active) {
				// draw a border in the selected area
				setCanvasImage(
					algorithms.drawBorder(imageData, startX, startY, endX, endY, { borderColor: borderMarking.color }),
					canvas
				);
			} else {
				// draw a selection border in the selected area
				setCanvasImage(algorithms.drawBorder(imageData, startX, startY, endX, endY), canvas);
			}
		}
	};

	const canvasMouseDown = ({ target, nativeEvent: { offsetX, offsetY } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		if (!regionSelection) {
			regionSelection = new RegionSelection(getCanvasImage(canvas), offsetX, offsetY);
		}
	};

	const canvasMouseUp = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		if (regionSelection) {
			if (!challengesOptions.borderMarking.active) {
				// recover the original image
				setCanvasImage(regionSelection.imageData, canvas);
			}

			regionSelection = undefined;
		}
	};

	const canvasMouseOut = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null;

		if (!canvas) {
			return;
		}

		updatePixelShowcase();

		if (regionSelection) {
			if (!challengesOptions.borderMarking.active) {
				// recover the original image
				setCanvasImage(regionSelection.imageData, canvas);
			}

			regionSelection = undefined;
		}
	};

	const canvas1IsEmpty = !(canvas1Ref.current?.width && canvas1Ref.current?.height);
	const canvas2IsEmpty = !(canvas2Ref.current?.width && canvas2Ref.current?.height);
	const canvas3IsEmpty = !(canvas3Ref.current?.width && canvas3Ref.current?.height);

	return (
		<Layout style={{ overflow: 'hidden' }}>
			<Toolbox
				visible={toolboxVisible}
				onClose={closeToolbox}
				forceUpdate={forceUpdate}
				canvas1Ref={canvas1Ref}
				canvas2Ref={canvas2Ref}
				canvas3Ref={canvas3Ref}
				challengesOptions={challengesOptions}
				updateChallengesOptions={updateChallengesOptions}
			/>

			<Modal
				centered
				destroyOnClose
				title="Histogramas"
				visible={histogramVisible}
				width={600}
				onOk={closeHistogram}
				onCancel={closeHistogram}
				okButtonProps={{ hidden: true }}
				cancelButtonProps={{ hidden: true }}
			>
				<Row justify="center" align="middle">
					<Col>
						<Text strong>Canvas 1</Text>
					</Col>

					<Col span={24}>
						<Histogram canvasRef={canvas1Ref} />
					</Col>

					<Col>
						<Text strong>Canvas 2</Text>
					</Col>

					<Col span={24}>
						<Histogram canvasRef={canvas2Ref} />
					</Col>

					<Col>
						<Text strong>Canvas 3 (resultado)</Text>
					</Col>

					<Col span={24}>
						<Histogram canvasRef={canvas3Ref} />
					</Col>
				</Row>
			</Modal>

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
							<Button
								type="primary"
								size="large"
								icon={<BarChartOutlined />}
								onClick={openHistogram}
								style={{ width: '5rem' }}
							/>
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
							canvas1IsEmpty ? 0 : canvas2IsEmpty && canvas3IsEmpty ? '' : canvas2IsEmpty || canvas3IsEmpty ? 12 : 8
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
							canvas2IsEmpty ? 0 : canvas1IsEmpty && canvas3IsEmpty ? '' : canvas1IsEmpty || canvas3IsEmpty ? 12 : 8
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
							canvas3IsEmpty ? 0 : canvas1IsEmpty && canvas2IsEmpty ? '' : canvas1IsEmpty || canvas2IsEmpty ? 12 : 8
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
