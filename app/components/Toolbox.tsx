import React, { useState } from 'react'
import { remote } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { Button, Collapse, Divider, Drawer, Space, Typography, message } from 'antd'
import { DownloadOutlined, ExperimentOutlined, GithubOutlined, UploadOutlined } from '@ant-design/icons'
import './Toolbox.scss'

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
			filters: [{ name: 'Imagens', extensions: SUPPORTED_IMAGE_TYPES.flatMap((imageType) => imageType.extensions) }],
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

	return (
		<Drawer
			className="toolbox"
			title="Caixa de ferramentas"
			placement="left"
			width={584}
			visible={visible}
			onClose={onClose}
		>
			<div className="basic-actions">
				<div className="basic-actions-row">
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
				</div>

				<div className="basic-actions-row">
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
				</div>

				<Button
					className="basic-action"
					type="primary"
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
			</div>

			<Divider />

			<Collapse accordion>
				<Panel key="1" header="Tons de cinza">
					<div className="tool">
						<Button
							type="primary"
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
							Média aritmética
						</Button>

						<Divider />

						<Space size="large" direction="vertical">
							<Space size="large">
								<Text className="label">R</Text>
								<PercentInput size="large" value={greyscaleR} onChange={setGreyscaleR} />
								<Text className="label">G</Text>
								<PercentInput size="large" value={greyscaleG} onChange={setGreyscaleG} />
								<Text className="label">B</Text>
								<PercentInput size="large" value={greyscaleB} onChange={setGreyscaleB} />
							</Space>

							<Button
								type="primary"
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
								Média ponderada
							</Button>
						</Space>
					</div>
				</Panel>
				<Panel key="2" header="Limiarização">
					<p>fjsdjh sfh sshdf hsdu hsi</p>
				</Panel>
				<Panel key="3" header="Negativa">
					<p>zoxco zjzoxjzo zox jz</p>
				</Panel>
				<Panel key="4" header="Adição / Subtração">
					<p>em, qwp mepqwm pqwm afg</p>
				</Panel>
				<Panel key="5" header="Ruídos">
					<p>ofdgo fdgodod f aa´k</p>
				</Panel>
				<Panel key="6" header="Equalização de histograma">
					<p>sdfkl smn sdoqwo xcfgjh</p>
				</Panel>
			</Collapse>

			<div className="credits">
				<Text id="author-info">Ademir J. Ferreira Júnior &lt;ademirj.ferreirajunior@gmail.com&gt;</Text>
				<Button
					id="repo-link"
					type="link"
					shape="round"
					size="large"
					icon={<GithubOutlined />}
					href="https://github.com/Azganoth/dimp"
				/>
			</div>
		</Drawer>
	)
}

export default Toolbox
