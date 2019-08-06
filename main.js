const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)
const fs = require('fs')
const cp = require('child_process')


const PORT = 1234
const RUNNABLES = '/temp'

const LANGUAGES = [
	'kotlin',
	'cpp',
	'python'
]


let command = 'python code'
let language = 'python'
let code = 'print("Hello!")'

let isRunning = false


app.use('/static', express.static(__dirname + '/static'))

app.get('/', function(request, response) {
	response.sendFile(__dirname + '/static/index.html')
})

function isAdmin(address) {
	return address == '::1' ||
		   address == '127.0.0.1' ||
		   address == '::ffff:127.0.0.1'
}

io.on('connection', function(socket) {
	const address = socket.handshake.address

	socket.emit('get command', command)
	socket.emit('get language', language)
	socket.emit('get code', code)

	if (isAdmin(address)) {
		socket.emit('accept admin')
	}

	socket.on('set command', function(theCommand) {
		if (isAdmin(address)) {
			command = theCommand
			socket.broadcast.emit('get command', command)
		}
	})

	socket.on('set language', function(theLanguage) {
		if (LANGUAGES.includes(theLanguage)) {
			language = theLanguage
			socket.broadcast.emit('get language', language)
			console.log('Set > Language > ' + language)
		}
	})

	socket.on('set code', function(theCode) {
		code = theCode
		socket.broadcast.emit('get code', code)
	})

	socket.on('run', function() {
		if (isRunning)
			return

		io.sockets.emit('disable running')
		process.stdout.write('Running > ' + command)
		isRunning = true

		fs.writeFile(__dirname + RUNNABLES + '/code', code, function(error) {
			if (error) {
				isRunning = false
				return console.error(error)
			}

			const child = cp.spawn(command, {
				shell: true,
				cwd: __dirname + RUNNABLES
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
		})
	})
})

http.listen(PORT, function() {
	console.log(`Started > Port = ${PORT}`)
})