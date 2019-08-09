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

export const Kotlin = new relations.Scope('', {
	'\'': {
		'styleClass': 'quoted',
		'push': singleQuoteScope
	},

	'\"': {
		'styleClass': 'quoted',
		'push': doubleQuoteScope
	},

	'\\b(var|val|const|if|else|while|for|when|break|continue|fun|return|operator)\\b': {
		'styleClass': 'keyword'
	},

	'[-+]?[0-9]*\\.?[0-9]+(?:(?:e|E)[-+]?[0-9]+)?': {
		'styleClass': 'number'
	},

	'\\b[a-zA-Z_][a-zA-Z0-9_]*(?=\\()': {
		'styleClass': 'function-call'
	},

	'\\b(Double|Float|Long|Int|Short|Byte|Boolean|Char|String)\\b': {
		'styleClass': 'primitive'
	}
})