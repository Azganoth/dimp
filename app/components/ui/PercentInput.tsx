import React from 'react'
import { InputNumber } from 'antd'
import { InputNumberProps } from 'antd/lib/input-number'

import { normalizeIntegerInput } from 'app/utils/normalize'

const percentFormatter = (value: string | number | undefined) => {
	return `${value ?? 0}%`
}

const percentParser = (value: string | undefined) => {
	if (!value) {
		return 0
	}

	return normalizeIntegerInput(value.replace('%', ''), 0, 100)
}

// Disabled because I don't want to download a package just for one line of code
// eslint-disable-next-line @typescript-eslint/ban-types
type PercentInputProps = Omit<InputNumberProps, 'min' | 'max' | 'formatter' | 'parser' | 'onChange'> & {
	onChange?: (value: number) => void
}

const PercentInput = ({ onChange, ...otherProps }: PercentInputProps) => (
	<InputNumber
		{...otherProps}
		min={0}
		max={100}
		formatter={percentFormatter}
		parser={percentParser}
		onChange={(value) => {
			if (onChange) {
				onChange(value ?? 0)
			}
		}}
	/>
)

export default PercentInput
