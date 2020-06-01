import React from 'react';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';

type InputNumberFormattedProps = Omit<
	InputNumberProps,
	'value' | 'onChange' | 'min' | 'max' | 'formatter' | 'parser'
> & {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	valuePrefix?: string;
	valueSuffix?: string;
};

const InputNumberFormatted: React.FunctionComponent<InputNumberFormattedProps> = ({
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	valuePrefix = '',
	valueSuffix = '',
	...otherProps
}: InputNumberFormattedProps) => {
	const formatter = (val: string | number | undefined) => {
		return `${valuePrefix}${val ?? min}${valueSuffix}`;
	};

	const parser = (val: string | undefined) => {
		const valNumber = Number.parseInt(String(val?.replace(valuePrefix, '').replace(valueSuffix, '')), 10);
		return Math.min(Math.max(Number.isNaN(valNumber) ? min : valNumber, min), max);
	};

	return (
		<InputNumber
			value={value}
			onChange={(val) => {
				const num = typeof val === 'number' ? val : Number.parseInt(String(val), 10);
				onChange(Number.isNaN(num) ? min : num);
			}}
			min={min}
			max={max}
			formatter={formatter}
			parser={parser}
			style={{ width: '100%' }}
			// Disabled because a lot of props may pass down the tree
			// eslint-disable-next-line react/jsx-props-no-spreading
			{...otherProps}
		/>
	);
};

export default InputNumberFormatted;
