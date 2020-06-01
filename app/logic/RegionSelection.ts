/**
 * The info about an ongoing region selection.
 */
export default class RegionSelection {
	/**
	 * The original image data.
	 */
	readonly imageData: ImageData;

	/**
	 * The starting point x-coordinate.
	 */
	readonly startX: number;

	/**
	 * The starting point y-coordinate.
	 */
	readonly startY: number;

	/**
	 * The ending point x-coordinate.
	 */
	endX: number;

	/**
	 * The ending point y-coordinate.
	 */
	endY: number;

	constructor(imageData: ImageData, startX: number, startY: number) {
		this.imageData = imageData;
		this.startX = startX;
		this.startY = startY;
		this.endX = startX;
		this.endY = startY;
	}

	/**
	 * Updates the ending point x-coordinate and y-coordinate.
	 *
	 * @param endX The ending point x-coordinate.
	 * @param endY The ending point y-coordinate.
	 */
	updateEndPoint(endX: number, endY: number): void {
		this.endX = endX;
		this.endY = endY;
	}
}
