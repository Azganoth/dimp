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
	Radio,
	Row,
	Slider,
	Space,
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

const MESSAGES = {
	ERROR: {
		internal:
			'Desculpe, ocorreu um erro interno, reinicie a aplicação e tente novamente. Caso o erro persista abra um issue.',
	},
	INFO: {
		thereIsNothingOn: (subject: string) => `Não há nada no ${subject}.`,
	},
}

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
	canvasResultRef: React.MutableRefObject<HTMLCanvasElement | null>
}

const Toolbox = ({ visible, onClose, canvas1Ref, canvas2Ref, canvasResultRef }: ToolboxProps) => {
	const [busy, setBusy] = useState(false)

	// basic upload/download

	const upload = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		if (!canvas) {
			message.error(MESSAGES.ERROR.internal)
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
			message.error(MESSAGES.ERROR.internal)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(MESSAGES.INFO.thereIsNothingOn(canvas.title))
			return
		}

		const info = await remote.dialog.showSaveDialog({
			title: `Escolha um local e um nome a imagem do ${canvas.title}`,
			filters: SUPPORTED_IMAGE_TYPES,
		})

		if (info.canceled) {
			return
		}

		const { filePath } = info

		if (!filePath) {
			message.warn('Por favor, informe um nome para imagem.')
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

	const [greyscaleR, setGreyscaleR] = useState(0)
	const [greyscaleG, setGreyscaleG] = useState(0)
	const [greyscaleB, setGreyscaleB] = useState(0)

	const greyscale = async (
		{ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>,
		weighted?: boolean
	) => {
		const { current: canvasResult } = canvasResultRef
		if (!canvas || !canvasResult) {
			message.error(MESSAGES.ERROR.internal)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(MESSAGES.INFO.thereIsNothingOn(canvas.title))
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)

		const { data } = imageData
		// transverse every pixel in the image ([r,g,b,a])
		for (let i = 0; i < data.length; i += 4) {
			const average = weighted
				? (data[i] * greyscaleR + data[i + 1] * greyscaleG + data[i + 2] * greyscaleB) / 300
				: (data[i] + data[i + 1] + data[i + 2]) / 3
			data[i] = average
			data[i + 1] = average
			data[i + 2] = average
		}

		canvasResult.width = canvas.width
		canvasResult.height = canvas.height
		canvasResult.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// thresh

	const [threshValue, setThreshValue] = useState(0)

	const thresh = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		const { current: canvasResult } = canvasResultRef
		if (!canvas || !canvasResult) {
			message.error(MESSAGES.ERROR.internal)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(MESSAGES.INFO.thereIsNothingOn(canvas.title))
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)

		const { data } = imageData
		for (let i = 0; i < data.length; i += 4) {
			const pxValue = (data[i] + data[i + 1] + data[i + 2]) / 3 > threshValue ? 255 : 0
			data[i] = pxValue
			data[i + 1] = pxValue
			data[i + 2] = pxValue
		}

		canvasResult.width = canvas.width
		canvasResult.height = canvas.height
		canvasResult.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// negative

	const negative = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		const { current: canvasResult } = canvasResultRef
		if (!canvas || !canvasResult) {
			message.error(MESSAGES.ERROR.internal)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(MESSAGES.INFO.thereIsNothingOn(canvas.title))
			return
		}

		const imageData = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)

		const { data } = imageData
		for (let i = 0; i < data.length; i += 4) {
			data[i] = 255 - data[i]
			data[i + 1] = 255 - data[i + 1]
			data[i + 2] = 255 - data[i + 2]
		}

		canvasResult.width = canvas.width
		canvasResult.height = canvas.height
		canvasResult.getContext('2d')!.putImageData(imageData, 0, 0)
	}

	// noise

	const [noiseType, setNoiseType] = useState(0) // 0 = Cross, 1 = X, 2 = 3x3

	const removeNoise = async ({ current: canvas }: React.MutableRefObject<HTMLCanvasElement | null>) => {
		const { current: canvasResult } = canvasResultRef
		if (!canvas || !canvasResult) {
			message.error(MESSAGES.ERROR.internal)
			return
		}

		if (!canvas.width && !canvas.height) {
			message.info(MESSAGES.INFO.thereIsNothingOn(canvas.title))
			return
		}

		const { width, height } = canvas
		const imageData = canvas.getContext('2d')!.getImageData(0, 0, width, height)

		const median = (a: number[]) => a.sort((a, b) => a - b)[Math.floor(a.length / 2)]

		const { data } = imageData
		// ignore borders
		for (let y = 1; y < height - 1; y++) {
			for (let x = 1; x < width - 1; x++) {
				// each pixel ([r,g,b,a]) starts at 'x * 4 + y * 4 * width'
				const i = x * 4 + y * 4 * width

				const top = i - 4 * width
				const bottom = i + 4 * width

				switch (noiseType) {
					// cross
					case 0: {
						const left = i - 4
						const right = i + 4

						data[i] = median([data[i], data[top], data[bottom], data[left], data[right]])
						data[i + 1] = median([data[i + 1], data[top + 1], data[bottom + 1], data[left + 1], data[right + 1]])
						data[i + 2] = median([data[i + 2], data[top + 2], data[bottom + 2], data[left + 2], data[right + 2]])

						break
					}

					// X
					case 1: {
						const topLeft = top - 4
						const topRight = top + 4
						const bottomLeft = bottom - 4
						const bottomRight = bottom + 4

						data[i] = median([data[i], data[topLeft], data[topRight], data[bottomLeft], data[bottomRight]])
						data[i + 1] = median([
							data[i + 1],
							data[topLeft + 1],
							data[topRight + 1],
							data[bottomLeft + 1],
							data[bottomRight + 1],
						])
						data[i + 2] = median([
							data[i + 2],
							data[topLeft + 2],
							data[topRight + 2],
							data[bottomLeft + 2],
							data[bottomRight + 2],
						])

						break
					}

					// 3x3
					case 2: {
						const left = i - 4
						const right = i + 4
						const topLeft = top - 4
						const topRight = top + 4
						const bottomLeft = bottom - 4
						const bottomRight = bottom + 4

						data[i] = median([
							data[i],
							data[top],
							data[bottom],
							data[left],
							data[right],
							data[topLeft],
							data[topRight],
							data[bottomLeft],
							data[bottomRight],
						])
						data[i + 1] = median([
							data[i + 1],
							data[top + 1],
							data[bottom + 1],
							data[left + 1],
							data[right + 1],
							data[topLeft + 1],
							data[topRight + 1],
							data[bottomLeft + 1],
							data[bottomRight + 1],
						])
						data[i + 2] = median([
							data[i + 2],
							data[top + 2],
							data[bottom + 2],
							data[left + 2],
							data[right + 2],
							data[topLeft + 2],
							data[topRight + 2],
							data[bottomLeft + 2],
							data[bottomRight + 2],
						])

						break
					}

					default:
						break
				}
			}
		}

		canvasResult.width = width
		canvasResult.height = height
		canvasResult.getContext('2d')!.putImageData(imageData, 0, 0)
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
						loading={busy}
						onClick={async () => {
							setBusy(true)
							try {
								await upload(canvas1Ref)
							} finally {
								setBusy(false)
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
						loading={busy}
						onClick={async () => {
							setBusy(true)
							try {
								await download(canvas1Ref)
							} finally {
								setBusy(false)
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
						loading={busy}
						onClick={async () => {
							setBusy(true)
							try {
								await upload(canvas2Ref)
							} finally {
								setBusy(false)
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
						loading={busy}
						onClick={async () => {
							setBusy(true)
							try {
								await download(canvas2Ref)
							} finally {
								setBusy(false)
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
						loading={busy}
						onClick={async () => {
							setBusy(true)
							try {
								await download(canvasResultRef)
							} finally {
								setBusy(false)
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
								loading={busy}
								onClick={async () => {
									setBusy(true)
									try {
										await greyscale(canvas1Ref)
									} finally {
										setBusy(false)
									}
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
								<PercentInput size="large" value={greyscaleR} onChange={setGreyscaleR} />
							</Space>
						</Col>
						<Col>
							<Space>
								<Text strong>G</Text>
								<PercentInput size="large" value={greyscaleG} onChange={setGreyscaleG} />
							</Space>
						</Col>
						<Col>
							<Space>
								<Text strong>B</Text>
								<PercentInput size="large" value={greyscaleB} onChange={setGreyscaleB} />
							</Space>
						</Col>
					</Row>

					<Row justify="center">
						<Col>
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								loading={busy}
								onClick={async () => {
									setBusy(true)
									try {
										await greyscale(canvas1Ref, true)
									} finally {
										setBusy(false)
									}
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
								loading={busy}
								onClick={async () => {
									setBusy(true)
									try {
										await thresh(canvas1Ref)
									} finally {
										setBusy(false)
									}
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
								loading={busy}
								onClick={async () => {
									setBusy(true)
									try {
										await negative(canvas1Ref)
									} finally {
										setBusy(false)
									}
								}}
							>
								Aplicar negativa
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="4" header="Adição / Subtração">
					<p>em, qwp mepqwm pqwm afg</p>
				</Panel>
				<Panel key="5" header="Ruídos">
					<Row gutter={[0, 12]} justify="center">
						<Radio.Group size="large" value={noiseType} onChange={(e) => setNoiseType(e.target.value)}>
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
							<Button
								type="primary"
								size="large"
								icon={<ExperimentOutlined />}
								loading={busy}
								onClick={async () => {
									setBusy(true)
									try {
										await removeNoise(canvas1Ref)
									} finally {
										setBusy(false)
									}
								}}
							>
								Eliminar ruidos
							</Button>
						</Col>
					</Row>
				</Panel>
				<Panel key="6" header="Equalização de histograma">
					<p>sdfkl smn sdoqwo xcfgjh</p>
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
