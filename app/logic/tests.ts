import { mean } from 'app/logic/math';
import { cloneImageData, indexOfPixel } from 'app/logic/helpers';
import { RGBAColor } from 'app/logic/types';

/*
 * Test2016A1: https://unisulbr-my.sharepoint.com/:w:/g/personal/ademir_ferreira_unisul_br/EflymIL1LPBAj10QHHYqkzYByEc6xPKg95Kb66oRVzel3g?e=kCZifl
 *
 * Test2017B1: https://unisulbr-my.sharepoint.com/:w:/g/personal/ademir_ferreira_unisul_br/EbGCn6HV37FKtLX5Z0pYBXIBtreE8aLbZTs08PYQWAgBag?e=QLUgGt
 *
 * Test2019A1: https://unisulbr-my.sharepoint.com/:w:/g/personal/ademir_ferreira_unisul_br/EZIZGs5gB1JAn1qh97nGWWUBt0yJTfZyPHC9QB7fZrbV9Q?e=EMWS8Q
 */

export const test2016A1Qt1 = (imageData: ImageData, numberOfColumns: number) => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;

	const columnWidth = Math.floor(width / numberOfColumns);

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		const x = (i / 4) % width;

		// if the integer of the division between the pixel x coord and the column width is an even number
		// set the pixel color value to its grey tone
		if (Math.floor(x / columnWidth) % 2 === 0) {
			const greyTone = mean(data[i], data[i + 1], data[i + 2]);

			data[i] = greyTone;
			data[i + 1] = greyTone;
			data[i + 2] = greyTone;
		}
	}

	return newImageData;
};

export const test2016A1Qt2 = (imageData: ImageData, startX: number, startY: number, endX: number, endY: number) => {
	const newImageData = cloneImageData(imageData);

	const { data: originalData } = imageData;
	const { data, width } = newImageData;

	const minX = Math.min(startX, endX);
	const minY = Math.min(startY, endY);
	const maxX = Math.max(startX, endX);
	const maxY = Math.max(startY, endY);

	// iterate through the x-coordinates and y-coordinates of the specified area
	for (let x = minX; x <= maxX; x += 1) {
		for (let y = minY; y <= maxY; y += 1) {
			const i = indexOfPixel(x, y, width);
			// get the starting index of the y-coordinate mirrored pixel
			const j = indexOfPixel(x, maxY + minY - y, width);

			// swap the mirrored pixel
			data[i] = originalData[j];
			data[i + 1] = originalData[j + 1];
			data[i + 2] = originalData[j + 2];
		}
	}

	return newImageData;
};

export const test2016A1Qt3 = (imageData: ImageData) => {
	const { data, width } = imageData;

	const isPixelColorSolidBlack = (i: number) =>
		data[i + 3] === 255 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		if (isPixelColorSolidBlack(i)) {
			const jbr = i + width * 4 + 4; // starting index of the bottom right neighbor pixel

			// if the bottom right neighbor pixel exists and its color is solid black the square/rect is filled
			// (unfilled squares/rects can only have 1px of border width)
			if (jbr < data.length && isPixelColorSolidBlack(jbr)) {
				return true;
			}

			break;
		}
	}

	return false;
};

export const test2017B1Qt1 = (imageData: ImageData, borderColor: RGBAColor, borderWidth: number) => {
	// see app/logic/algorithms#drawBorder for more info
	const newImageData = cloneImageData(imageData);

	const { data, width, height } = newImageData;

	const minX = 0;
	const minY = 0;
	const maxX = width - 1;
	const maxY = height - 1;

	const { r, g, b, a = 255 } = borderColor;

	const minBorderWidth = Math.min(borderWidth, height - 1, height - 1);

	for (let x = minX; x <= maxX; x += 1) {
		for (let j = 0; j < minBorderWidth; j += 1) {
			[indexOfPixel(x, j, width), indexOfPixel(x, maxY - j, width)].forEach((i) => {
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = a;
			});
		}
	}

	for (let y = minY + minBorderWidth; y <= maxY - minBorderWidth; y += 1) {
		for (let j = 0; j < minBorderWidth; j += 1) {
			[indexOfPixel(j, y, width), indexOfPixel(maxX - j, y, width)].forEach((i) => {
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = a;
			});
		}
	}

	return newImageData;
};

