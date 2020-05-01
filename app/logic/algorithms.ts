import { mean, weightedMean, median } from 'app/logic/math';
import { cloneImageData, indexOfPixel } from 'app/logic/helpers';
import { RGBAColor } from 'app/logic/types';

/**
 * Draws a border on the area specified by
 * [`startX`, `startY`] and [`endX`, `endY`]
 * in the image data and returns the marked image data.
 *
 * @param imageData The image data
 * @param startX The starting x point
 * @param startY The starting y point
 * @param endX The ending x point
 * @param endY The ending y point
 * @param color The border color, defaults to green
 */
export const drawBorder = (
	imageData: ImageData,
	startX: number,
	startY: number,
	endX: number,
	endY: number,
	color: RGBAColor = { r: 0, g: 255, b: 0 }
) => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;

	const minX = Math.min(startX, endX);
	const minY = Math.min(startY, endY);
	const maxX = Math.max(startX, endX);
	const maxY = Math.max(startY, endY);

	const { r, g, b, a = 255 } = color;

	// iterate through each horizontal pixel coordinate from minX to maxX
	for (let x = minX; x <= maxX; x += 1) {
		// set the color of the two pixels from the top and bottom border
		[indexOfPixel(x, startY, width), indexOfPixel(x, endY, width)].forEach((i) => {
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = a;
		});
	}

	// iterate through each vertical pixel coordinate from minY + 1 to maxY - 1
	// ignore the first and last pixels because they are already marked by the horizontal iteration
	for (let y = minY + 1; y < maxY; y += 1) {
		// set the color of the two pixels from the left and right border
		[indexOfPixel(startX, y, width), indexOfPixel(endX, y, width)].forEach((i) => {
			data[i] = r;
			data[i + 1] = g;
			data[i + 2] = b;
			data[i + 3] = a;
		});
	}

	return newImageData;
};

/**
 * Returns a completely desaturated image.
 *
 * @param imageData The image data
 * @param weight The weight of each color channel
 */
export const greyscale = (imageData: ImageData, weight?: { r: number; g: number; b: number }) => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	/**
	 * Returns the correct grey tone of the pixel through the mean of its r, g and b values.
	 *
	 * @param r The red value
	 * @param g The green value
	 * @param b The blue value
	 */
	const pixelGreyTone = (r: number, g: number, b: number) =>
		weight ? weightedMean(r * weight.r, g * weight.g, b * weight.b) : mean(r, g, b);

	// iterate through the image pixels ([r,g,b,a])
	for (let i = 0; i < data.length; i += 4) {
		// store the pixel grey tone
		const greyTone = pixelGreyTone(data[i], data[i + 1], data[i + 2]);

		// set the pixel color value to its grey tone
		data[i] = greyTone;
		data[i + 1] = greyTone;
		data[i + 2] = greyTone;
	}

	return newImageData;
};

/**
 * Returns a binary image, replacing each pixel with a black pixel
 * if its intensity is less than the threshold value,
 * or a white pixel if it is greater or equal than the threshold value.
 *
 * @param imageData The image data
 * @param threshold The threshold value
 */
export const thresh = (imageData: ImageData, threshold: number) => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	// iterate through the image pixels ([r,g,b,a])
	for (let i = 0; i < data.length; i += 4) {
		// store 0 if the mean between the pixel r, g and b values is smaller than the threshold, store 255 otherwise
		const value = mean(data[i], data[i + 1], data[i + 2]) < threshold ? 0 : 255;

		// set the pixel color to black or white, depending on the thresholding result
		data[i] = value;
		data[i + 1] = value;
		data[i + 2] = value;
	}

	return newImageData;
};

/**
 * Returns the negative of an image,
 * replacing each pixel with its inverted color.
 *
 * @param imageData The image data
 */
export const negative = (imageData: ImageData) => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	// iterate through the image pixels ([r,g,b,a])
	for (let i = 0; i < data.length; i += 4) {
		// set the pixel color value to its negative value
		data[i] = 255 - data[i];
		data[i + 1] = 255 - data[i + 1];
		data[i + 2] = 255 - data[i + 2];
	}

	return newImageData;
};

/**
 * Returns a less noisy image.
 *
 * @param imageData The image data
 * @param removalType The removal type, `0` to cross, `1` to X and `2` to 3x3
 */
export const removeNoise = (imageData: ImageData, removalType: number) => {
	const newImageData = cloneImageData(imageData);

	const { data, width, height } = newImageData;

	/**
	 * Sets each pixel channel value to the median of its neighbors respective channel.
	 *
	 * @param i The pixel ([r,g,b,a]) starting index in the array
	 */
	const setPixelColor = (i: number) => {
		const top = i - width * 4;
		const bottom = i + width * 4;

		switch (removalType) {
			case 0: {
				const left = i - 4;
				const right = i + 4;

				for (let j = 0; j < 3; j += 1) {
					data[i + j] = median(data[i + j], data[top + j], data[left + j], data[bottom + j], data[right + j]);
				}

				break;
			}
			case 1: {
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
			case 2: {
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
			default:
				break;
		}
	};

	// iterate through each pixel cartesian coordinate ([x,y]) in the image, ignoring the borders
	for (let x = 1; x < width - 1; x += 1) {
		for (let y = 1; y < height - 1; y += 1) {
			setPixelColor(indexOfPixel(x, y, width));
		}
	}

	return newImageData;
};

/**
 * Returns the blend between two images.
 *
 * @param imageData1 The first image data
 * @param imageData2 The second image data
 * @param image1Percentage The first image amount, from 0 to 100
 * @param image2Percentage The second image amount, from 0 to 100
 */
export const sum = (
	imageData1: ImageData,
	imageData2: ImageData,
	image1Percentage: number,
	image2Percentage: number
) => {
	const { data: dataImage1, width: widthImage1 } = imageData1;
	const { data: dataImage2, width: widthImage2 } = imageData2;

	const width = Math.min(widthImage1, widthImage2);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data } = newImageData;

	// iterate through each pixel cartesian coordinate ([x,y]) in the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);
			const iImage1 = indexOfPixel(x, y, widthImage1);
			const iImage2 = indexOfPixel(x, y, widthImage2);

			for (let j = 0; j < 3; j += 1) {
				data[i + j] = (dataImage1[iImage1 + j] * image1Percentage + dataImage2[iImage2 + j] * image2Percentage) / 100;
			}

			// set the pixel opacity to 255, this is needed because new ImageData() sets every pixel opacity to 0
			data[i + 3] = 255;
		}
	}

	return newImageData;
};

