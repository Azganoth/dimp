module.exports = {
	env: ['node'],
	prettier: true,
	rules: {
		camelcase: 'off',
		'capitalized-comments': 'off',
		'no-console': 'warn',

		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/prefer-readonly-parameter-types': 'off',

		'import/no-extraneous-dependencies': 'off',
		'import/no-unassigned-import': 'off',

		'unicorn/filename-case': 'off',
		'unicorn/string-content': 'off',
		'unicorn/prevent-abbreviations': 'off',
	},
	overrides: [
		{
			files: 'app/**/*',
			env: ['browser'],
			extends: ['xo-react'],
		},
		{
			files: 'scripts/**/*',
			rules: {
				'no-console': 'off',

				'promise/param-names': 'off',

				'unicorn/no-process-exit': 'off',
			},
		},
	],
}
