export const normalizeIntegerInput = (
	value: string | number | undefined,
	min = -Infinity,
	max = Infinity,
	radix = 10
) => {
	const n = Number.parseInt(value, radix)
	return Number.isNaN(n) ? 0 : n < min ? min : n > max ? max : n
}
