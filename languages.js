const SETTINGS = require('./settings.js')

const fs = require('fs')
const os = require('os')
const path = require('path')

/**
 * This objects contains server-wide settings
 * and will be exported from this module
 */
const LANGUAGES = {
	/**
	 * A list of all possible valid
	 * language identifiers
	 */
	LIST: ['plain text'],

	/**
	 * Maps a language identifier to it's
	 * language declaration
	 */
	BANK: {
		'plain text': {
			/**
		     * Name is required and will be displayed
		     * in the select control on the client side
			 */
			'name': 'Plain Text',
			/**
		     * Scopes are requred and represent actual syntax
		     * highlighting rules to be applied
			 */
			'scopes': {
				/**
				 * Global scope is required since it's
				 * a starting point of the highlight
				 */
				'global': {
					/**
					 * Patterns are required and define
					 * regex string representations as keys
					 * and actions to be done as their mapped
					 * values
					 */
					'patterns': {}
				}
			}
		}
	}
}

/**
 * Returns the name of the file without
 * it's extension
 */
function getFileNameWithoutExtension(file) {
	return file.split('.').slice(0, -1).join('.')
}

/**
 * Loads languages from the directory
 * specified via languages
 */
function parseLanguages(languages) {
	const files = fs.readdirSync(languages)

	for (let each of files) {
		if (path.extname(each) == '.json') {
			const fullPath = path.join(languages, each)
			const contents = fs.readFileSync(fullPath, 'utf-8')

			const info = JSON.parse(contents)
			const identifier = getFileNameWithoutExtension(each)

			if (LANGUAGES.BANK[identifier]) {
				throw new Error(`Error > Language identifier '${identifier}' is already in use`)
			}

			LANGUAGES.LIST.push(identifier)
			LANGUAGES.BANK[identifier] = info
		}
	}
}

try {
	// check if there're some user-defined languages
	const home = os.homedir()
	const languages = path.join(home, '.insight/languages')

	if (fs.existsSync(languages)) {
		if (!fs.lstatSync(languages).isDirectory()) {
			throw new Error(`Error > '${languages}' must be a directory containing syntax rules`)
		}

		parseLanguages(languages)
	}

	// if the requested language is invalid
	if (!LANGUAGES.BANK[SETTINGS.LANGUAGE]) {
		throw new Error('Error > No such language > ' + SETTINGS.LANGUAGE)
	}
} catch (e) {
	console.log(e.message)
	process.exit(0)
}

module.exports = LANGUAGES