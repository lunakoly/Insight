import * as relations from '../relations.js'


const singleQuoteScope = new relations.Scope('quoted', {
	'\'': {
		'pop': true
	},

	'\\\\.': {
		'styleClass': 'keyword'
	}
})

const doubleQuoteScope = new relations.Scope('quoted', {
	'\"': {
		'pop': true
	},

	'\\\\.': {
		'styleClass': 'keyword'
	}
})

export const Cpp = new relations.Scope('', {
	'\'': {
		'styleClass': 'quoted',
		'push': singleQuoteScope
	},

	'\"': {
		'styleClass': 'quoted',
		'push': doubleQuoteScope
	},

	'\\b(const|if|else|while|do|for|switch|case|break|continue|return|operator)\\b': {
		'styleClass': 'keyword'
	},

	'[-+]?[0-9]*\\.?[0-9]+(?:(?:e|E)[-+]?[0-9]+)?': {
		'styleClass': 'number'
	},

	'\\b(true|false)\\b': {
		'styleClass': 'boolean-value'
	},

	'\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\()': {
		'styleClass': 'function-call'
	},

	'\\b(double|float|long|int|short|byte|bool|char|size_t|ptrdiff_t)\\b': {
		'styleClass': 'primitive'
	},

	'^#[a-zA-Z][a-zA-Z0-9_]*': {
		'styleClass': 'preprocessor-directive'
	}
})