import React from 'react';
import { Button, Popover } from 'antd';
import { PopoverProps } from 'antd/lib/popover';
import { ChromePicker, ChromePickerProps } from 'react-color';

import { RGBAColor } from 'app/typing/common';

type ColorPickerProps = Omit<PopoverProps, 'content'> & {
	value: RGBAColor;
	onChange: (value: RGBAColor) => void;
	width?: string;
	height?: string;
	colorPickerProps: Omit<ChromePickerProps, 'color' | 'onChange' | 'onChangeComplete'>;
};

const ColorPicker: React.FunctionComponent<ColorPickerProps> = ({
	value,
	onChange,
	width = '48px',
	height = '24px',
	colorPickerProps,
	...otherProps
}: ColorPickerProps) => (
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
				// Disabled because a lot of props may pass down the tree
				// eslint-disable-next-line react/jsx-props-no-spreading
				{...colorPickerProps}
			/>
		}
		// Disabled because a lot of props may pass down the tree
		// eslint-disable-next-line react/jsx-props-no-spreading
		{...otherProps}
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

export default ColorPicker;
