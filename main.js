const SETTINGS = require('./settings.js')

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')
const cp = require('child_process')


app.use('/static', express.static(__dirname + '/static'))

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/static/index.html')
})


let code     = SETTINGS.CODE
let command  = SETTINGS.COMMAND
let language = SETTINGS.LANGUAGE


let positionToId = []

function getIdByPosition(position) {
	if (position == code.length)
		return 'end'
	return positionToId[position]
}

let idToPosition = {}

function getPositionById(id) {
	if (id == 'end')
		return code.length
	return idToPosition[id]
}


let nextCharacterID = 0

while (nextCharacterID < code.length) {
	const id =  'server:' + nextCharacterID
	positionToId.push(id)
	idToPosition[id] = nextCharacterID
	nextCharacterID++
}


function isAdmin(address) {
	return address == '::1' ||
		   address == '127.0.0.1' ||
		   address == '::ffff:127.0.0.1'
}

function setCode(socket, changes) {
	const start = getPositionById(changes.selectionStart)
	const end   = getPositionById(changes.selectionEnd)

	code = code.substring(0, start) +
		   changes.sequence +
		   code.substring(end)

	positionToId.splice(start, end - start, ...changes.sequencePositionToId)

	for (let it = start; it < code.length; it++) {
		idToPosition[positionToId[it]] = it
	}

	socket.broadcast.emit('get code', changes)
}

function setCommand(socket, theCommand) {
	if (isAdmin(socket.handshake.address)) {
		command = theCommand
		socket.broadcast.emit('get command', command)
	}
}

function setLanguage(socket, theLanguage) {
	if (SETTINGS.LANGUAGES.includes(theLanguage)) {
		language = theLanguage
		socket.broadcast.emit('get language', language)
		console.log('Set > Language > ' + language)
	}
}


let isRunning = false

function spawnSubprocess(socket, error) {
	if (error) {
		isRunning = false
		return console.error(error)
	}

	const child = cp.spawn(command, {
		shell: true,
		cwd: __dirname + SETTINGS.RUNNABLES
	})

	child.stdout.on('data', function(data) {
		io.sockets.emit('output', new String(data))
	})

	child.stderr.on('data', function(data) {
		io.sockets.emit('output', `<span class="output-error">${data}</span>`)
	})

	child.on('exit', function(code, signal) {
		io.sockets.emit('output', `<span class="output-exit">Exit code: ${code}</span>\n`)
		isRunning = false
		console.log(' > Done')
		io.sockets.emit('enable running')
	})
}

function run(socket) {
	if (isRunning)
		return

	io.sockets.emit('disable running')
	process.stdout.write('Running > ' + command)
	isRunning = true

	fs.writeFile(
		__dirname + SETTINGS.RUNNABLES + '/code',
		code,
		error => spawnSubprocess(socket, error)
	)
}


let nextUserID = 0

io.on('connection', function(socket) {
	socket.emit('get id', nextUserID)
	nextUserID++

	socket.emit('get command', command)
	socket.emit('get language', language)

	socket.emit('get code', {
		selectionStart: 'end',
		selectionEnd: 'end',
		sequence: code,
		sequencePositionToId: positionToId,
	})

	if (isAdmin(socket.handshake.address)) {
		socket.emit('accept admin')
	}

	socket.on('set code', data => setCode(socket, data))
	socket.on('set command', data => setCommand(socket, data))
	socket.on('set language', data => setLanguage(socket, data))

	socket.on('run', _ => run(socket))
})


http.listen(SETTINGS.PORT, function() {
	console.log(`Started > Port = ${SETTINGS.PORT}`)
})