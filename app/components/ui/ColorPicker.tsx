import React from 'react';
import { Button, Popover } from 'antd';
import { ChromePicker, ChromePickerProps } from 'react-color';

import { RGBAColor } from 'app/logic/types';

type Props = {
	colorPickerProps: ChromePickerProps;
	value: RGBAColor;
	onChange: (value: RGBAColor) => void;
	width?: string;
	height?: string;
};

export default ({ colorPickerProps, value, onChange, width = '64px', height = '32px' }: Props) => (
	<Popover
		placement="bottom"
		trigger="click"
		content={
			<ChromePicker
				color={{ ...value, ...(value.a && { a: value.a / 255 }) }}
				onChange={({ rgb: { r, g, b, a } }) => onChange({ r, g, b, a: a ? a * 255 : undefined })}
				styles={{
					default: {
						picker: { boxShadow: 'none', background: 'transparent', fontFamily: 'inherit' },
					},
				}}
				{...colorPickerProps}
			/>
		}
	>
		<Button style={{ padding: '4px', width, height }}>
			<div
				style={{
					borderRadius: '2px',
					width: '100%',
					height: '100%',
					background: `rgba(${value.r},${value.g},${value.b},${value.a ? value.a / 255 : 1})`,
				}}
			/>
		</Button>
	</Popover>
);
