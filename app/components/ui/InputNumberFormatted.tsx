import React from 'react';
import { InputNumber } from 'antd';
import { InputNumberProps } from 'antd/lib/input-number';

type Props = Omit<InputNumberProps, 'value' | 'onChange' | 'min' | 'max' | 'formatter' | 'parser'> & {
	value: number;
	onChange: (value: number) => void;
	min?: number;
	max?: number;
	valuePrefix?: string;
	valueSuffix?: string;
};

export default ({
	value,
	onChange,
	min = -Infinity,
	max = Infinity,
	valuePrefix = '',
	valueSuffix = '',
	...otherProps
}: Props) => {
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
			onChange={(val) => onChange(val ?? min)}
			min={min}
			max={max}
			formatter={formatter}
			parser={parser}
			style={{ width: '100%' }}
			{...otherProps}
		/>
	);
};
