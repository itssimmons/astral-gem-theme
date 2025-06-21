const Keys = {
	ArrowDown: Buffer.from([0x1b, 0x5b, 0x42]),
	ArrowUp: Buffer.from([0x1b, 0x5b, 0x41]),
	Enter: Buffer.from([0x0d])
} as const;

export default Keys;
