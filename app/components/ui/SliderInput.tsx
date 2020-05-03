import React from 'react';
import { Col, Row, Slider } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import { SliderProps } from 'antd/lib/slider';

import InputNumberFormatted from 'app/components/ui/InputNumberFormatted';

type Props = {
	sliderProps: Omit<SliderProps, 'value' | 'onChange' | 'min' | 'max'>;
	inputProps: Omit<InputNumberProps, 'value' | 'onChange' | 'min' | 'max' | 'formatter' | 'parser'>;
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	valuePrefix?: string;
	valueSuffix?: string;
	inputSpan?: number;
};

export default ({
	sliderProps,
	inputProps,
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	valuePrefix = '',
	valueSuffix = '',
	inputSpan = 7,
}: Props) => (
	<Row gutter={24} align="middle">
		<Col flex="auto">
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

		<Col span={inputSpan}>
			<InputNumberFormatted
				value={value}
				min={min}
				max={max}
				valuePrefix={valuePrefix}
				valueSuffix={valueSuffix}
				onChange={onChange}
				{...inputProps}
			/>
		</Col>
	</Row>
);
