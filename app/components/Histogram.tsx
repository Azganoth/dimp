import React, { useEffect, useState } from 'react';
import { Typography, notification } from 'antd';
import { Bar, BarChart, CartesianGrid, Tooltip, TooltipProps, XAxis, YAxis } from 'recharts';

import { MESSAGES, getCanvasImage } from 'app/logic/helpers';
import * as algorithms from 'app/logic/algorithms';

const { Text } = Typography;

const CustomTooltip = ({ active, label, payload }: TooltipProps) => {
	if (active) {
		return (
			<div
				style={{
					border: '1px solid #d9d9d9',
					borderRadius: 4,
					padding: '1rem',
					backgroundColor: 'hsla(0, 0%, 100%, 0.75)',
				}}
			>
				<Text strong>{label}</Text>

				{payload?.map(({ name, value, fill }) => (
					<div key={name}>
						<Text style={{ color: fill }}>
							{name.charAt(0).toUpperCase()}
							{name.slice(1)}:{' '}
						</Text>
						<Text>{(value as number).toLocaleString()}</Text>
					</div>
				))}

				<Text>Total: {payload?.reduce((a, { value }) => a + (value as number), 0).toLocaleString()}</Text>
			</div>
		);
	}

	// eslint-disable-next-line unicorn/no-null
	return null;
};

type Props = {
	canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
};

export default ({ canvasRef }: Props) => {
	const [histogramData, setHistogramData] = useState<algorithms.HistogramValue[]>([]);

	useEffect(() => {
		const { current: canvas } = canvasRef;

		if (!canvas) {
			notification.error({ message: MESSAGES.INTERNAL_ERROR });
			return;
		}

		if (canvas.width && canvas.height) {
			setHistogramData(algorithms.histogram(getCanvasImage(canvas)));
		}
	}, [canvasRef]);

	return (
		<BarChart width={552} height={200} data={histogramData} barCategoryGap={0} barGap={0}>
			<CartesianGrid strokeDasharray="3 3" />
			<XAxis dataKey={(item) => histogramData.indexOf(item)} ticks={[0, 33, 63, 95, 127, 159, 191, 223, 255]} />
			<YAxis tickFormatter={(value) => (value as number).toLocaleString()} />
			<Tooltip content={<CustomTooltip />} />
			<Bar name="red" dataKey="r" stackId="count" fill="#ff5c57" />
			<Bar name="green" dataKey="g" stackId="count" fill="#5af78e" />
			<Bar name="blue" dataKey="b" stackId="count" fill="#57c7ff" />
		</BarChart>
	);
};
