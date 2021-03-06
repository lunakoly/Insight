import * as relations from './relations.js'


const socket = io()

/**
 * Clear rubbish when server restarts but
 * page is not reloaded and tries to
 * reconnect
 */
socket.on('reconnect', () => {
	input.value = ''

	for (let it = language.children.length - 1; it > 0; it--) {
		language.removeChild(language.lastChild)
	}

	positionToId = []
	idToPosition = {}
})


/**
 * @CONST
 * The user id provided by the server.
 * Acts as a namespace for ids of characters
 * this user types (this is needed to prevent
 * character id collisions)
 */
let USER_ID = -1

socket.on('get id', ID => {
	USER_ID = ID
})


// manage [Run] functionality
socket.on('disable running', data => {
	run.disabled = true
})

socket.on('enable running', data => {
	run.disabled = false
})

run.addEventListener('click', e => {
	socket.emit('run')
})


// manage [Run] command functionality
socket.on('accept admin', data => {
	command.disabled = false
})

socket.on('get command', theCommand => {
	command.value = theCommand
})

command.addEventListener('input', e => {
	socket.emit('set command', command.value)
})


// display the output and
// scroll to bottom
socket.on('output', data => {
	const doScroll = output.scrollTop + output.clientHeight == output.scrollHeight
	output.innerHTML += data

	if (doScroll) {
		output.scrollTop = output.scrollHeight
	}
})


/**
 * Same as server-side LANGUAGES
 */
let LANGUAGES = {}

/**
 * Applies a certain language based
 * on the value of the select control
 */
function swapLanguage() {
	const syntax = language.value || 'plain text'
	decoration.highlighter.setSyntax(LANGUAGES.BANK[syntax].scopes)
	decoration.innerHTML = relations.analyze(input, decoration)
}

/**
 * Fill LANGUAGES
 */
socket.on('get languages', THE_LANGUAGES => {
	LANGUAGES = THE_LANGUAGES

	for (let each of LANGUAGES.LIST) {
		// it's already hard-coded in .html
		if (each == 'plain text')
			continue

		const option = document.createElement('option')
		option.innerHTML = LANGUAGES.BANK[each].name
		option.value = each

		language.appendChild(option)
	}
})

// manage language functionality
socket.on('get language', theLanguage => {
	language.value = theLanguage
	swapLanguage()
})

language.addEventListener('change', e => {
	socket.emit('set language', language.value)
	swapLanguage()
})


/**
 * Helps getIdByPosition()
 */
let positionToId = []

/**
 * Translates an absolute index position
 * of the caret in the code to it's relative position
 * determined by an id of a character
 */
function getIdByPosition(position) {
	if (position == positionToId.length)
		return 'end'
	return positionToId[position]
}

/**
 * Helps getPositionById()
 */
let idToPosition = {}

/**
 * Translates a relative position
 * of the caret in the code to it's absolute position
 * via character id
 */
function getPositionById(id) {
	if (id == 'end')
		return positionToId.length
	return idToPosition[id]
}


/**
 * Applies changes to the local version of the text
 */
socket.on('get code', changes => {
	const start = getPositionById(changes.selectionStart)
	const end   = getPositionById(changes.selectionEnd)

	relations.insert(input, decoration, {
		selectionStart: start,
		selectionEnd: end,
		sequence: changes.sequence
	})

	positionToId.splice(start, end - start, ...changes.sequencePositionToId)

	for (let it = start; it < input.value.length; it++) {
		idToPosition[positionToId[it]] = it
	}
})


/**
 * A template for changes submitted to the server
 * whenever the text changes
 */
const CHANGES = {
	selectionStart: 'end',
	selectionEnd: 'end',
	sequence: '',
	sequencePositionToId: []
}

/**
 * Identifier of the next character the user
 * will insert
 */
let nextCharacterID = 0
// a helper for CHANGES
let selectionStart = 0
// a helper for CHANGES
let selectionEnd = 0

// clear the default input value
input.value = ''

// text got changed
input.addEventListener('input', e => {
	if (input.selectionStart < selectionStart)
		selectionStart = input.selectionStart

	CHANGES.selectionStart = getIdByPosition(selectionStart)
	CHANGES.selectionEnd   = getIdByPosition(selectionEnd)

	CHANGES.sequence = input.value.substring(selectionStart, input.selectionStart)
	CHANGES.sequencePositionToId = []

	// fill sequencePositionToId and apply changes
	// to local positionToId and idToPosition

	for (let it = 0; it < CHANGES.sequence.length; it++) {
		CHANGES.sequencePositionToId.push(USER_ID + ':' + nextCharacterID)
		nextCharacterID++
	}

	positionToId.splice(selectionStart, selectionEnd - selectionStart, ...CHANGES.sequencePositionToId)

	for (let it = selectionStart; it < input.value.length; it++) {
		idToPosition[positionToId[it]] = it
	}

	socket.emit('set code', CHANGES)
})

// user pressed a button
input.addEventListener('keydown', e => {
	selectionStart = input.selectionStart
	selectionEnd   = input.selectionEnd

	if (
		(e.ctrlKey || e.metaKey) &&
		(e.key == 'Z' || e.key == 'z')
	) {
		e.preventDefault()
		return
	}

	if (e.key == 'Tab') {
		e.preventDefault()
		relations.inject(input, decoration, '\t')

		// initiate 'input' event
		const event = new Event('input', {
			'bubbles': true,
			'cancelable': false
		})
		input.dispatchEvent(event)

		return
	}
})