import React from 'react';
import { Col, InputNumber, Row, Slider } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import { SliderProps } from 'antd/lib/slider';

type Props = {
	sliderProps: SliderProps;
	inputProps: InputNumberProps;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	prefix?: string;
	suffix?: string;
};

export default ({
	sliderProps,
	inputProps,
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	prefix = '',
	suffix = '',
}: Props) => {
	const formatter = (val: string | number | undefined) => {
		return `${prefix}${val ?? min}${suffix}`;
	};

	const parser = (val: string | undefined) => {
		const valNumber = Number.parseInt(String(val?.replace(prefix, '').replace(suffix, '')), 10);
		return Math.min(Math.max(Number.isNaN(valNumber) ? min : valNumber, min), max);
	};

	return (
		<Row align="middle">
			<Col span={18}>
				<Slider
					value={value}
					min={min}
					max={max}
					onChange={(val) => {
						if (typeof val === 'number') {
							onChange(val);
						}
					}}
					tooltipVisible={false}
					{...sliderProps}
				/>
			</Col>
			<Col span={4} offset={2}>
				<InputNumber
					value={value}
					min={min}
					max={max}
					formatter={formatter}
					parser={parser}
					onChange={(val) => onChange(val ?? min)}
					style={{ width: '100%' }}
					{...inputProps}
				/>
			</Col>
		</Row>
	);
};
