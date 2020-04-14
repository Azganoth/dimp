import React, { useState } from 'react'
import { remote } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import {
	Button,
	Col,
	Collapse,
	Divider,
	Drawer,
	InputNumber,
	List,
	Radio,
	Row,
	Slider,
	Space,
	Switch,
	Tooltip,
	Typography,
	message,
} from 'antd'
import { DownloadOutlined, ExperimentOutlined, GithubOutlined, UploadOutlined } from '@ant-design/icons'
import './Toolbox.scss'

import { normalizeIntegerInput } from 'app/utils/normalize'
import PercentInput from './ui/PercentInput'

const { Panel } = Collapse
const { Text } = Typography

const INTERNAL_ERROR_MESSAGE =
	'Desculpe, ocorreu um erro interno, reinicie a aplicação e tente novamente. Caso o erro persista abra um issue na página do repositório.'

const SUPPORTED_IMAGE_TYPES = [
	{ name: 'Imagem PNG', extensions: ['png'] },
	{ name: 'Imagem JPEG', extensions: ['jpg', 'jpeg'] },
	{ name: 'Imagem BMP', extensions: ['bmp'] },
	{ name: 'Imagem TIFF', extensions: ['tif', 'tiff'] },
]

type ToolboxProps = {
	visible: boolean
	onClose?: () => void
	canvas1Ref: React.MutableRefObject<HTMLCanvasElement | null>
	canvas2Ref: React.MutableRefObject<HTMLCanvasElement | null>
	canvasDumpRef: React.MutableRefObject<HTMLCanvasElement | null>
	challenges: [boolean, (value: boolean) => void]
}

