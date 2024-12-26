module.exports = {
	languageOptions: {
		ecmaVersion: 'latest',
		globals: {
			// Equivalent to env.es6
			Promise: 'readonly',
			Map: 'readonly',
			Set: 'readonly',
			// Equivalent to env.node
			process: 'readonly',
			__dirname: 'readonly',
			__filename: 'readonly',
			// Equivalent to env.mocha
			describe: 'readonly',
			it: 'readonly',
			before: 'readonly',
			after: 'readonly',
			beforeEach: 'readonly',
			afterEach: 'readonly',
		},
	},
	extends: ['eslint:recommended'],
	rules: {
		indent: [
			'error',
			'tab',
			{
				SwitchCase: 1,
			},
		],
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
	},
	ignores: ['.prettierrc.js', '**/eslintrc.js', 'admin/words.js'],
};
