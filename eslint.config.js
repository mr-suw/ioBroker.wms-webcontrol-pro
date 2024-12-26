module.exports = {
	languageOptions: {
		ecmaVersion: 'latest',
		sourceType: 'commonjs',
		globals: {
			// Node.js globals
			module: 'writable',
			require: 'writable',
			process: 'readonly',
			__dirname: 'readonly',
			__filename: 'readonly',
			Buffer: 'readonly',
			console: 'readonly',
			// Mocha globals
			describe: 'readonly',
			it: 'readonly',
			before: 'readonly',
			after: 'readonly',
			beforeEach: 'readonly',
			afterEach: 'readonly',
			// ES6 globals
			Promise: 'readonly',
			Map: 'readonly',
			Set: 'readonly',
		},
		parserOptions: {
			sourceType: 'commonjs',
		},
	},
	plugins: [],
	rules: {
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'no-console': 'off',
		'no-unused-vars': [
			'error',
			{
				ignoreRestSiblings: true,
				argsIgnorePattern: '^_',
				varsIgnorePattern: '^_',
				caughtErrorsIgnorePattern: '^_',
			},
		],
		'no-var': 'error',
		'no-trailing-spaces': 'error',
		'prefer-const': 'error',
		'no-undef': 'error',
		'no-unused-expressions': 'off',
		'@typescript-eslint/no-unused-expressions': 'off',
	},
	ignores: ['.prettierrc.js', '**/eslintrc.js', 'admin/words.js'],
};
