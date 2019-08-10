const SETTINGS = require('./settings.js')
const LANGUAGES = require('./languages.js')

const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')
const cp = require('child_process')


// express.js minimum setup
app.use('/static', express.static(__dirname + '/static'))

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/static/index.html')
})


/**
 * Code is a server-side version
 * of the text that users are editing
 */
let code     = SETTINGS.CODE
/**
 * This command is run when users
 * request it's execution
 */
let command  = SETTINGS.COMMAND
/**
 * A language highlight rules that are
 * currently in use across all the clients
 */
let language = SETTINGS.LANGUAGE


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


// fill in idToPosition and positionToId
// based on the default text
let nextCharacterID = 0

while (nextCharacterID < code.length) {
	const id =  'server:' + nextCharacterID
	positionToId.push(id)
	idToPosition[id] = nextCharacterID
	nextCharacterID++
}


/**
 * Returns true if the given address
 * refers the administrator
 */
function isAdmin(address) {
	return address == '::1' ||
		   address == '127.0.0.1' ||
		   address == '::ffff:127.0.0.1'
}

/**
 * Applies changes to the server text version
 * and broadcasts the changes to everyone
 */
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

/**
 * Sets the command and broadcasts
 * it to everyone
 */
function setCommand(socket, theCommand) {
	if (isAdmin(socket.handshake.address)) {
		command = theCommand
		socket.broadcast.emit('get command', command)
	}
}

/**
 * Sets the language and broadcasts
 * it to everyone. If an invalid language
 * is received it'll be ignored
 */
function setLanguage(socket, theLanguage) {
	if (LANGUAGES.BANK[theLanguage]) {
		language = theLanguage
		socket.broadcast.emit('get language', language)
		console.log('Set > Language > ' + language)
	}
}


/**
 * Prevents multiple [Run]'s
 */
let isRunning = false

/**
 * Executes a command in the RUNTIME directory
 */
function spawnSubprocess(socket, error) {
	if (error) {
		isRunning = false
		return console.error(error)
	}

	const child = cp.spawn(command, {
		shell: true,
		cwd: __dirname + SETTINGS.RUNTIME
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

/**
 * Manages [Run] button
 */
function run(socket) {
	if (isRunning)
		return

	io.sockets.emit('disable running')
	process.stdout.write('Running > ' + command)
	isRunning = true

	fs.writeFile(
		__dirname + SETTINGS.RUNTIME + '/code',
		code,
		error => spawnSubprocess(socket, error)
	)
}


/**
 * Id to give each new user
 * when connected
 */
let nextUserID = 0

io.on('connection', function(socket) {
	socket.emit('get id', nextUserID)
	nextUserID++

	socket.emit('get command', command)
	socket.emit('get languages', LANGUAGES)
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


// start the server
http.listen(SETTINGS.PORT, function() {
	console.log(`Started > Port = ${SETTINGS.PORT}`)
})