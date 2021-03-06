import { mean, median, weightedMean } from 'app/logic/math';
import { cloneImageData, indexOfPixel } from 'app/logic/helpers';
import { RGBAColor } from 'app/typing/common';

/**
 * Draws a border in the selected area of an the image and returns it.
 *
 * @param imageData The image data.
 * @param startX The starting point x-coordinate.
 * @param startY The starting point y-coordinate.
 * @param endX The ending point x-coordinate.
 * @param endY The ending point y-coordinate.
 * @param options The border options. `color` defaults to green; `width` defaults to 1.
 */
export const drawBorder = (
	imageData: ImageData,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	options: { borderColor?: RGBAColor; borderWidth?: number } = {}
): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;

	const minX = Math.min(startX, endX);
	const minY = Math.min(startY, endY);
	const maxX = Math.max(startX, endX);
	const maxY = Math.max(startY, endY);

	const { borderColor: { r, g, b, a = 255 } = { r: 0, g: 102, b: 204 }, borderWidth = 1 } = options;

	const minBorderWidth = Math.min(borderWidth, maxX - minX, maxY - minY);

	// iterate through the x-coordinates of the specified area
	for (let x = minX; x <= maxX; x += 1) {
		// set the color of the pixels at the x-coordinate
		for (let j = 0; j < minBorderWidth; j += 1) {
			[indexOfPixel(x, minY + j, width), indexOfPixel(x, maxY - j, width)].forEach((i) => {
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = a;
			});
		}
	}

	// iterate through the y-coordinates of the specified area
	// skip the edge pixels because they are already covered by the x-coordinates iteration
	for (let y = minY + minBorderWidth; y <= maxY - minBorderWidth; y += 1) {
		// set the color of the pixels at the y-coordinate
		for (let j = 0; j < minBorderWidth; j += 1) {
			[indexOfPixel(minX + j, y, width), indexOfPixel(maxX - j, y, width)].forEach((i) => {
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = a;
			});
		}
	}

	return newImageData;
};

/**
 * Returns a completely desaturated image.
 *
 * @param imageData The image data.
 * @param weight The weight of each color channel.
 */
export const greyscale = (imageData: ImageData, weight?: { r: number; g: number; b: number }): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	/**
	 * Returns the correct grey tone of the pixel through the mean of its r, g and b values.
	 *
	 * @param r The red value.
	 * @param g The green value.
	 * @param b The blue value.
	 */
	const pixelGreyTone = (r: number, g: number, b: number) =>
		weight ? weightedMean(r * weight.r, g * weight.g, b * weight.b) : mean(r, g, b);

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		const greyTone = pixelGreyTone(data[i], data[i + 1], data[i + 2]);

		// set the pixel color value to its grey tone
		data[i] = greyTone;
		data[i + 1] = greyTone;
		data[i + 2] = greyTone;
	}

	return newImageData;
};

/**
 * Returns a binary image, replacing each pixel with
 * a solid black pixel if its intensity is less than the threshold value, or
 * a solid white pixel if it is greater or equal than the threshold value.
 *
 * @param imageData The image data.
 * @param threshold The threshold value.
 */
export const thresh = (imageData: ImageData, threshold: number): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		const value = mean(data[i], data[i + 1], data[i + 2]) < threshold ? 0 : 255;

		// set the pixel color to solid black if the mean between its channels is smaller than the threshold value
		// otherwise set it to solid white
		data[i] = value;
		data[i + 1] = value;
		data[i + 2] = value;
	}

	return newImageData;
};

/**
 * Returns the negative of an image, replacing each pixel with its inverted color.
 *
 * @param imageData The image data.
 */
export const negative = (imageData: ImageData): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		// set the pixel color value to its complementary color value
		data[i] = 255 - data[i];
		data[i + 1] = 255 - data[i + 1];
		data[i + 2] = 255 - data[i + 2];
	}

	return newImageData;
};

/**
 * Returns a less noisy image.
 *
 * @param imageData The image data.
 * @param removalType The removal type. `cross` to use only direct neighbors; `x` to use only dialognal neighbors; `3x3` to use all neighbors.
 */
