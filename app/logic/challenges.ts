import { cloneImageData, indexOfPixel } from 'app/logic/helpers';

/**
 * Draws a green border on the area specified by
 * [`startX`, `startY`] and [`endX`, `endY`]
 * in the image data and returns the marked image data.
 */
// eslint-disable-next-line import/prefer-default-export
export const drawGreenBorder = (imageData: ImageData, startX: number, startY: number, endX: number, endY: number) => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;

	const minX = Math.min(startX, endX);
	const minY = Math.min(startY, endY);
	const maxX = Math.max(startX, endX);
	const maxY = Math.max(startY, endY);

	// iterate through each horizontal pixel coordinate from minX to maxX
	for (let x = minX; x <= maxX; x += 1) {
		// set the color of the two pixels from the top and bottom border to green
		[indexOfPixel(x, startY, width), indexOfPixel(x, endY, width)].forEach((i) => {
			data[i] = 0;
			data[i + 1] = 255;
			data[i + 2] = 0;
			data[i + 3] = 255;
		});
	}

	// iterate through each vertical pixel coordinate from minY + 1 to maxY - 1
	// ignore the first and last pixels because they are already marked by the horizontal iteration
	for (let y = minY + 1; y < maxY; y += 1) {
		// set the color of the two pixels from the left and right border to green
		[indexOfPixel(startX, y, width), indexOfPixel(endX, y, width)].forEach((i) => {
			data[i] = 0;
			data[i + 1] = 255;
			data[i + 2] = 0;
			data[i + 3] = 255;
		});
	}

	return newImageData;
};
