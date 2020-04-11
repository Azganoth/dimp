import React, { useRef, useState } from 'react'
import { Button, Space, Tooltip, message } from 'antd'
import { BarChartOutlined, ToolOutlined } from '@ant-design/icons'
import './App.scss'

import Toolbox from './components/Toolbox'

message.config({
	duration: 2,
	top: 9,
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
	const canvasResultRef = useRef<HTMLCanvasElement | null>(null)

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
		<div id="root">
			<Toolbox
				visible={toolboxVisible}
				canvas1Ref={canvas1Ref}
				canvas2Ref={canvas2Ref}
				canvasResultRef={canvasResultRef}
				onClose={closeToolbox}
			/>

			<header className="header">
				<Tooltip title="Abrir caixa de ferramentas." placement="right">
					<Button className="header-action" shape="round" size="large" icon={<ToolOutlined />} onClick={openToolbox} />
				</Tooltip>
				<Space size="large">
					<div id="r" className="pixel-value">
						{pixelShowcaseValueR}
					</div>
					<div id="g" className="pixel-value">
						{pixelShowcaseValueG}
					</div>
					<div id="b" className="pixel-value">
						{pixelShowcaseValueB}
					</div>
					<div id="a" className="pixel-value">
						{pixelShowcaseValueA}
					</div>
				</Space>
				<Tooltip title="Abrir histograma. (WIP)" placement="left">
					<Button className="header-action" shape="round" size="large" icon={<BarChartOutlined />} />
				</Tooltip>
			</header>

			<main className="content">
				<div className="canvas">
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
				<div className="canvas">
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
				<div className="canvas">
					<canvas
						ref={canvasResultRef}
						id="canvas-result"
						title="canvas resultado"
						width="0"
						height="0"
						onMouseMove={canvasMouseMove}
						onMouseOut={canvasMouseOut}
					/>
				</div>
			</main>
		</div>
	)
}

export default App