const Toolbox = ({ visible, onClose, canvas1Ref, canvas2Ref, canvasDumpRef, challenges }: ToolboxProps) => {
	const [waiting, setWaiting] = useState(false)

	// basic upload/download

	const upload = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		if (!canvas) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const info = await remote.dialog.showOpenDialog({
			title: `Selecione uma imagem para o ${canvas.title}`,
			buttonLabel: 'Selecionar',
			filters: [
				{
					name: 'Imagens',
					extensions: SUPPORTED_IMAGE_TYPES.flatMap((imageType) => imageType.extensions),
				},
			],
		})

		if (info.canceled) {
			return
		}

		const filePath = info.filePaths[0]

		if ((await fs.stat(filePath)).size > 262144000) {
			message.warn(
				'A imagem selecionada tem tamanho maior que 256mb e, por questões de performance, não será carregada, por favor, escolha outra imagem.'
			)
			return
		}

		return new Promise((resolve, reject) => {
			const image = new Image()

			image.addEventListener('load', () => {
				canvas.width = image.width
				canvas.height = image.height
				canvas.getContext('2d')!.drawImage(image, 0, 0)

				message.success(`A imagem '${path.basename(filePath)}' foi adicionada com sucesso ao ${canvas.title}.`)
				resolve()
			})

			image.addEventListener('error', (error) => {
				message.error(`A imagem '${path.basename(filePath)}' parece estar corrompida ou não é válida.`)
				reject(error)
			})

			image.src = filePath
		})
	}

	const download = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		if (!canvas) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(`O ${canvas.title} está vazio.`)
			return
		}

		const info = await remote.dialog.showSaveDialog({
			title: `Escolha um local e um nome para a imagem do ${canvas.title}`,
			filters: SUPPORTED_IMAGE_TYPES,
		})

		if (info.canceled) {
			return
		}

		const { filePath } = info

		if (!filePath) {
			message.warn('Por favor, informe um nome para a imagem.')
			return
		}

		const choosenExtension = path.extname(filePath).replace('.', '')

		if (!choosenExtension) {
			message.warn('Por favor, escolha uma extensão para a imagem.')
			return
		}

		// get the correct mime type
		const mimeType = choosenExtension === 'jpg' ? 'jpeg' : choosenExtension === 'tif' ? 'tiff' : choosenExtension

		// base64 data string without data type
		const imageBase64 = canvas.toDataURL(`image/${mimeType}`).replace(`data:image/${mimeType};base64,`, '')

		await fs.writeFile(filePath, Buffer.from(imageBase64, 'base64'))
		message.success(`A imagem do ${canvas.title} foi salva com sucesso.`)
	}

	// greyscale

	const [greyscaleRP, setGreyscaleRP] = useState(0)
	const [greyscaleGP, setGreyscaleGP] = useState(0)
	const [greyscaleBP, setGreyscaleBP] = useState(0)

	const greyscale = (weighted?: boolean) => {
		const { current: canvas } = canvas1Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width, height } = canvas

		if (!width && !height) {
			message.info(`O ${canvas.title} está vazio.`)
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, width, height)

		const mean = (r: number, g: number, b: number) =>
			weighted ? (r * greyscaleRP + g * greyscaleGP + b * greyscaleBP) / 300 : (r + g + b) / 3

		const { data } = imageData
		// go through each pixel ([r, g, b, a]) in the image
		for (let i = 0; i < data.length; i += 4) {
			const average = mean(data[i], data[i + 1], data[i + 2])

			data[i] = average
			data[i + 1] = average
			data[i + 2] = average
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// thresh

	const [threshValue, setThreshValue] = useState(0)

	const thresh = () => {
		const { current: canvas } = canvas1Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width, height } = canvas

		if (!width && !height) {
			message.info(`O ${canvas.title} está vazio.`)
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, width, height)

		const mean = (r: number, g: number, b: number) => (r + g + b) / 3

		const { data } = imageData
		for (let i = 0; i < data.length; i += 4) {
			const v = mean(data[i], data[i + 1], data[i + 2]) > threshValue ? 255 : 0
			data[i] = v
			data[i + 1] = v
			data[i + 2] = v
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// negative

	const negative = () => {
		const { current: canvas } = canvas1Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width, height } = canvas

		if (!width && !height) {
			message.info(`O ${canvas.title} está vazio.`)
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, width, height)

		const { data } = imageData
		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i]
			data[i + 1] = 255 - data[i + 1]
			data[i + 2] = 255 - data[i + 2]
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// noise

	const [noiseRemovalType, setNoiseRemovalType] = useState(0) // 0 = Cross, 1 = X, 2 = 3x3

	const removeNoise = () => {
		const { current: canvas } = canvas1Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width, height } = canvas

		if (!width && !height) {
			message.info(`O ${canvas.title} está vazio.`)
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, width, height)

		const median = (a: number[]) => a.sort((a, b) => a - b)[Math.floor(a.length / 2)]

		const { data } = imageData

		// get the pixel's neighbors channel
		const getNeighborsChannel = (channel: number) => {
			const top = channel - 4 * width
			const bottom = channel + 4 * width

			switch (noiseRemovalType) {
				case 0: {
					const left = channel - 4
					const right = channel + 4

					return [data[channel], data[top], data[bottom], data[left], data[right]]
				}

				case 1: {
					const topLeft = top - 4
					const topRight = top + 4
					const bottomLeft = bottom - 4
					const bottomRight = bottom + 4

					return [data[channel], data[topLeft], data[topRight], data[bottomLeft], data[bottomRight]]
				}

				case 2: {
					const left = channel - 4
					const right = channel + 4
					const topLeft = top - 4
					const topRight = top + 4
					const bottomLeft = bottom - 4
					const bottomRight = bottom + 4

					return [
						data[channel],
						data[top],
						data[bottom],
						data[left],
						data[right],
						data[topLeft],
						data[topRight],
						data[bottomLeft],
						data[bottomRight],
					]
				}

				default: {
					return [255]
				}
			}
		}

		// ignore borders
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				// each pixel ([r,g,b,a]) starts at 'x * 4 + y * 4 * width'
				const i = x * 4 + y * 4 * width

				// set the median (based on neighbors) of each channel ([r, g, b])
				for (let j = 0; j < 3; j++) {
					data[i + j] = median(getNeighborsChannel(i + j))
				}
			}
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// sum / sub

	const [canvas1SumSubP, setCanvas1SumSubP] = useState(50)
	const [canvas2SumSubP, setCanvas2SumSubP] = useState(50)

	const sum = () => {
		const { current: canvas1 } = canvas1Ref
		const { current: canvas2 } = canvas2Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas1 || !canvas2 || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width: canvas1Width, height: canvas1Height } = canvas1
		const { width: canvas2Width, height: canvas2Height } = canvas2

		if (!canvas1Width && !canvas1Height) {
			message.info(`O ${canvas1.title} está vazio.`)
			return
		}

		if (!canvas2Width && !canvas2Height) {
			message.info(`O ${canvas2.title} está vazio.`)
			return
		}

		const width = Math.min(canvas1Width, canvas2Width)
		const height = Math.min(canvas1Height, canvas2Height)

		const imageData = new ImageData(width, height)
		const { data: canvas1Data } = canvas1.getContext('2d')!.getImageData(0, 0, width, height)
		const { data: canvas2Data } = canvas2.getContext('2d')!.getImageData(0, 0, width, height)

		const { data } = imageData
		// see this#removeNoise for more info about this loop
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = x * 4 + y * 4 * width

				for (let j = 0; j < 3; j++) {
					const c = i + j // index of the pixel's channel
					data[c] = (canvas1Data[c] * canvas1SumSubP + canvas2Data[c] * canvas2SumSubP) / 100
				}

				// set the opacity to 255, this is needed because the data was created by 'new ImageData'
				data[i + 3] = 255
			}
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	const sub = () => {
		const { current: canvas1 } = canvas1Ref
		const { current: canvas2 } = canvas2Ref
		const { current: canvasDump } = canvasDumpRef

		if (!canvas1 || !canvas2 || !canvasDump) {
			message.error(INTERNAL_ERROR_MESSAGE)
			return
		}

		const { width: canvas1Width, height: canvas1Height } = canvas1
		const { width: canvas2Width, height: canvas2Height } = canvas2

		if (!canvas1Width && !canvas1Height) {
			message.info(`O ${canvas1.title} está vazio.`)
			return
		}

		if (!canvas2Width && !canvas2Height) {
			message.info(`O ${canvas2.title} está vazio.`)
			return
		}

		const width = Math.min(canvas1Width, canvas2Width)
		const height = Math.min(canvas1Height, canvas2Height)

		const imageData = new ImageData(width, height)
		const { data: canvas1Data } = canvas1.getContext('2d')!.getImageData(0, 0, width, height)
		const { data: canvas2Data } = canvas2.getContext('2d')!.getImageData(0, 0, width, height)

		const { data } = imageData
		// see this#removeNoise and this#sum for more info about this loop
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = x * 4 + y * 4 * width

				for (let j = 0; j < 3; j++) {
					const c = i + j
					data[c] = (canvas1Data[c] * canvas1SumSubP - canvas2Data[c] * canvas2SumSubP) / 100
				}

				data[i + 3] = 255
			}
		}

		canvasDump.width = width
		canvasDump.height = height
		canvasDump.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	return (
		<Drawer
			className="toolbox"
			title="Caixa de ferramentas"
			placement="left"
			width={584}
			visible={visible}
			onClose={onClose}
		>
			<Row gutter={[8, 8]}>
				<Col span={12}>
					<Button
						className="basic-action"
						type="dashed"
						size="large"
						icon={<UploadOutlined />}
						loading={waiting}
						onClick={async () => {
							setWaiting(true)
							try {
								await upload(canvas1Ref)
							} finally {
								setWaiting(false)
							}
						}}
					>
						Carregar imagem 1!
					</Button>
				</Col>
				<Col span={12}>
					<Button
						className="basic-action"
						size="large"
						icon={<DownloadOutlined />}
						loading={waiting}
						onClick={async () => {
							setWaiting(true)
							try {
								await download(canvas1Ref)
							} finally {
								setWaiting(false)
							}
						}}
					>
						Salvar imagem 1!
					</Button>
				</Col>
			</Row>

			<Row gutter={[8, 8]}>
				<Col span={12}>
					<Button
						className="basic-action"
						type="dashed"
						size="large"
						icon={<UploadOutlined />}
						loading={waiting}
						onClick={async () => {
							setWaiting(true)
							try {
								await upload(canvas2Ref)
							} finally {
								setWaiting(false)
							}
						}}
					>
						Carregar imagem 2!
					</Button>
				</Col>
				<Col span={12}>
					<Button
						className="basic-action"
						size="large"
						icon={<DownloadOutlined />}
						loading={waiting}
						onClick={async () => {
							setWaiting(true)
							try {
								await download(canvas2Ref)
							} finally {
								setWaiting(false)
							}
						}}
					>
						Salvar imagem 2!
					</Button>
				</Col>
			</Row>

			<Row gutter={[8, 8]}>
				<Col span={24}>
					<Button
						className="basic-action"
						size="large"
						icon={<DownloadOutlined />}
						loading={waiting}
						onClick={async () => {
							setWaiting(true)
							try {
								await download(canvasDumpRef)
							} finally {
								setWaiting(false)
							}
						}}
					>
						Salvar imagem resultado!
					</Button>
				</Col>
			</Row>

			<Divider />

			<Collapse accordion>
				<Panel key="1" header="Tons de cinza">
					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									greyscale()
								}}
							>
								Aplicar média aritmética
							</Button>
						</Col>
					</Row>

					<Divider />

					<Row gutter={[32, 24]} justify="center">
						<Col>
							<Space>
								<Text strong>R</Text>
								<PercentInput size="large" value={greyscaleRP} onChange={setGreyscaleRP} />
							</Space>
						</Col>
						<Col>
							<Space>
								<Text strong>G</Text>
								<PercentInput size="large" value={greyscaleGP} onChange={setGreyscaleGP} />
							</Space>
						</Col>
						<Col>
							<Space>
								<Text strong>B</Text>
								<PercentInput size="large" value={greyscaleBP} onChange={setGreyscaleBP} />
							</Space>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									greyscale(true)
								}}
							>
								Aplicar média ponderada
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="2" header="Limiarização">
					<Row gutter={[32, 24]} justify="center">
						<Col span={12}>
							<Slider
								min={0}
								max={255}
								marks={{
									0: '0',
									63: '63',
									127: '127',
									191: '191',
									255: '255',
								}}
								value={threshValue}
								onChange={(value) => {
									setThreshValue(typeof value === 'number' ? value : value[0])
								}}
							/>
						</Col>
						<Col span={8}>
							<InputNumber
								size="large"
								min={0}
								max={255}
								parser={(value) => normalizeIntegerInput(value, 0, 255)}
								value={threshValue}
								onChange={(value) => {
									setThreshValue(value ?? 0)
								}}
							/>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									thresh()
								}}
							>
								Aplicar limiarização
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="3" header="Negativa">
					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									negative()
								}}
							>
								Aplicar negativa
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="4" header="Adição / Subtração">
					<Row gutter={[0, 24]} justify="space-between">
						<Col span={6}>
							<Text strong>Imagem 1</Text>
						</Col>
						<Col span={10}>
							<Slider
								min={0}
								max={100}
								marks={{
									0: '0',
									25: '25',
									50: '50',
									75: '75',
									100: '100',
								}}
								value={canvas1SumSubP}
								onChange={(value) => {
									setCanvas1SumSubP(typeof value === 'number' ? value : value[0])
								}}
							/>
						</Col>
						<Col span={6}>
							<PercentInput size="large" value={canvas1SumSubP} onChange={setCanvas1SumSubP} />
						</Col>
					</Row>

					<Row gutter={[0, 24]} justify="space-between">
						<Col span={6}>
							<Text strong>Imagem 2</Text>
						</Col>
						<Col span={10}>
							<Slider
								min={0}
								max={100}
								marks={{
									0: '0',
									25: '25',
									50: '50',
									75: '75',
									100: '100',
								}}
								value={canvas2SumSubP}
								onChange={(value) => {
									setCanvas2SumSubP(typeof value === 'number' ? value : value[0])
								}}
							/>
						</Col>
						<Col span={6}>
							<PercentInput size="large" value={canvas2SumSubP} onChange={setCanvas2SumSubP} />
						</Col>
					</Row>

					<Row gutter={[0, 24]} justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									sum()
								}}
							>
								Aplicar adição
							</Button>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								onClick={() => {
									sub()
								}}
							>
								Aplicar subtração
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="5" header="Ruídos">
					<Row gutter={[0, 12]} justify="center">
						<Radio.Group size="large" value={noiseRemovalType} onChange={(e) => setNoiseRemovalType(e.target.value)}>
							<Col>
								<Radio value={0}>Método Cruz</Radio>
							</Col>
							<Col>
								<Radio value={1}>Método X</Radio>
							</Col>
							<Col>
								<Radio value={2}>Método 3x3</Radio>
							</Col>
						</Radio.Group>
					</Row>

					<Row justify="center">
						<Col>
							<Tooltip title="O applicativo poderá congelar até o término desta rotina.">
								<Button
									type="primary"
									size="large"
									icon={<ExperimentOutlined />}
									onClick={() => {
										removeNoise()
									}}
								>
									Eliminar ruidos
								</Button>
							</Tooltip>
						</Col>
					</Row>
				</Panel>
				<Panel key="6" header="Equalização de histograma">
					<p>sdfkl smn sdoqwo xcfgjh</p>
				</Panel>
				<Panel key="7" header="Desafios">
					<Row gutter={[0, 24]} justify="center">
						<List
							header={<Text>Implementados:</Text>}
							dataSource={['Marcação']}
							renderItem={(item) => (
								<List.Item>
									<Text>{item}</Text>
								</List.Item>
							)}
						/>
					</Row>

					<Row justify="center">
						<Col>
							<Text strong>Ativar/Desativar</Text>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Switch checked={challenges[0]} onChange={challenges[1]} />
						</Col>
					</Row>
				</Panel>
			</Collapse>

			<Row gutter={[0, 16]} justify="space-between" align="middle">
				<Col>
					<Text>Ademir J. Ferreira Júnior &lt;ademirj.ferreirajunior@gmail.com&gt;</Text>
				</Col>
				<Col>
					<Tooltip title="Abrir página do repositório github no navegador.">
						<Button type="link" size="large" icon={<GithubOutlined />} href="https://github.com/Azganoth/dimp" />
					</Tooltip>
				</Col>
			</Row>
		</Drawer>
	)
}

export default Toolbox