/**
 * Returns the subtraction between two images.
 *
 * @param imageData1 The first image data
 * @param imageData2 The second image data
 * @param image1Percentage The first image amount, from 0 to 100
 * @param image2Percentage The second image amount, from 0 to 100
 */
export const sub = (
	imageData1: ImageData,
	imageData2: ImageData,
	image1Percentage: number,
	image2Percentage: number
) => {
	const { data: dataImage1, width: widthImage1 } = imageData1;
	const { data: dataImage2, width: widthImage2 } = imageData2;

	const width = Math.min(widthImage1, widthImage2);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data } = newImageData;

	// iterate through each pixel cartesian coordinate ([x,y]) in the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);
			const iImage1 = indexOfPixel(x, y, widthImage1);
			const iImage2 = indexOfPixel(x, y, widthImage2);

			for (let j = 0; j < 3; j += 1) {
				data[i + j] = (dataImage1[iImage1 + j] * image1Percentage - dataImage2[iImage2 + j] * image2Percentage) / 100;
			}

			// set the pixel opacity to 255, this is needed because new ImageData() sets every pixel opacity to 0
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
 * Returns a histogram array (0-255) of an image data.
 *
 * @param imageData The image data
 */
export const histogram = (imageData: ImageData) => {
	const histo: HistogramValue[] = Array.from({ length: 256 }, () => ({ r: 0, g: 0, b: 0, a: 0 }));

	const { data } = imageData;

	// iterate through the image pixels ([r,g,b,a])
	for (let i = 0; i < data.length; i += 4) {
		// use each pixel channel value as an index in the `histo` array and increment the `histo[index]` value
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
 * @param histo The histogram
 */
export const accumulateHistogram = (histo: HistogramValue[]) =>
	histo.reduce((accHisto, { r, g, b, a }, index) => {
		const { r: accR, g: accG, b: accB, a: accA } = index !== 0 ? accHisto[index - 1] : { r: 0, g: 0, b: 0, a: 0 };
		accHisto.push({
			r: r + accR,
			g: g + accG,
			b: b + accB,
			a: a + accA,
		});

		return accHisto;
	}, [] as HistogramValue[]);

/**
 * Returns an equalizated image.
 *
 * @param imageData The image data
 * @param onlyValidPixels `true` if only the valid pixels (not black) will be considered, `false` otherwise
 */
export const equalization = (imageData: ImageData, onlyValidPixels: boolean) => {
	const newImageData = cloneImageData(imageData);

	const { data } = newImageData;

	const histo = histogram(imageData);

	const accumulatedHisto = accumulateHistogram(histo);

	const histoShadesCount = onlyValidPixels
		? histo.reduce(
				(shadesCount, { r, g, b, a }) => {
					if (r !== 0) {
						shadesCount.r += 1;
					}
					if (g !== 0) {
						shadesCount.g += 1;
					}
					if (b !== 0) {
						shadesCount.b += 1;
					}
					if (a !== 0) {
						shadesCount.a += 1;
					}

					return shadesCount;
				},
				{ r: 0, g: 0, b: 0, a: 0 }
		  )
		: { r: 256, g: 256, b: 256, a: 256 };

	const histoMinPoint = onlyValidPixels
		? {
				r: histo.findIndex(({ r }) => r !== 0),
				g: histo.findIndex(({ g }) => g !== 0),
				b: histo.findIndex(({ b }) => b !== 0),
				a: histo.findIndex(({ a }) => a !== 0),
		  }
		: { r: 0, g: 0, b: 0, a: 0 };

	// store the number of pixels in the image (height * width)
	const n = data.length / 4;

	// iterate through the image pixels ([r,g,b,a])
	for (let i = 0; i < data.length; i += 4) {
		// set each color channel value to its equalized value
		data[i] = accumulatedHisto[data[i]].r * ((histoShadesCount.r - 1) / n) + histoMinPoint.r;
		data[i + 1] = histoMinPoint.g + ((histoShadesCount.g - 1) / n) * accumulatedHisto[data[i + 1]].g;
		data[i + 2] = histoMinPoint.b + ((histoShadesCount.b - 1) / n) * accumulatedHisto[data[i + 2]].b;
		data[i + 3] = histoMinPoint.a + ((histoShadesCount.a - 1) / n) * accumulatedHisto[data[i + 3]].a;
	}

	return newImageData;
};
