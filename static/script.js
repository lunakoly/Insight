import * as relations from './relations.js'

import { Kotlin } from './lang/kotlin.js'
import { Cpp } from './lang/cpp.js'
import { Python } from './lang/python.js'


const scopes = {
	'kotlin': Kotlin,
	'cpp': Cpp,
	'python': Python
}

function swapLanguage() {
	const syntax = language.value || 'kotlin'
	decoration.highlighter.clearScopes()
	decoration.highlighter.pushScope(scopes[syntax])
	decoration.innerHTML = relations.analyze(input, decoration)
}


const socket = io()

let userID = -1

socket.on('get id', ID => {
	userID = ID
})

socket.on('get command', theCommand => {
	command.value = theCommand
})

socket.on('get language', theLanguage => {
	language.value = theLanguage
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

socket.on('accept admin', data => {
	command.disabled = false
})

socket.on('output', data => {
	const doScroll = output.scrollTop + output.clientHeight == output.scrollHeight
	output.innerHTML += data

	if (doScroll) {
		output.scrollTop = output.scrollHeight
	}
})

socket.on('disable running', data => {
	run.disabled = true
})

socket.on('enable running', data => {
	run.disabled = false
})


command.addEventListener('input', e => {
	socket.emit('set command', command.value)
})

language.addEventListener('change', e => {
	socket.emit('set language', language.value)
	swapLanguage()
})

run.addEventListener('click', e => {
	socket.emit('run')
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
	CHANGES.selectionStart = getIdByPosition(selectionStart)
	CHANGES.selectionEnd   = getIdByPosition(selectionEnd)

	CHANGES.sequence = input.value.substring(selectionStart, input.selectionStart)
	CHANGES.sequencePositionToId = []

	for (let it = 0; it < CHANGES.sequence.length; it++) {
		CHANGES.sequencePositionToId.push(userID + ':' + nextCharacterID)
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

	if (
		e.key == 'Backspace' &&
		selectionStart == selectionEnd
	) {
		selectionStart--
	}

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