export const test2017B1Qt2 = (imageData: ImageData) => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;

	let middleThreshold = data.length / 2;
	middleThreshold -= middleThreshold % (width * 4);

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		// if the pixel is above the middle of the image then set the pixel color value to its complementary color value
		// otherwise set the pixel color value to its grey tone
		if (i < middleThreshold) {
			data[i] = 255 - data[i];
			data[i + 1] = 255 - data[i + 1];
			data[i + 2] = 255 - data[i + 2];
		} else {
			const greyTone = mean(data[i], data[i + 1], data[i + 2]);

			data[i] = greyTone;
			data[i + 1] = greyTone;
			data[i + 2] = greyTone;
		}
	}

	return newImageData;
};

export const test2017B1Qt3 = (imageData: ImageData) => {
	const { data, width } = imageData;

	const isPixelColorSolidBlack = (i: number) =>
		data[i + 3] === 255 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0;

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		if (isPixelColorSolidBlack(i)) {
			const jbl = i + width * 4 - 4; // starting index of the bottom left neighbor pixel
			const jb = i + width * 4; // starting index of the bottom neighbor pixel

			// if the bottom right neighbor pixel exists and its color is solid black it is an circle
			if (jbl < data.length && isPixelColorSolidBlack(jbl)) {
				return 'Círculo';
			}
			// if the bottom neighbor pixel exists and its color is solid black it is an square
			if (jb < data.length && isPixelColorSolidBlack(jb)) {
				return 'Quadrado';
			}

			break;
		}
	}

	return 'Nenhum';
};

export const test2019A1Qt1 = (imageData: ImageData, columnColor: RGBAColor, columnGutter: number) => {
	const newImageData = cloneImageData(imageData);

	const { data, width, height } = newImageData;

	const { r, g, b, a = 255 } = columnColor;

	// compute each grid (columnWidth + gutter) width
	const gridWidth = 3 + columnGutter;

	// iterate through the grids
	for (let n = 1; n <= Math.floor(width / gridWidth); n += 1) {
		// iterate through the 3 column pixels
		for (let j = 3; j > 0; j -= 1) {
			// iterate through the y-coordinates of the image
			for (let y = 0; y < height; y += 1) {
				const i = indexOfPixel(gridWidth * n - j, y, width);

				// set the column pixel color value to the choosen color value
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = a;
			}
		}
	}

	return newImageData;
};

export const test2019A1Qt2 = (imageData: ImageData) => {
	const newImageData = cloneImageData(imageData);

	const { data, width } = newImageData;
	let n = 0;

	const isPixelColorSolidBlack = (i: number) =>
		data[i + 3] === 255 && data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0;

	const transparentFloodFill = (i: number) => {
		// set the pixel color to transparent
		data[i + 3] = 0;

		// explore all pixels connected to the given pixel `i`
		const deque = [i];
		while (deque.length > 0) {
			const j = deque.pop()!;

			// iterate through the top, left, bottom and right pixel neighbors
			[j - width * 4, j - 4, j + width * 4, j + 4].forEach((k) => {
				// if the neighbor exists and is solid black (not transparent)
				// make it transparent and add it to the deque
				if (k >= 0 && k < data.length && isPixelColorSolidBlack(k)) {
					data[k + 3] = 0;
					deque.push(k);
				}
			});
		}
	};

	// iterate through the image pixels
	for (let i = 0; i < data.length; i += 4) {
		// if a solid black pixel is found set all connected pixels (including this one) to transparent
		// and count it as +1 solid black object on the image
		if (isPixelColorSolidBlack(i)) {
			n += 1;
			// use the flood fill algorithm to set all pixels connected to this one to transparent
			transparentFloodFill(i);
		}
	}

	return n;
};

export const test2019A1Qt3 = (imageData: ImageData, startX: number, startY: number, endX: number, endY: number) => {
	const { data, width } = imageData;

	const pureColors = { r: false, g: false, b: false };

	const minX = Math.min(startX, endX);
	const minY = Math.min(startY, endY);
	const maxX = Math.max(startX, endX);
	const maxY = Math.max(startY, endY);

	// iterate through the x-coordinates and y-coordinates of the image
	for (let x = minX; x <= maxX; x += 1) {
		for (let y = minY; y <= maxY; y += 1) {
			const i = indexOfPixel(x, y, width);

			// if the pixel color value has full opacity then check if its color value is a pure color
			if (data[i + 3] === 255) {
				const r = data[i];
				const g = data[i + 1];
				const b = data[i + 2];

				if (r === 255 && g === 0 && b === 0) {
					pureColors.r = true;
				} else if (r === 0 && g === 255 && b === 0) {
					pureColors.g = true;
				} else if (r === 0 && g === 0 && b === 255) {
					pureColors.b = true;
				}
			}
		}
	}

	return pureColors;
};
