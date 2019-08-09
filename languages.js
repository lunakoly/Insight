const SETTINGS = require('./settings.js')

const fs = require('fs')
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

function loadLanguageFileContents(error, contents, file) {
	if (error) {
		throw error
	}

	const info = JSON.parse(contents)
	const identifier = getFileNameWithoutExtension(file)

	if (LANGUAGES.BANK[identifier]) {
		throw new Error(`Error > Language identifier '${identifier}' is already in use`)
	}

	LANGUAGES.LIST.push(identifier)
	LANGUAGES.BANK[identifier] = info
}

function loadLanguageFile(file) {
	const fullPath = path.join(__dirname, SETTINGS.LANGUAGES, file)
	fs.readFile(fullPath, (error, contents) => loadLanguageFileContents(error, contents, file))
}

function selectFiles(error, files) {
	if (error)
		throw error

	for (let each of files) {
		if (path.extname(each) == '.json') {
			loadLanguageFile(each)
		}
	}
}

try {
	fs.readdir(__dirname + SETTINGS.LANGUAGES, selectFiles)

	if (!LANGUAGES.BANK[SETTINGS.LANGUAGE]) {
		throw new Error('Error > No such language > ' + SETTINGS.LANGUAGE)
	}
} catch (e) {
	console.log(e.message)
	process.exit(0)
}

module.exports = LANGUAGES