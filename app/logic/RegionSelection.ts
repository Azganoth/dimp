/**
 * The info about an ongoing region selection.
 */
export default class RegionSelection {
	/**
	 * The original image data.
	 */
	readonly imageData: ImageData;

	/**
	 * The starting x point.
	 */
	readonly startX: number;

	/**
	 * The starting y point.
	 */
	readonly startY: number;

	/**
	 * The ending x point.
	 */
	endX: number;

	/**
	 * The ending y point.
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
	 * Updates the ending x and y points.
	 *
	 * @param endX The ending x point
	 * @param endY The ending y point
	 */
	updateEndPoint(endX: number, endY: number) {
		this.endX = endX;
		this.endY = endY;
	}
}
