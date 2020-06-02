import React, { useState } from 'react';
import { Button, Col, Divider, Layout, Radio, Row, Switch, Tabs, Tooltip, Typography, notification } from 'antd';
import { CloseOutlined, DownloadOutlined, FireFilled, GithubOutlined, UploadOutlined } from '@ant-design/icons';
import { remote } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import cv from 'opencv4nodejs';

import ColorPicker from 'app/components/ui/ColorPicker';
import SliderInput from 'app/components/ui/SliderInput';
import { ChallengesOptions } from 'app/typing/common';
import { getCanvasImage, setCanvasImage } from 'app/logic/helpers';
import * as algorithms from 'app/logic/algorithms';

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

const MESSAGES = {
	INTERNAL_ERROR:
		'Desculpe, ocorreu um erro interno, reinicie a aplicação e tente novamente. Caso o erro persista abra um issue na página do repositório.',
	empty: (subject: string) => `O ${subject} está vazio.`,
};

const SUPPORTED_IMAGE_TYPES = [
	{ name: 'Imagem PNG', extensions: ['png'] },
	{ name: 'Imagem JPEG', extensions: ['jpg', 'jpeg'] },
	{ name: 'Imagem BMP', extensions: ['bmp'] },
	{ name: 'Imagem TIFF', extensions: ['tif', 'tiff'] },
];

type ToolboxProps = {
	forceUpdate: React.DispatchWithoutAction;
	canvas1Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	canvas2Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	canvas3Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	challengesOptions: ChallengesOptions;
	updateChallengesOptions: (
		value: { [P in keyof ChallengesOptions]?: { [Q in keyof ChallengesOptions[P]]?: ChallengesOptions[P][Q] } }
	) => void;
};

