const path = require("path")
const http = require("http")
const express = require("express")
const socketio = require("socket.io")
const Filter = require("bad-words")
const { generateMessage, generateLocationMessage } = require("./utils/messages")
const {
	addUser,
	removeUser,
	getUser,
	getUsersInRoom,
} = require("./utils/users")

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, "../public")

app.use(express.static(publicDirectoryPath))

io.on("connection", (socket) => {
	socket.on("join", (options, callback) => {
		const { err, user } = addUser({ id: socket.id, ...options })

		if (err) {
			return callback(err)
		}

		const { room, username } = user

		socket.join(room)

		socket.emit(
			"message",
			generateMessage({
				username: "admin",
				message: `Welcome ${username}`,
			})
		)
		socket.broadcast.to(room).emit(
			"message",
			generateMessage({
				username: "admin",
				message: `${username} has entered the chat`,
			})
		)

		io.to(room).emit("roomData", {
			room,
			users: getUsersInRoom(room),
		})

		callback()
	})

	socket.on("sendMessage", (message, callback) => {
		const { username, room } = getUser(socket.id)
		const filter = new Filter()

		if (filter.isProfane(message)) {
			return callback("Profanity is not allowed")
		}

		io.to(room).emit("message", generateMessage({ username, message }))
		callback()
	})

	socket.on("sendLocation", (location, callback) => {
		const { username, room } = getUser(socket.id)
		io.to(room).emit(
			"locationMessage",
			generateLocationMessage({ username, location })
		)
		callback()
	})

	socket.on("disconnect", () => {
		const user = removeUser(socket.id)

		if (user) {
			const { username, room } = user

			io.to(room).emit(
				"message",
				generateMessage({
					username: "admin",
					message: `${username} has left the chat`,
				})
			)

			io.to(room).emit("roomData", {
				room,
				users: getUsersInRoom(room),
			})
		}
	})
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => console.log("Server up"))
