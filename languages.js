const SETTINGS = require('./settings.js')

const fs = require('fs')
const os = require('os')
const path = require('path')

const LANGUAGES = {
	LIST: ['plain text'],

	BANK: {
		'plain text': {
			'name': 'Plain Text',
			'scopes': {
				'global': {
					'patterns': {}
				}
			}
		}
	}
}

function getFileNameWithoutExtension(file) {
	return file.split('.').slice(0, -1).join('.')
}

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
	const home = os.homedir()
	const languages = path.join(home, '.insight/languages')

	if (fs.existsSync(languages)) {
		if (!fs.lstatSync(languages).isDirectory()) {
			throw new Error(`Error > '${languages}' must be a directory containing syntax rules`)
		}

		parseLanguages(languages)
	}

	if (!LANGUAGES.BANK[SETTINGS.LANGUAGE]) {
		throw new Error('Error > No such language > ' + SETTINGS.LANGUAGE)
	}
} catch (e) {
	console.log(e.message)
	process.exit(0)
}

module.exports = LANGUAGES