const Toolbox: React.FunctionComponent<ToolboxProps> = ({
	forceUpdate,
	canvas1Ref,
	canvas2Ref,
	canvas3Ref,
	challengesOptions,
	updateChallengesOptions,
}: ToolboxProps) => {
	const [targetCanvasRef, setTargetCanvasRef] = useState(canvas1Ref);

	const load = async () => {
		const { current: canvas } = targetCanvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		const { canceled, filePaths } = await remote.dialog.showOpenDialog({
			title: `Selecione uma imagem para o ${canvas.dataset.title ?? ''}`,
			buttonLabel: 'Selecionar',
			filters: [
				{
					name: 'Imagens',
					extensions: SUPPORTED_IMAGE_TYPES.flatMap((imageType) => imageType.extensions),
				},
			],
		});

		if (canceled) {
			return;
		}

		const filePath = filePaths[0];

		if ((await fs.stat(filePath)).size > 262144000) {
			notification.warn({
				message:
					'A imagem selecionada tem tamanho maior que 256mb e, por questões de performance, não será carregada, por favor, escolha uma imagem menor.',
			});
			return;
		}

		const image = new Image();

		image.addEventListener('load', () => {
			canvas.width = image.width;
			canvas.height = image.height;
			// Disabled because the return is guaranteed
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			canvas.getContext('2d')!.drawImage(image, 0, 0);

			forceUpdate();

			notification.success({
				message: `A imagem '${path.basename(filePath)}' foi adicionada com sucesso ao ${canvas.dataset.title ?? ''}.`,
			});
		});

		image.addEventListener('error', () => {
			notification.error({ message: `A imagem '${path.basename(filePath)}' parece estar corrompida ou é inválida.` });
		});

		image.src = filePath;
	};

	const unload = async () => {
		const { current: canvas } = targetCanvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		// fill the canvas with one black transparent pixel and set its width and height to 0, hiding it
		setCanvasImage(new ImageData(1, 1), canvas);
		canvas.width = 0;
		canvas.height = 0;

		forceUpdate();

		notification.success({ message: `Imagem retirada do ${canvas.dataset.title ?? ''}.` });
	};

	const download = async () => {
		const { current: canvas } = targetCanvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const { canceled, filePath } = await remote.dialog.showSaveDialog({
			title: `Escolha um local e um nome para a imagem do ${canvas.dataset.title ?? ''}`,
			filters: SUPPORTED_IMAGE_TYPES,
		});

		if (canceled) {
			return;
		}

		if (!filePath) {
			notification.warn({ message: 'Por favor, informe um nome para a imagem.' });
			return;
		}

		const fileExtension = path.extname(filePath);

		if (!fileExtension) {
			notification.warn({ message: 'Por favor, escolha uma extensão para a imagem.' });
			return;
		}

		let mimeType = fileExtension.replace('.', '');

		// correct the mime type
		if (mimeType === 'jpg') {
			mimeType = 'image/jpeg';
		} else if (mimeType === 'tif') {
			mimeType = 'image/tiff';
		} else {
			mimeType = `image/${mimeType}`;
		}

		// base64 data string without metadata
		const imageBase64 = canvas.toDataURL(mimeType, 1).replace(`data:${mimeType};base64,`, '');

		await fs.writeFile(filePath, Buffer.from(imageBase64, 'base64'));

		notification.success({ message: `A imagem do ${canvas.dataset.title ?? ''} foi salva com sucesso.` });
	};

	// NEGATIVE

	const canvasNegative = () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		setCanvasImage(algorithms.negative(getCanvasImage(canvas)), canvas3);

		forceUpdate();
	};

	// THRESH

	const [canvasThreshValue, setCanvasThreshValue] = useState(127);

	const canvasThresh = () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		setCanvasImage(algorithms.thresh(getCanvasImage(canvas), canvasThreshValue), canvas3);

		forceUpdate();
	};

	// GREYSCALE

	const [canvasGreyscaleRWeight, setCanvasGreyscaleRWeight] = useState(100);
	const [canvasGreyscaleGWeight, setCanvasGreyscaleGWeight] = useState(100);
	const [canvasGreyscaleBWeight, setCanvasGreyscaleBWeight] = useState(100);

	const canvasGreyscale = (weighted?: boolean) => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		setCanvasImage(
			algorithms.greyscale(
				getCanvasImage(canvas),
				weighted ? { r: canvasGreyscaleRWeight, g: canvasGreyscaleGWeight, b: canvasGreyscaleBWeight } : undefined
			),
			canvas3
		);

		forceUpdate();
	};

	// NOISE

	const [canvasNoiseRemovalType, setCanvasNoiseRemovalType] = useState<'cross' | 'x' | '3x3'>('cross');

	const canvasNoiseRemoval = () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		setCanvasImage(algorithms.removeNoise(getCanvasImage(canvas), canvasNoiseRemovalType), canvas3);

		forceUpdate();
	};

	// SUM / SUB

	const [canvasSumSub1Amount, setCanvasSumSub1Amount] = useState(50);
	const [canvasSumSub2Amount, setCanvasSumSub2Amount] = useState(50);

	const canvasSum = () => {
		const { current: canvas1 } = canvas1Ref;
		const { current: canvas2 } = canvas2Ref;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas1 || !canvas2 || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas1.width || !canvas1.height) {
			notification.info({ message: MESSAGES.empty(canvas1.dataset.title ?? '') });
			return;
		}

		if (!canvas2.width || !canvas2.height) {
			notification.info({ message: MESSAGES.empty(canvas2.dataset.title ?? '') });
			return;
		}

		setCanvasImage(
			algorithms.sum(getCanvasImage(canvas1), getCanvasImage(canvas2), canvasSumSub1Amount, canvasSumSub2Amount),
			canvas3
		);

		forceUpdate();
	};

	const canvasSub = () => {
		const { current: canvas1 } = canvas1Ref;
		const { current: canvas2 } = canvas2Ref;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas1 || !canvas2 || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas1.width || !canvas1.height) {
			notification.info({ message: MESSAGES.empty(canvas1.dataset.title ?? '') });
			return;
		}

		if (!canvas2.width || !canvas2.height) {
			notification.info({ message: MESSAGES.empty(canvas2.dataset.title ?? '') });
			return;
		}

		setCanvasImage(
			algorithms.sub(getCanvasImage(canvas1), getCanvasImage(canvas2), canvasSumSub1Amount, canvasSumSub2Amount),
			canvas3
		);

		forceUpdate();
	};

	// EQUALIZATION

	const canvasEqualization = (onlyValidPixels = false) => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		setCanvasImage(algorithms.equalization(getCanvasImage(canvas), onlyValidPixels), canvas3);

		forceUpdate();
	};

	// OPENCV EDGE DETECTION

	const canvasOpenCVSobel = async () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const srcMat = cv.imdecode(Buffer.from(canvas.toDataURL().replace(`data:image/png;base64,`, ''), 'base64'));

		// apply gaussian blur to remove noise, convert to grayscale
		const greyMat = cv.gaussianBlur(srcMat, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT).cvtColor(cv.COLOR_BGR2GRAY);

		// generate gradient x and y
		const gradX = greyMat.sobel(cv.CV_16S, 1, 0, 3, 1, 0, cv.BORDER_DEFAULT).convertScaleAbs(0.5, 0.5);
		const gradY = greyMat.sobel(cv.CV_16S, 0, 1, 3, 1, 0, cv.BORDER_DEFAULT).convertScaleAbs(0.5, 0.5);

		// calculate total gradient (approximate)
		const detectedEdgesMat = cv.addWeighted(gradX, 0.5, gradY, 0.5, 0);

		setCanvasImage(
			new ImageData(
				new Uint8ClampedArray(detectedEdgesMat.cvtColor(cv.COLOR_GRAY2RGBA).getData()),
				srcMat.cols,
				srcMat.rows
			),
			canvas3
		);

		forceUpdate();
	};

	const canvasOpenCVLaplace = async () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const srcMat = cv.imdecode(Buffer.from(canvas.toDataURL().replace(`data:image/png;base64,`, ''), 'base64'));

		// apply gaussian blur to remove noise, convert to grayscale
		const greyMat = cv.gaussianBlur(srcMat, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT).cvtColor(cv.COLOR_BGR2GRAY);

		// detect edges with laplacian
		const detectedEdgesMat = greyMat.laplacian(cv.CV_16S, 3, 1, 0, cv.BORDER_DEFAULT).convertScaleAbs(0.5, 0.5);

		setCanvasImage(
			new ImageData(
				new Uint8ClampedArray(detectedEdgesMat.cvtColor(cv.COLOR_GRAY2RGBA).getData()),
				srcMat.cols,
				srcMat.rows
			),
			canvas3
		);

		forceUpdate();
	};

	const [canvasOpenCVCannyThreshold, setCanvasOpenCVCannyThreshold] = useState(50);

	const canvasOpenCVCanny = async () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const srcMat = cv.imdecode(Buffer.from(canvas.toDataURL().replace(`data:image/png;base64,`, ''), 'base64'));

		// convert to greyscale, reduce noise with a 3x3 kernel, detect edges with canny
		const detectedEdgesMat = cv
			.blur(srcMat.cvtColor(cv.COLOR_BGR2GRAY), new cv.Size(3, 3))
			.canny(canvasOpenCVCannyThreshold, 100);

		setCanvasImage(
			new ImageData(
				new Uint8ClampedArray(detectedEdgesMat.cvtColor(cv.COLOR_GRAY2RGBA).getData()),
				srcMat.cols,
				srcMat.rows
			),
			canvas3
		);

		forceUpdate();
	};

	// OPENCV EROSION/DILATION

	const [canvasOpenCVErosionDilationType, setCanvasOpenCVErosionDilationType] = useState(cv.MORPH_RECT);
	const [canvasOpenCVErosionDilationSize, setCanvasOpenCVErosionDilationSize] = useState(14);

	const canvasOpenCVErosion = async () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const srcMat = cv.imdecode(Buffer.from(canvas.toDataURL().replace(`data:image/png;base64,`, ''), 'base64'));

		const erosionMat = srcMat.erode(
			cv.getStructuringElement(
				canvasOpenCVErosionDilationType,
				new cv.Size(2 * canvasOpenCVErosionDilationSize + 1, 2 * canvasOpenCVErosionDilationSize + 1),
				new cv.Point2(canvasOpenCVErosionDilationSize, canvasOpenCVErosionDilationSize)
			)
		);

		setCanvasImage(
			new ImageData(new Uint8ClampedArray(erosionMat.cvtColor(cv.COLOR_BGR2RGBA).getData()), srcMat.cols, srcMat.rows),
			canvas3
		);

		forceUpdate();
	};

	const canvasOpenCVDilation = async () => {
		const { current: canvas } = targetCanvasRef;
		const { current: canvas3 } = canvas3Ref;

		if (!canvas || !canvas3) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title ?? '') });
			return;
		}

		const srcMat = cv.imdecode(Buffer.from(canvas.toDataURL().replace(`data:image/png;base64,`, ''), 'base64'));

		const erosionMat = srcMat.dilate(
			cv.getStructuringElement(
				canvasOpenCVErosionDilationType,
				new cv.Size(2 * canvasOpenCVErosionDilationSize + 1, 2 * canvasOpenCVErosionDilationSize + 1),
				new cv.Point2(canvasOpenCVErosionDilationSize, canvasOpenCVErosionDilationSize)
			)
		);

		setCanvasImage(
			new ImageData(new Uint8ClampedArray(erosionMat.cvtColor(cv.COLOR_BGR2RGBA).getData()), srcMat.cols, srcMat.rows),
			canvas3
		);

		forceUpdate();
	};

	return (
		<Layout style={{ height: '100%', background: 'white' }}>
			<Header style={{ padding: '1rem' }}>
				<Row justify="center" align="middle">
					<Title level={4} style={{ marginBottom: 0 }}>
						Caixa de ferramentas
					</Title>
				</Row>
			</Header>

			<Content style={{ overflow: 'auto', padding: '1rem' }}>
				<Row gutter={12}>
					<Col span={8}>
						<Tooltip placement="topLeft" mouseEnterDelay={1} title="Carregar uma imagem ao canvas alvo.">
							<Button size="large" icon={<UploadOutlined />} onClick={() => load()} style={{ width: '100%' }} />
						</Tooltip>
					</Col>

					<Col span={8}>
						<Tooltip placement="top" mouseEnterDelay={1} title="Retirar a imagem do canvas alvo.">
							<Button
								danger
								type="dashed"
								size="large"
								icon={<CloseOutlined />}
								onClick={() => unload()}
								style={{ width: '100%' }}
							/>
						</Tooltip>
					</Col>

					<Col span={8}>
						<Tooltip placement="topRight" mouseEnterDelay={1} title="Salvar a imagem do canvas alvo.">
							<Button
								type="dashed"
								size="large"
								icon={<DownloadOutlined />}
								onClick={() => download()}
								style={{ width: '100%' }}
							/>
						</Tooltip>
					</Col>
				</Row>

				<Divider dashed>
					<Text strong>Canvas alvo</Text>
				</Divider>

				<Row gutter={[0, 16]} justify="center">
					<Col>
						<Radio.Group size="large" value={targetCanvasRef} onChange={(e) => setTargetCanvasRef(e.target.value)}>
							<Radio.Button value={canvas1Ref}>Canvas 1</Radio.Button>
							<Radio.Button value={canvas2Ref}>Canvas 2</Radio.Button>
							<Radio.Button value={canvas3Ref}>Canvas 3</Radio.Button>
						</Radio.Group>
					</Col>
				</Row>

				<Tabs defaultActiveKey="9">
					<TabPane tab="Negativa" key="1">
						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasNegative()}>
									Aplicar negativa
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Limiarização" key="2">
						<Row gutter={[0, 16]}>
							<Col span={24}>
								<SliderInput
									value={canvasThreshValue}
									onChange={setCanvasThreshValue}
									min={0}
									max={255}
									inputSpan={6}
									sliderProps={{
										marks: {
											0: '0',
											63: '63',
											127: '127',
											191: '191',
											255: '255',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasThresh()}>
									Aplicar limiarização
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Tons de cinza" key="3">
						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasGreyscale()}>
									Aplicar média aritmética
								</Button>
							</Col>
						</Row>

						<Divider dashed />

						<Row gutter={[16, 16]} align="middle">
							<Col span={2}>
								<Text strong style={{ fontSize: '1.25rem' }}>
									R
								</Text>
							</Col>

							<Col span={22}>
								<SliderInput
									value={canvasGreyscaleRWeight}
									onChange={setCanvasGreyscaleRWeight}
									min={0}
									max={100}
									valueSuffix="%"
									sliderProps={{
										marks: {
											0: '0%',
											25: '25%',
											50: '50%',
											75: '75%',
											100: '100%',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>

							<Col span={2}>
								<Text strong style={{ fontSize: '1.25rem' }}>
									G
								</Text>
							</Col>

							<Col span={22}>
								<SliderInput
									value={canvasGreyscaleGWeight}
									onChange={setCanvasGreyscaleGWeight}
									min={0}
									max={100}
									valueSuffix="%"
									sliderProps={{
										marks: {
											0: '0%',
											25: '25%',
											50: '50%',
											75: '75%',
											100: '100%',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>

							<Col span={2}>
								<Text strong style={{ fontSize: '1.25rem' }}>
									B
								</Text>
							</Col>

							<Col span={22}>
								<SliderInput
									value={canvasGreyscaleBWeight}
									onChange={setCanvasGreyscaleBWeight}
									min={0}
									max={100}
									valueSuffix="%"
									sliderProps={{
										marks: {
											0: '0%',
											25: '25%',
											50: '50%',
											75: '75%',
											100: '100%',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasGreyscale(true)}>
									Aplicar média ponderada
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Ruídos" key="4">
						<Row gutter={[0, 16]} justify="center" align="middle">
							<Col>
								<Text strong>Método</Text>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Radio.Group
									buttonStyle="solid"
									size="large"
									value={canvasNoiseRemovalType}
									onChange={(e) => setCanvasNoiseRemovalType(e.target.value)}
								>
									<Radio.Button value="cross">Cruz</Radio.Button>
									<Radio.Button value="x">X</Radio.Button>
									<Radio.Button value="3x3">3x3</Radio.Button>
								</Radio.Group>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Tooltip placement="bottom" title="O applicativo poderá congelar até o término desta rotina.">
									<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasNoiseRemoval()}>
										Eliminar ruídos
									</Button>
								</Tooltip>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Adição / Subtração" key="5">
						<Row gutter={[16, 16]} align="middle">
							<Col span={5}>
								<Text strong>Canvas 1</Text>
							</Col>

							<Col span={19}>
								<SliderInput
									value={canvasSumSub1Amount}
									onChange={setCanvasSumSub1Amount}
									min={0}
									max={100}
									valueSuffix="%"
									inputSpan={8}
									sliderProps={{
										marks: {
											0: '0%',
											50: '50%',
											100: '100%',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>

							<Col span={5}>
								<Text strong>Canvas 2</Text>
							</Col>

							<Col span={19}>
								<SliderInput
									value={canvasSumSub2Amount}
									onChange={setCanvasSumSub2Amount}
									min={0}
									max={100}
									valueSuffix="%"
									inputSpan={8}
									sliderProps={{
										marks: {
											0: '0%',
											50: '50%',
											100: '100%',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasSum()}>
									Aplicar adição
								</Button>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasSub()}>
									Aplicar subtração
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Equalização de histograma" key="6">
						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasEqualization()}>
									Equalizar
								</Button>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasEqualization(true)}>
									Equalizar apenas pixels válidos
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="Desafios" key="7">
						<Row gutter={[16, 16]} align="middle">
							<Col>
								<Switch
									checked={challengesOptions.borderMarking.active}
									onChange={(value) => updateChallengesOptions({ borderMarking: { active: value } })}
								/>
							</Col>

							<Col flex="auto">
								<Text>Marcação</Text>
							</Col>

							<Col>
								<ColorPicker
									value={challengesOptions.borderMarking.color}
									onChange={(value) => updateChallengesOptions({ borderMarking: { color: value } })}
									placement="bottomRight"
									colorPickerProps={{ disableAlpha: true }}
								/>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="OpenCV - Detecção de Bordas" key="8">
						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasOpenCVSobel()}>
									Sobel
								</Button>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasOpenCVLaplace()}>
									Laplace
								</Button>
							</Col>
						</Row>

						<Row gutter={[0, 16]}>
							<Col span={24}>
								<SliderInput
									value={canvasOpenCVCannyThreshold}
									onChange={setCanvasOpenCVCannyThreshold}
									min={0}
									max={1000}
									inputSpan={6}
									sliderProps={{
										marks: {
											0: '0',
											200: '200',
											400: '400',
											600: '600',
											800: '800',
											1000: '1000',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasOpenCVCanny()}>
									Canny
								</Button>
							</Col>
						</Row>
					</TabPane>

					<TabPane tab="OpenCV - Erosão e Dilatação" key="9">
						<Row gutter={[0, 16]} justify="center" align="middle">
							<Col>
								<Text strong>Tipo</Text>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Radio.Group
									buttonStyle="solid"
									size="large"
									value={canvasOpenCVErosionDilationType}
									onChange={(e) => setCanvasOpenCVErosionDilationType(e.target.value)}
								>
									<Radio.Button value={cv.MORPH_RECT}>Rect</Radio.Button>
									<Radio.Button value={cv.MORPH_CROSS}>Cruz</Radio.Button>
									<Radio.Button value={cv.MORPH_ELLIPSE}>Elipse</Radio.Button>
								</Radio.Group>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center" align="middle">
							<Col>
								<Text strong>Tamanho</Text>
							</Col>
						</Row>

						<Row gutter={[0, 16]}>
							<Col span={24}>
								<SliderInput
									value={canvasOpenCVErosionDilationSize}
									onChange={setCanvasOpenCVErosionDilationSize}
									min={0}
									max={21}
									inputSpan={6}
									sliderProps={{
										marks: {
											0: '0',
											7: '7',
											14: '14',
											21: '21',
										},
									}}
									inputProps={{
										size: 'large',
									}}
								/>
							</Col>
						</Row>

						<Row gutter={[0, 16]} justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasOpenCVErosion()}>
									Erosão
								</Button>
							</Col>
						</Row>

						<Row justify="center">
							<Col>
								<Button type="primary" size="large" icon={<FireFilled />} onClick={() => canvasOpenCVDilation()}>
									Dilatação
								</Button>
							</Col>
						</Row>
					</TabPane>
				</Tabs>
			</Content>

			<Footer style={{ padding: '1rem' }}>
				<Row justify="center" align="middle">
					<Col style={{ textAlign: 'center' }}>
						<Text strong>Ademir J. Ferreira Júnior &lt;ademirj.ferreirajunior@gmail.com&gt;</Text>
					</Col>

					<Col>
						<Tooltip placement="topLeft" title="Abrir página do repositório github no navegador.">
							<Button
								type="link"
								size="large"
								icon={<GithubOutlined style={{ color: 'black' }} />}
								href="https://github.com/Azganoth/dimp"
								style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
							/>
						</Tooltip>
					</Col>
				</Row>
			</Footer>
		</Layout>
	);
};

export default Toolbox;
