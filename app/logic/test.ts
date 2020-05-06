import { cloneImageData, indexOfPixel } from 'app/logic/helpers';
import { histogram, accumulateHistogram } from 'app/logic/algorithms';

// TEST2020A1: https://unisulbr-my.sharepoint.com/:w:/g/personal/ademir_ferreira_unisul_br/Eb1AswBLblJPvnFZiwX34TEB_y7-jSPWRCrFfQBqAbdsZg?e=pUcnC1

export const test2020A1Qt1 = (imageData: ImageData, quadrants: number[]) => {
	const newImageData = cloneImageData(imageData);

	const { data: originalData } = imageData;
	const { data, width, height } = newImageData;

	const acceptableQuadrants = new Set(quadrants.filter((quadrant) => quadrant > 0 && quadrant <= 4));

	const xThreshold = Math.ceil(width / 2);
	const yThreshold = Math.ceil(height / 2);

	const thresholds = [
		[0, 0, xThreshold, yThreshold], // first quadrant coords
		[xThreshold, 0, width, yThreshold], // second quadrant coords
		[0, yThreshold - 1, xThreshold, height], // third quadrant coords
		[xThreshold, yThreshold - 1, width, height], // fourth quadrant coords
	];

	thresholds.forEach(([startX, startY, endX, endY], quadrantIndex) => {
		if (acceptableQuadrants.has(quadrantIndex + 1)) {
			for (let x = startX; x < endX; x += 1) {
				for (let y = startY; y < endY; y += 1) {
					const i = indexOfPixel(x, y, width);
					// get the starting index of the mirrored pixel in an 180º angle
					const j = indexOfPixel(startX + endX - 1 - x, startY + endY - 1 - y, width);

					// swap the pixel color value with its mirrored pixel color value
					data[i] = originalData[j];
					data[i + 1] = originalData[j + 1];
					data[i + 2] = originalData[j + 2];
					data[i + 3] = originalData[j + 3];
				}
			}
		}
	});

	return newImageData;
};

export const test2020A1Qt2 = (imageData: ImageData) => {
	const newImageData = cloneImageData(imageData);

	const { data, width, height } = newImageData;

	const histo = histogram(newImageData);
	const accumulatedHisto = accumulateHistogram(histo);
	const nShadesCountResult = 255 / (data.length / 4);

	// iterate through the x-coordinates of the image
	for (let x = 0; x < width; x += 1) {
		const equivalentYPixelCoord = Math.floor((height * x) / width);
		const i = indexOfPixel(x, equivalentYPixelCoord, width);

		data[i] = 0;
		data[i + 1] = 0;
		data[i + 2] = 0;
		data[i + 3] = 255;

		// iterate through the y-coordinates of the image
		for (let y = 0; y < height; y += 1) {
			// if the pixel is above the diagonal intersection sets its color value to its equalized color value
			if (y < equivalentYPixelCoord) {
				const j = indexOfPixel(x, y, width);

				data[j] = nShadesCountResult * accumulatedHisto[data[j + 1]].r;
				data[j + 1] = nShadesCountResult * accumulatedHisto[data[j + 1]].g;
				data[j + 2] = nShadesCountResult * accumulatedHisto[data[j + 2]].b;
				data[j + 3] = nShadesCountResult * accumulatedHisto[data[j + 3]].a;
			}
		}
	}

	return newImageData;
};

export const test2020A1Qt3 = (imageData: ImageData) => {
	const { data, width } = imageData;

	const isPixelColorSolidBlack = (i: number) =>
		data[i + 3] === 255 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0;

	const yStep = width * 4;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		// find the top left pixel of the solid black rect
		if (isPixelColorSolidBlack(i)) {
			let j = i + 4;
			if (isPixelColorSolidBlack(j)) {
				// go through each top pixel of the solid black rect
				do {
					j += 4;
				} while (isPixelColorSolidBlack(j + 4));

				j += yStep;
				if (isPixelColorSolidBlack(j)) {
					// go through each right pixel of the solid black rect
					do {
						j += yStep;
					} while (isPixelColorSolidBlack(j + yStep));

					j -= 4;
					if (isPixelColorSolidBlack(j)) {
						// go through each bottom pixel of the solid black rect
						do {
							j -= 4;
						} while (isPixelColorSolidBlack(j - 4));

						j -= yStep;
						if (isPixelColorSolidBlack(j)) {
							// go through each left pixel of the solid black rect
							do {
								j -= yStep;
							} while (isPixelColorSolidBlack(j - yStep));

							// if we are back at the starting pixel it isn't an open rect
							if (j === i) {
								return false;
							}
						}
					}
				}
			}

			break;
		}
	}

	return true;
};
