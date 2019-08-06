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

socket.on('get command', theCommand => {
	command.value = theCommand
})

socket.on('get language', theLanguage => {
	language.value = theLanguage
	swapLanguage()
})

socket.on('get code', theCode => {
	relations.assign(input, decoration, theCode)
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

input.addEventListener('input', e => {
	socket.emit('set code', input.value)
})


input.addEventListener('keydown', e => {
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
