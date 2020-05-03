import React, { useState } from 'react';
import { Button, Col, Divider, Drawer, Radio, Row, Switch, Tabs, Tooltip, Typography, notification } from 'antd';
import { CloseOutlined, DownloadOutlined, ExperimentOutlined, GithubOutlined, UploadOutlined } from '@ant-design/icons';
import { remote } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';

import ColorPicker from 'app/components/ui/ColorPicker';
import SliderInput from 'app/components/ui/SliderInput';
import { MESSAGES, SUPPORTED_IMAGE_TYPES } from 'app/logic/constants';
import { getCanvasImage, setCanvasImage } from 'app/logic/helpers';
import { ChallengesOptions } from 'app/logic/types';
import * as algorithms from 'app/logic/algorithms';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

type Props = {
	visible: boolean;
	onClose: () => void;
	forceUpdate: React.DispatchWithoutAction;
	canvas1Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	canvas2Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	canvas3Ref: React.MutableRefObject<HTMLCanvasElement | null>;
	challengesOptions: ChallengesOptions;
	updateChallengesOptions: (
		value: { [P in keyof ChallengesOptions]?: { [Q in keyof ChallengesOptions[P]]?: ChallengesOptions[P][Q] } }
	) => void;
};

export default ({
	visible,
	onClose,
	forceUpdate,
	canvas1Ref,
	canvas2Ref,
	canvas3Ref,
	challengesOptions,
	updateChallengesOptions,
}: Props) => {
	const [targetCanvasRef, setTargetCanvasRef] = useState(canvas1Ref);

	const load = async () => {
		const { current: canvas } = targetCanvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		const { canceled, filePaths } = await remote.dialog.showOpenDialog({
			title: `Selecione uma imagem para o ${canvas.dataset.title!}`,
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
			canvas.getContext('2d')!.drawImage(image, 0, 0);

			forceUpdate();

			notification.success({
				message: `A imagem '${path.basename(filePath)}' foi adicionada com sucesso ao ${canvas.dataset.title!}.`,
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
			return;
		}

		// fill the canvas with one black transparent pixel and set its width and height to 0, hiding it
		setCanvasImage(new ImageData(1, 1), canvas);
		canvas.width = 0;
		canvas.height = 0;

		forceUpdate();

		notification.success({ message: `Imagem retirada do ${canvas.dataset.title!}.` });
	};

	const download = async () => {
		const { current: canvas } = targetCanvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (!canvas.width || !canvas.height) {
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
			return;
		}

		const { canceled, filePath } = await remote.dialog.showSaveDialog({
			title: `Escolha um local e um nome para a imagem do ${canvas.dataset.title!}`,
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

		notification.success({ message: `A imagem do ${canvas.dataset.title!} foi salva com sucesso.` });
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas1.dataset.title!) });
			return;
		}

		if (!canvas2.width || !canvas2.height) {
			notification.info({ message: MESSAGES.empty(canvas2.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas1.dataset.title!) });
			return;
		}

		if (!canvas2.width || !canvas2.height) {
			notification.info({ message: MESSAGES.empty(canvas2.dataset.title!) });
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
			notification.info({ message: MESSAGES.empty(canvas.dataset.title!) });
			return;
		}

		setCanvasImage(algorithms.equalization(getCanvasImage(canvas), onlyValidPixels), canvas3);

		forceUpdate();
	};

	return (
		<Drawer
			visible={visible}
			onClose={onClose}
			placement="left"
			width={600}
			title={
				<Row gutter={18} justify="center" align="middle">
					<Col>
						<Title level={4} style={{ marginBottom: 0 }}>
							Caixa de ferramentas
						</Title>
					</Col>

					<Divider dashed style={{ marginTop: '4px', marginBottom: '12px' }} />

					<Col span={8}>
						<Tooltip placement="bottomLeft" title="Carregar uma imagem ao canvas.">
							<Button size="large" icon={<UploadOutlined />} onClick={() => load()} style={{ width: '100%' }} />
						</Tooltip>
					</Col>

					<Col span={8}>
						<Tooltip placement="bottom" title="Retirar a imagem do canvas.">
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
						<Tooltip placement="bottomRight" title="Salvar a imagem do canvas.">
							<Button
								type="dashed"
								size="large"
								icon={<DownloadOutlined />}
								onClick={() => download()}
								style={{ width: '100%' }}
							/>
						</Tooltip>
					</Col>

					<Divider dashed>
						<Text strong>Canvas alvo</Text>
					</Divider>

					<Col>
						<Radio.Group size="large" value={targetCanvasRef} onChange={(e) => setTargetCanvasRef(e.target.value)}>
							<Radio.Button value={canvas1Ref}>Canvas 1</Radio.Button>
							<Radio.Button value={canvas2Ref}>Canvas 2</Radio.Button>
							<Tooltip placement="bottom" title="Este canvas guardará o resultado de qualquer rotina.">
								<Radio.Button value={canvas3Ref}>Canvas 3</Radio.Button>
							</Tooltip>
						</Radio.Group>
					</Col>
				</Row>
			}
			footer={
				<Row justify="space-between" align="middle">
					<Col flex="auto" offset={2} style={{ fontFamily: 'sans-serif', textAlign: 'center' }}>
						<Text strong>Ademir J. Ferreira Júnior &lt;ademirj.ferreirajunior@gmail.com&gt;</Text>
					</Col>

					<Col span={2}>
						<Tooltip placement="topRight" title="Abrir página do repositório github no navegador.">
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
			}
		>
			<Tabs defaultActiveKey="1">
				<TabPane tab="Negativa" key="1">
					<Row justify="center">
						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasNegative()}>
								Aplicar negativa
							</Button>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Limiarização" key="2">
					<Row gutter={[0, 32]} justify="center">
						<Col span={20}>
							<SliderInput
								value={canvasThreshValue}
								min={0}
								max={255}
								onChange={setCanvasThreshValue}
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
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasThresh()}>
								Aplicar limiarização
							</Button>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Tons de cinza" key="3">
					<Row justify="center">
						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasGreyscale()}>
								Aplicar média aritmética
							</Button>
						</Col>
					</Row>

					<Divider dashed />

					<Row gutter={[0, 32]} justify="center" align="middle">
						<Col span={2}>
							<Text strong style={{ fontSize: '1.25rem' }}>
								R
							</Text>
						</Col>

						<Col span={22}>
							<SliderInput
								value={canvasGreyscaleRWeight}
								min={0}
								max={100}
								suffix="%"
								onChange={setCanvasGreyscaleRWeight}
								sliderProps={{
									marks: {
										0: '0%',
										25: '25%',
										50: '50%',
										75: '75%',
										100: '100%',
									},
									tooltipPlacement: 'left',
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
								min={0}
								max={100}
								suffix="%"
								onChange={setCanvasGreyscaleGWeight}
								sliderProps={{
									marks: {
										0: '0%',
										25: '25%',
										50: '50%',
										75: '75%',
										100: '100%',
									},
									tooltipPlacement: 'left',
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
								min={0}
								max={100}
								suffix="%"
								onChange={setCanvasGreyscaleBWeight}
								sliderProps={{
									marks: {
										0: '0%',
										25: '25%',
										50: '50%',
										75: '75%',
										100: '100%',
									},
									tooltipPlacement: 'left',
								}}
								inputProps={{
									size: 'large',
								}}
							/>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasGreyscale(true)}>
								Aplicar média ponderada
							</Button>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Ruídos" key="4">
					<Row gutter={[0, 12]} justify="center" align="middle">
						<Col>
							<Text strong>Método</Text>
						</Col>
					</Row>

					<Row gutter={[0, 24]} justify="center">
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
								<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasNoiseRemoval()}>
									Eliminar ruídos
								</Button>
							</Tooltip>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Adição / Subtração" key="5">
					<Row gutter={[0, 32]} justify="center" align="middle">
						<Col span={4}>
							<Text strong>Canvas 1</Text>
						</Col>

						<Col span={18}>
							<SliderInput
								value={canvasSumSub1Amount}
								min={0}
								max={100}
								suffix="%"
								onChange={setCanvasSumSub1Amount}
								sliderProps={{
									marks: {
										0: '0%',
										25: '25%',
										50: '50%',
										75: '75%',
										100: '100%',
									},
									tooltipPlacement: 'left',
								}}
								inputProps={{
									size: 'large',
								}}
							/>
						</Col>

						<Col span={4}>
							<Text strong>Canvas 2</Text>
						</Col>

						<Col span={18}>
							<SliderInput
								value={canvasSumSub2Amount}
								min={0}
								max={100}
								suffix="%"
								onChange={setCanvasSumSub2Amount}
								sliderProps={{
									marks: {
										0: '0%',
										25: '25%',
										50: '50%',
										75: '75%',
										100: '100%',
									},
									tooltipPlacement: 'left',
								}}
								inputProps={{
									size: 'large',
								}}
							/>
						</Col>
					</Row>

					<Row gutter={24} justify="center">
						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasSum()}>
								Aplicar adição
							</Button>
						</Col>

						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasSub()}>
								Aplicar subtração
							</Button>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Equalização de histograma" key="6">
					<Row gutter={[0, 24]} justify="center">
						<Col>
							<Button type="primary" size="large" icon={<ExperimentOutlined />} onClick={() => canvasEqualization()}>
								Equalizar
							</Button>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => canvasEqualization(true)}
							>
								Equalizar apenas pixels válidos
							</Button>
						</Col>
					</Row>
				</TabPane>
				<TabPane tab="Desafios" key="7">
					<Row gutter={[24, 24]} align="middle">
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
								colorPickerProps={{ disableAlpha: true }}
							/>
						</Col>
					</Row>
				</TabPane>
			</Tabs>
		</Drawer>
	);
};
