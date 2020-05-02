/**
 * Returns the image data of a canvas.
 *
 * @param canvas The canvas.
 */
export const getCanvasImage = (canvas: HTMLCanvasElement) => {
	return canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Sets the image data of a canvas.
 *
 * @param imageData The image data.
 * @param canvas The canvas.
 */
export const setCanvasImage = (imageData: ImageData, canvas: HTMLCanvasElement) => {
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	canvas.getContext('2d')!.putImageData(imageData, 0, 0);
};

/**
 * Returns a copy of an image data.
 *
 * @param imageData The image data.
 */
export const cloneImageData = (imageData: ImageData) =>
	new ImageData(new Uint8ClampedArray(imageData.data), imageData.width, imageData.height);

/**
 * Returns the pixel ([r,g,b,a]) starting index in an image data array.
 *
 * @param x The point x-coordinate.
 * @param y The point y-coordinate.
 * @param width The image width.
 */
export const indexOfPixel = (x: number, y: number, width: number) => x * 4 + y * width * 4;
