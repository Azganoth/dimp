export type PixelShowcase = {
	r: number | 'R';
	g: number | 'G';
	b: number | 'B';
	a: number | 'A';
};

export type RGBAColor = {
	r: number;
	g: number;
	b: number;
	a?: number;
};

export type ChallengesOptions = {
	borderMarking: {
		active: boolean;
		color: RGBAColor;
	};
};
