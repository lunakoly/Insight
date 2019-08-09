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

export const Python = new relations.Scope('', {
	'\'': {
		'styleClass': 'quoted',
		'push': singleQuoteScope
	},

	'\"': {
		'styleClass': 'quoted',
		'push': doubleQuoteScope
	},

	'\\b(if|elif|else|while|do|for|def|return|yield|in|import)\\b': {
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

	'\\b(self)\\b': {
		'styleClass': 'primitive'
	}
})