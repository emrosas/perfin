export function formatAbbreviatedAmount(value: number): string {
	const abs = Math.abs(value);

	if (abs < 1000) return `$${Math.trunc(abs)}`;

	const units: { threshold: number; suffix: string }[] = [
		{ threshold: 1_000_000_000, suffix: 'B' },
		{ threshold: 1_000_000, suffix: 'M' },
		{ threshold: 1_000, suffix: 'K' }
	];

	for (const { threshold, suffix } of units) {
		if (abs >= threshold) {
			const scaled = abs / threshold;
			// Truncate to 1 decimal place
			const truncated = Math.trunc(scaled * 10) / 10;
			const display = Number.isInteger(truncated) ? `${truncated}` : `${truncated.toFixed(1)}`;
			return `$${display}${suffix}`;
		}
	}

	return `$${Math.trunc(abs)}`;
}
