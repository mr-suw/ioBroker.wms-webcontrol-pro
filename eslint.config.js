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
	},
	rules: {
		indent: ['error', 'tab', { SwitchCase: 1 }],
		'no-console': 'off',
		'no-unused-vars': [
			'error',
			{
				ignoreRestSiblings: true,
				argsIgnorePattern: '^_',
			},
		],
		'no-var': 'error',
		'no-trailing-spaces': 'error',
		'prefer-const': 'error',
		quotes: [
			'error',
			'single',
			{
				avoidEscape: true,
				allowTemplateLiterals: true,
			},
		],
		semi: ['error', 'always'],
		'no-undef': 'error',
		'no-unused-expressions': [
			'error',
			{
				allowShortCircuit: true,
				allowTernary: true,
				allowTaggedTemplates: true,
			},
		],
		'no-irregular-whitespace': 'error',
	},
	ignores: ['.prettierrc.js', '**/eslintrc.js', 'admin/words.js'],
};
