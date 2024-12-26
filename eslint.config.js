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
	// Remove extends and include rules directly
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
		// Add recommended rules manually
		'no-undef': 'error',
		'no-unused-expressions': 'error',
		'no-irregular-whitespace': 'error',
	},
	ignores: ['.prettierrc.js', '**/eslintrc.js', 'admin/words.js'],
};
