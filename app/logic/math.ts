/**
 * Returns the arithmetic mean of a list of values.
 * The values are summed and then divided by the number of values.
 *
 * @param values The values.
 */
// Disabled because it's only summing up numbers
// eslint-disable-next-line unicorn/no-reduce
export const mean = (...values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Returns the weighted arithmetic mean of a list of values.
 * The weight is considered to range from 0 to 100.
 *
 * @param values The weighted values.
 */
// Disabled because it's only summing up numbers
// eslint-disable-next-line unicorn/no-reduce
export const weightedMean = (...values: number[]) => values.reduce((a, b) => a + b, 0) / (values.length * 100);

/**
 * Returns the median of a list of values. The values are sorted and the middle value is returned.
 * In case of an even number of values, the mean of the two middle values is returned.
 *
 * @param values The values.
 */
export const median = (...values: number[]) => {
	const numberOfValues = values.length;
	const sortedValues = values.sort((a, b) => a - b);

	return numberOfValues % 2 === 0
		? (sortedValues[numberOfValues / 2 - 1] + sortedValues[numberOfValues / 2]) / 2
		: sortedValues[Math.floor(numberOfValues / 2)];
};
