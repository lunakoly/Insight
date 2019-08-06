const fs = require('fs')

const SETTINGS = {
	PORT: 1234,
	RUNNABLES: '/temp',
	COMMAND: 'python code',
	LANGUAGE: 'python',
	CODE: 'print("Hello!")',

	LANGUAGES: [
		'kotlin',
		'cpp',
		'python'
	]
}

const USAGE = 'Usage > [-hpcl] [--help | -h] [--port PORT | -p PORT] [--command COMMAND | -c COMMAND] [--language LANGUAGE | -l LANGUAGE]'

class Iterator {
	constructor(sequence, index) {
		this.sequence = sequence
		this.index = index
	}

	next() {
		return this.sequence[this.index++] || ''
	}

	hasNext() {
		return this.index < this.sequence.length
	}
}

function getHelp(args) {
	throw new Error(USAGE)
}

function setPort(args) {
	SETTINGS.PORT = parseInt(args.next()) || SETTINGS.PORT
}

function setCommand(args) {
	SETTINGS.COMMAND = args.next() || SETTINGS.COMMAND
}

function setLanguage(args) {
	SETTINGS.LANGUAGE = args.next() || SETTINGS.LANGUAGE

	if (!SETTINGS.LANGUAGES.includes(SETTINGS.LANGUAGE))
		throw new Error('Error > No such language > ' + SETTINGS.LANGUAGE)
}

function setCode(args) {
	SETTINGS.CODE = fs.readFileSync(args.next(), 'utf-8')
}

const OPTIONS = {
	'--help': getHelp,
	'--port': setPort,
	'--command': setCommand,
	'--language': setLanguage,
	'--file': setCode
}

const ALIASES = {
	'h': OPTIONS['--help'],
	'p': OPTIONS['--port'],
	'c': OPTIONS['--command'],
	'l': OPTIONS['--language'],
	'f': OPTIONS['--file']
}

try {
	const args = new Iterator(process.argv, 2)

	while (args.hasNext()) {
		const argument = args.next()

		if (OPTIONS[argument]) {
			OPTIONS[argument](args)
		}

		else if (argument.startsWith('-')) {
			for (let that = 1; that < argument.length; that++) {
				if (ALIASES[argument[that]]) {
					ALIASES[argument[that]](args)
				}

				else {
					throw new Error('Error > No such alias > ' + argument[that])
				}
			}
		}

		else {
			throw new Error('Error > Unexpected argument > ' + argument)
		}
	}
} catch (e) {
	console.log(e.message)
	process.exit(0)
}

module.exports = SETTINGS