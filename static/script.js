import * as relations from './relations.js'


const socket = io()

socket.on('reconnect', () => {
	input.value = ''

	for (let it = language.children.length - 1; it > 0; it--) {
		language.removeChild(language.lastChild)
	}
})


let USER_ID = -1

socket.on('get id', ID => {
	USER_ID = ID
})


socket.on('disable running', data => {
	run.disabled = true
})

socket.on('enable running', data => {
	run.disabled = false
})

run.addEventListener('click', e => {
	socket.emit('run')
})


socket.on('accept admin', data => {
	command.disabled = false
})

socket.on('get command', theCommand => {
	command.value = theCommand
})

command.addEventListener('input', e => {
	socket.emit('set command', command.value)
})


socket.on('output', data => {
	const doScroll = output.scrollTop + output.clientHeight == output.scrollHeight
	output.innerHTML += data

	if (doScroll) {
		output.scrollTop = output.scrollHeight
	}
})


let LANGUAGES = {}

function swapLanguage() {
	const syntax = language.value || 'plain text'
	decoration.highlighter.setSyntax(LANGUAGES.BANK[syntax].scopes)
	decoration.innerHTML = relations.analyze(input, decoration)
}

socket.on('get languages', THE_LANGUAGES => {
	LANGUAGES = THE_LANGUAGES

	for (let each of LANGUAGES.LIST) {
		if (each == 'plain text')
			continue

		const option = document.createElement('option')
		option.innerHTML = LANGUAGES.BANK[each].name
		option.value = each

		language.appendChild(option)
	}
})

socket.on('get language', theLanguage => {
	language.value = theLanguage
	swapLanguage()
})

language.addEventListener('change', e => {
	socket.emit('set language', language.value)
	swapLanguage()
})


let positionToId = []

function getIdByPosition(position) {
	if (position == positionToId.length)
		return 'end'
	return positionToId[position]
}

let idToPosition = {}

function getPositionById(id) {
	if (id == 'end')
		return positionToId.length
	return idToPosition[id]
}


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


const CHANGES = {
	selectionStart: 'end',
	selectionEnd: 'end',
	sequence: '',
	sequencePositionToId: []
}

let nextCharacterID = 0
let selectionStart = 0
let selectionEnd = 0

input.value = ''

input.addEventListener('input', e => {
	if (input.selectionStart < selectionStart)
		selectionStart = input.selectionStart

	CHANGES.selectionStart = getIdByPosition(selectionStart)
	CHANGES.selectionEnd   = getIdByPosition(selectionEnd)

	CHANGES.sequence = input.value.substring(selectionStart, input.selectionStart)
	CHANGES.sequencePositionToId = []

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

input.addEventListener('keydown', e => {
	selectionStart = input.selectionStart
	selectionEnd   = input.selectionEnd

	if (e.key == 'Tab') {
		e.preventDefault()
		relations.inject(input, decoration, '\t')

		const event = new Event('input', {
			'bubbles': true,
			'cancelable': false
		})
		input.dispatchEvent(event)

		return
	}
})