export const removeNoise = (imageData: ImageData, removalType: 'cross' | 'x' | '3x3'): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data, width, height } = newImageData;

	/**
	 * Sets the pixel color channel value to the median of its value and its neighbors channel color value.
	 *
	 * @param i The pixel starting index in the image data array.
	 */
	const blurPixel = (i: number) => {
		const top = i - width * 4;
		const bottom = i + width * 4;

		switch (removalType) {
			// calculate channels values using only its direct neighbors
			case 'cross': {
				const left = i - 4;
				const right = i + 4;

				for (let j = 0; j < 3; j += 1) {
					data[i + j] = median(data[i + j], data[top + j], data[left + j], data[bottom + j], data[right + j]);
				}

				break;
			}
			// calculate channels values using only its diagonals neighbors
			case 'x': {
				const topLeft = top - 4;
				const topRight = top + 4;
				const bottomLeft = bottom - 4;
				const bottomRight = bottom + 4;

				for (let j = 0; j < 3; j += 1) {
					data[i + j] = median(
						data[i + j],
						data[topLeft + j],
						data[topRight + j],
						data[bottomLeft + j],
						data[bottomRight + j]
					);
				}

				break;
			}
			// calculate channels values using all of its neighbors
			case '3x3': {
				const left = i - 4;
				const right = i + 4;
				const topLeft = top - 4;
				const topRight = top + 4;
				const bottomLeft = bottom - 4;
				const bottomRight = bottom + 4;

				for (let j = 0; j < 3; j += 1) {
					data[i + j] = median(
						data[i + j],
						data[left + j],
						data[right + j],
						data[top + j],
						data[topLeft + j],
						data[topRight + j],
						data[bottom + j],
						data[bottomLeft + j],
						data[bottomRight + j]
					);
				}

				break;
			}
			// ignore if an invalid removal type is provided
			default:
				break;
		}
	};

	// iterate through the x-coordinates and y-coordinates of the image, ignoring the edges
	for (let x = 1; x < width - 1; x += 1) {
		for (let y = 1; y < height - 1; y += 1) {
			blurPixel(indexOfPixel(x, y, width));
		}
	}

	return newImageData;
};

/**
 * Returns the blend between two images.
 *
 * @param imageData1 The first image data.
 * @param imageData2 The second image data.
 * @param image1Percentage The first image amount, from 0 to 100.
 * @param image2Percentage The second image amount, from 0 to 100.
 */
export const sum = (
	imageData1: ImageData,
	imageData2: ImageData,
	image1Percentage: number,
	image2Percentage: number
): ImageData => {
	const { data: dataImage1, width: widthImage1 } = imageData1;
	const { data: dataImage2, width: widthImage2 } = imageData2;

	const width = Math.min(widthImage1, widthImage2);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data } = newImageData;

	// iterate through the x-coordinates and y-coordinates of the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);
			const iImage1 = indexOfPixel(x, y, widthImage1);
			const iImage2 = indexOfPixel(x, y, widthImage2);

			// set pixel color value to the sum of its mirrored pixels color values of the two images,
			// after applying the image weight to each value
			for (let j = 0; j < 3; j += 1) {
				data[i + j] = (dataImage1[iImage1 + j] * image1Percentage + dataImage2[iImage2 + j] * image2Percentage) / 100;
			}

			// set the pixel opacity value to 255, this is needed because new ImageData() sets every pixel opacity value to 0
			data[i + 3] = 255;
		}
	}

	return newImageData;
};

/**
 * Returns the subtraction between two images.
 *
 * @param imageData1 The first image data.
 * @param imageData2 The second image data.
 * @param image1Percentage The first image amount, from 0 to 100.
 * @param image2Percentage The second image amount, from 0 to 100.
 */
