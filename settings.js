const fs = require('fs')
const os = require('os')
const path = require('path')

/**
 * This objects contains server-wide settings
 * and will be exported from this module
 */
const SETTINGS = {
	/**
	 * Server will be started on that port
	 */
	PORT: 1234,
	/**
	 * Directory to be used as cwd
	 * for the [Run] command
	 */
	RUNTIME: '/runtime',
	/**
	 * Default starting language identifier
	 */
	LANGUAGE: 'plain text',
	/**
	 * Default starting [Run] command
	 */
	COMMAND: 'echo Hello!',
	/**
	 * Default text
	 */
	CODE: 'Type here...'
}

/**
 * Will be printed when help is requested
 */
const USAGE = 'Usage > [-hpcl] [--help | -h] [--port PORT | -p PORT] [--command COMMAND | -c COMMAND] [--language LANGUAGE | -l LANGUAGE] [--file FILE | -f FILE]'

/**
 * Returns an item from a certain list
 * one by one
 */
class Iterator {
	constructor(sequence, index) {
		this.sequence = sequence
		this.index = index
	}

	/**
	 * Returns the next item from the list
	 * each time is called. If there is no item
	 * left it'll return ''
	 */
	next() {
		return this.sequence[this.index++] || ''
	}

	/**
	 * Returns true if next() is able
	 * to return at least one more actual item
	 */
	hasNext() {
		return this.index < this.sequence.length
	}
}

/**
 * Action to be done when help is requested
 */
function getHelp(args) {
	throw new Error(USAGE)
}

/**
 * Sets the server port to the specified value
 */
function setPort(args) {
	SETTINGS.PORT = parseInt(args.next()) || SETTINGS.PORT
}

/**
 * Sets a certain starting command
 */
function setCommand(args) {
	SETTINGS.COMMAND = args.next() || SETTINGS.COMMAND
}

/**
 * Sets a certain starting language
 */
function setLanguage(args) {
	SETTINGS.LANGUAGE = args.next() || SETTINGS.LANGUAGE
}

/**
 * Sets a certain starting text
 * via reading it from a file
 */
function setCode(args) {
	SETTINGS.CODE = fs.readFileSync(args.next(), 'utf-8').replace(/\r+/g, '')
}

/**
 * Maps CLI options to their actions
 */
const OPTIONS = {
	'--help': getHelp,
	'--port': setPort,
	'--command': setCommand,
	'--language': setLanguage,
	'--file': setCode
}

/**
 * Maps CLI aliases to their actions
 */
const ALIASES = {
	'h': OPTIONS['--help'],
	'p': OPTIONS['--port'],
	'c': OPTIONS['--command'],
	'l': OPTIONS['--language'],
	'f': OPTIONS['--file']
}

/**
 * Reads file at a path passed as defaults
 * and applies it's values
 */
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
	// check if there're some values to
	// be used instead of hard-coded defaults
	const home = os.homedir()
	const defaults = path.join(home, '.insight/defaults.json')

	if (fs.existsSync(defaults)) {
		if (!fs.lstatSync(defaults).isFile()) {
			throw new Error(`Error > '${defaults}' must be a JSON file`)
		}

		applyDefaults(defaults)
	}

	// process to parse CLI options and apply
	// their values
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