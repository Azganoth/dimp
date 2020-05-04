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

export type TestsOptions = {
	test2016A1Qt2Active: boolean;
	test2019A1Qt3Active: boolean;
	test2019A1Qt3Colors: { r: boolean; g: boolean; b: boolean };
};
