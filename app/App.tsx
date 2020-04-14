import React, { useRef, useState } from 'react'
import { Button, Col, Layout, Row, Space, Tooltip, message } from 'antd'
import { BarChartOutlined, ToolOutlined } from '@ant-design/icons'
import './App.scss'

import Toolbox from './components/Toolbox'

const { Header, Content } = Layout

message.config({
	duration: 2,
	top: 7,
})

// drawing border challenge vars
let drawingBorderCanvas: string | null = null // id of the canvas
let drawingBorderCanvasBackup: ImageData | null = null // canvas image backup
let drawingBorderStartCoords = { x: 0, y: 0 }

const App = () => {
	const [toolboxVisible, setToolboxVisible] = useState(false)

	const openToolbox = () => {
		setToolboxVisible(true)
	}

	const closeToolbox = () => {
		setToolboxVisible(false)
	}

	// challenges

	const [challenges, setChallenges] = useState(false)

	// pixel showcase

	const [pixelShowcaseValueR, setPixelShowcaseValueR] = useState<'R' | number>('R')
	const [pixelShowcaseValueG, setPixelShowcaseValueG] = useState<'G' | number>('G')
	const [pixelShowcaseValueB, setPixelShowcaseValueB] = useState<'B' | number>('B')
	const [pixelShowcaseValueA, setPixelShowcaseValueA] = useState<'A' | number>('A')

	const setPixelShowcaseValue = (
		{ r, g, b, a = 'A' }: { r: 'R' | number; g: 'G' | number; b: 'B' | number; a?: 'A' | number } = {
			r: 'R',
			g: 'G',
			b: 'B',
			a: 'A',
		}
	) => {
		setPixelShowcaseValueR(r)
		setPixelShowcaseValueG(g)
		setPixelShowcaseValueB(b)
		setPixelShowcaseValueA(a)
	}

	// canvases

	const canvas1Ref = useRef<HTMLCanvasElement | null>(null)
	const canvas2Ref = useRef<HTMLCanvasElement | null>(null)
	const canvasDumpRef = useRef<HTMLCanvasElement | null>(null)

	const canvasMouseOut = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null

		if (!canvas) {
			return
		}

		setPixelShowcaseValue()

		if (challenges && drawingBorderCanvas === canvas.id) {
			drawingBorderCanvas = null
			drawingBorderCanvasBackup = null
		}
	}

	const canvasMouseMove = ({ nativeEvent: { offsetX, offsetY, target } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null

		if (!canvas) {
			setPixelShowcaseValue()
			return
		}

		const [r, g, b, a] = canvas.getContext('2d')!.getImageData(offsetX, offsetY, 1, 1).data
		setPixelShowcaseValue({ r, g, b, a })

		if (challenges && drawingBorderCanvas === canvas.id) {
			const canvasContext = canvas.getContext('2d')!

			// undo last drawn border using the backup, if it exists
			if (drawingBorderCanvasBackup) {
				canvasContext.putImageData(drawingBorderCanvasBackup, 0, 0)
			}

			const { width, height } = canvas
			const imageData = canvasContext.getImageData(0, 0, width, height)

			const { x: startX, y: startY } = drawingBorderStartCoords
			const { data } = imageData

			// set the loop step and comparator to prevent the border not being drawn
			// if the user moves to negative coords in relation to the starting point
			const stepY = startY < offsetY ? 1 : -1
			const stepX = startX < offsetX ? 1 : -1
			const comparatorY = (y: number) => (startY < offsetY ? y <= offsetY : y >= offsetY)
			const comparatorX = (x: number) => (startX < offsetX ? x <= offsetX : x >= offsetX)

			for (let y = startY; comparatorY(y); y += stepY) {
				for (let x = startX; comparatorX(x); x += stepX) {
					// only draw pixel if it is at the border of the selection
					if (y === startY || y === offsetY || x === startX || x === offsetX) {
						// see Toolbox#removeNoise for more info about this
						const i = x * 4 + y * 4 * width

						// Disabled because it still is readable
						// eslint-disable-next-line max-depth
						for (let j = 0; j < 3; j++) {
							data[i + j] = 255
						}

						data[i] = 255
					}
				}
			}

			canvasContext.putImageData(imageData, 0, 0)
		}
	}

	const canvasMouseDown = ({ nativeEvent: { offsetX, offsetY, target } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null

		if (!canvas) {
			return
		}

		if (challenges && drawingBorderCanvas !== canvas.id) {
			drawingBorderCanvas = canvas.id

			drawingBorderStartCoords = { x: offsetX, y: offsetY }
			drawingBorderCanvasBackup = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height)
		}
	}

	const canvasMouseUp = ({ target }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null

		if (!canvas) {
			return
		}

		if (challenges && drawingBorderCanvas === canvas.id) {
			drawingBorderCanvas = null
			drawingBorderCanvasBackup = null
		}
	}

	return (
		<Layout id="app-root">
			<Toolbox
				visible={toolboxVisible}
				canvas1Ref={canvas1Ref}
				canvas2Ref={canvas2Ref}
				canvasDumpRef={canvasDumpRef}
				challenges={[challenges, setChallenges]}
				onClose={closeToolbox}
			/>

			<Header id="app-header">
				<Row justify="center" align="middle">
					<Col>
						<Tooltip title="Abrir caixa de ferramentas." placement="right">
							<Button
								className="header-action"
								type="primary"
								size="large"
								icon={<ToolOutlined />}
								onClick={openToolbox}
							/>
						</Tooltip>
					</Col>

					<Col flex="auto">
						<Row justify="center">
							<Space>
								<div id="r" className="pixel-showcase-value">
									{pixelShowcaseValueR}
								</div>
								<div id="g" className="pixel-showcase-value">
									{pixelShowcaseValueG}
								</div>
								<div id="b" className="pixel-showcase-value">
									{pixelShowcaseValueB}
								</div>
								<div id="a" className="pixel-showcase-value">
									{pixelShowcaseValueA}
								</div>
							</Space>
						</Row>
					</Col>

					<Col>
						<Tooltip title="Abrir histograma. (WIP)" placement="left">
							<Button className="header-action" type="primary" size="large" icon={<BarChartOutlined />} />
						</Tooltip>
					</Col>
				</Row>
			</Header>

			<Content
				id="app-content"
				className={
					// no need to show canvas-2 if it was a size of 0x0
					canvas2Ref.current?.width && canvas2Ref.current?.height ? 'three-active-canvases' : 'two-active-canvases'
				}
			>
				<div className="canvas-wrapper">
					<canvas
						ref={canvas1Ref}
						id="canvas-1"
						title="canvas 1"
						width="0"
						height="0"
						onMouseMove={canvasMouseMove}
						onMouseOut={canvasMouseOut}
						onMouseDown={canvasMouseDown}
						onMouseUp={canvasMouseUp}
					/>
				</div>
				<div id="hidden-wrapper" className="canvas-wrapper">
					<canvas
						ref={canvas2Ref}
						id="canvas-2"
						title="canvas 2"
						width="0"
						height="0"
						onMouseMove={canvasMouseMove}
						onMouseOut={canvasMouseOut}
						onMouseDown={canvasMouseDown}
						onMouseUp={canvasMouseUp}
					/>
				</div>
				<div className="canvas-wrapper">
					<canvas
						ref={canvasDumpRef}
						id="canvas-dump"
						title="canvas resultado"
						width="0"
						height="0"
						onMouseMove={canvasMouseMove}
						onMouseOut={canvasMouseOut}
						onMouseDown={canvasMouseDown}
						onMouseUp={canvasMouseUp}
					/>
				</div>
			</Content>
		</Layout>
	)
}

export default App
