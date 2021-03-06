import React from 'react';
import { Col, Row, Slider } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';
import { SliderProps } from 'antd/lib/slider';

import InputNumberFormatted from 'app/components/ui/InputNumberFormatted';

type SliderInputProps = {
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

const SliderInput: React.FunctionComponent<SliderInputProps> = ({
	sliderProps,
	inputProps,
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	valuePrefix = '',
	valueSuffix = '',
	inputSpan = 7,
}: SliderInputProps) => (
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
				// Disabled because a lot of props may pass down the tree
				// eslint-disable-next-line react/jsx-props-no-spreading
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
				// Disabled because a lot of props may pass down the tree
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...inputProps}
			/>
		</Col>
	</Row>
);

export default SliderInput;
