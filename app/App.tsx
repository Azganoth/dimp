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

const App = () => {
	const [toolboxVisible, setToolboxVisible] = useState(false)

	const openToolbox = () => {
		setToolboxVisible(true)
	}

	const closeToolbox = () => {
		setToolboxVisible(false)
	}

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

	const canvasMouseMove = ({ nativeEvent: { offsetX, offsetY, target } }: React.MouseEvent<HTMLCanvasElement>) => {
		const canvas = target as HTMLCanvasElement | null

		if (canvas) {
			const [r, g, b, a] = canvas.getContext('2d')!.getImageData(offsetX, offsetY, 1, 1).data
			setPixelShowcaseValue({ r, g, b, a })
		} else {
			setPixelShowcaseValue()
		}
	}

	const canvasMouseOut = () => setPixelShowcaseValue()

	return (
		<Layout id="app-root">
			<Toolbox
				visible={toolboxVisible}
				canvas1Ref={canvas1Ref}
				canvas2Ref={canvas2Ref}
				canvasDumpRef={canvasDumpRef}
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
					/>
				</div>
			</Content>
		</Layout>
	)
}

export default App
