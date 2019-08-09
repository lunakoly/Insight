const fs = require('fs')
const os = require('os')
const path = require('path')

const SETTINGS = {
	PORT: 1234,
	RUNTIME: '/runtime',

	LANGUAGE: 'plain text',
	COMMAND: 'echo Hello!',
	CODE: 'Type here...'
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

function applyDefaults(defaults) {
	const contents = fs.readFileSync(defaults, 'utf-8')
	const settings = JSON.parse(contents)

	for (let key in settings) {
		const option = '--' + key

		if (OPTIONS[option]) {
			let values = settings[key]

			if (!Array.isArray(settings[key]))
				values = [settings[key]]

			const iterator = new Iterator(values, 0)
			OPTIONS[option](iterator)
		} else {
			throw new Error('Error > No such option > ' + key)
		}
	}
}

try {
	const home = os.homedir()
	const defaults = path.join(home, '.insight/defaults.json')

	if (fs.existsSync(defaults)) {
		if (!fs.lstatSync(defaults).isFile()) {
			throw new Error(`Error > '${defaults}' must be a JSON file`)
		}

		applyDefaults(defaults)
	}

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