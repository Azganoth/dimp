import { mean, weightedMean, median } from 'app/logic/math';
import { cloneImageData, indexOfPixel } from 'app/logic/helpers';

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
	const width = Math.min(imageData1.width, imageData2.width);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data: dataImage1 } = imageData1;
	const { data: dataImage2 } = imageData2;
	const { data } = newImageData;

	// iterate through each pixel cartesian coordinate ([x,y]) in the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);

			for (let j = 0; j < 3; j += 1) {
				const c = i + j;
				data[c] = (dataImage1[c] * image1Percentage + dataImage2[c] * image2Percentage) / 100;
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
	const width = Math.min(imageData1.width, imageData2.width);
	const height = Math.min(imageData1.height, imageData2.height);

	const newImageData = new ImageData(width, height);

	const { data: dataImage1 } = imageData1;
	const { data: dataImage2 } = imageData2;
	const { data } = newImageData;

	// iterate through each pixel cartesian coordinate ([x,y]) in the image
	for (let x = 0; x < width; x += 1) {
		for (let y = 0; y < height; y += 1) {
			const i = indexOfPixel(x, y, width);

			for (let j = 0; j < 3; j += 1) {
				const c = i + j;
				data[c] = (dataImage1[c] * image1Percentage - dataImage2[c] * image2Percentage) / 100;
			}

			// set the pixel opacity to 255, this is needed because new ImageData() sets every pixel opacity to 0
			data[i + 3] = 255;
		}
	}

	return newImageData;
};