export const sub = (
	imageData1: ImageData,
	imageData2: ImageData,
	image1Percentage: number,
	image2Percentage: number
): ImageData => {
	const { data: dataImage1, width: widthImage1 } = imageData1;
	const { data: dataImage2, width: widthImage2 } = imageData2;

	const width = Math.min(widthImage1, widthImage2);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data } = newImageData;

	// iterate through the x-coordinates and y-coordinates of the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);
			const iImage1 = indexOfPixel(x, y, widthImage1);
			const iImage2 = indexOfPixel(x, y, widthImage2);

			// set pixel color value to the subtraction of its mirrored pixels color values of the two images,
			// after applying the image weight to each value
			for (let j = 0; j < 3; j += 1) {
				data[i + j] = (dataImage1[iImage1 + j] * image1Percentage - dataImage2[iImage2 + j] * image2Percentage) / 100;
			}

			// set the pixel opacity value to 255, this is needed because new ImageData() sets every pixel opacity value to 0
			data[i + 3] = 255;
		}
	}

	return newImageData;
};

export type HistogramValue = {
	r: number;
	g: number;
	b: number;
	a: number;
};

/**
 * Returns a histogram (0-255) of an image.
 *
 * @param imageData The image data.
 */
export const histogram = (imageData: ImageData): HistogramValue[] => {
	// each index will store how many pixels in the image contains the index value as a channel value
	const histo: HistogramValue[] = Array.from({ length: 256 }, () => ({ r: 0, g: 0, b: 0, a: 0 }));

	const { data } = imageData;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		histo[data[i]].r += 1;
		histo[data[i + 1]].g += 1;
		histo[data[i + 2]].b += 1;
		histo[data[i + 3]].a += 1;
	}

	return histo;
};

/**
 * Returns the accumulated histogram.
 *
 * @param histo The histogram.
 */
export const accumulateHistogram = (histo: HistogramValue[]): HistogramValue[] => {
	const accumulatedHistogram: HistogramValue[] = [...histo];

	accumulatedHistogram.slice(1).forEach((histoValue, index) => {
		const { r, g, b, a } = accumulatedHistogram[index];
		histoValue.r += r;
		histoValue.g += g;
		histoValue.b += b;
		histoValue.a += a;
	});

	return accumulatedHistogram;
};

/**
 * Returns an equalizated image.
 *
 * @param imageData The image data.
 * @param onlyValidPixels `true` if only the valid pixels (not black) will be considered, `false` otherwise.
 */
export const equalization = (imageData: ImageData, onlyValidPixels: boolean): ImageData => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	const histo = histogram(imageData);

	const accumulatedHisto = accumulateHistogram(histo);

	let histoShadesCount: HistogramValue;
	if (onlyValidPixels) {
		histoShadesCount = { r: 0, g: 0, b: 0, a: 0 };

		histo.forEach(({ r, g, b, a }) => {
			if (r !== 0) {
				histoShadesCount.r += 1;
			}
			if (g !== 0) {
				histoShadesCount.g += 1;
			}
			if (b !== 0) {
				histoShadesCount.b += 1;
			}
			if (a !== 0) {
				histoShadesCount.a += 1;
			}
		});
	} else {
		histoShadesCount = { r: 256, g: 256, b: 256, a: 256 };
	}

	const histoMinPoint = onlyValidPixels
		? {
				r: histo.findIndex(({ r }) => r !== 0),
				g: histo.findIndex(({ g }) => g !== 0),
				b: histo.findIndex(({ b }) => b !== 0),
				a: histo.findIndex(({ a }) => a !== 0),
		  }
		: { r: 0, g: 0, b: 0, a: 0 };

	const n = data.length / 4;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		// set pixel color value to its equalized value
		data[i] = accumulatedHisto[data[i]].r * ((histoShadesCount.r - 1) / n) + histoMinPoint.r;
		data[i + 1] = histoMinPoint.g + ((histoShadesCount.g - 1) / n) * accumulatedHisto[data[i + 1]].g;
		data[i + 2] = histoMinPoint.b + ((histoShadesCount.b - 1) / n) * accumulatedHisto[data[i + 2]].b;
		data[i + 3] = histoMinPoint.a + ((histoShadesCount.a - 1) / n) * accumulatedHisto[data[i + 3]].a;
	}

	return newImageData;
};
