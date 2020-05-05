const socket = io()

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $sendLocationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages")
const $sidebar = document.querySelector("#sidebar")

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationTemplate = document.querySelector("#location-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
	ignoreQueryPrefix: true,
})

const autoscroll = () => {
	// New message element
	const $newMessage = $messages.lastElementChild

	// Height of the new message
	const newMessageStyles = getComputedStyle($newMessage)
	const newMessageMargin = parseInt(newMessageStyles.marginBottom)
	const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

	// Visible height
	const visibleHeight = $messages.offsetHeight

	// Height of messages container
	const containerHeight = $messages.scrollHeight

	// How far have I scrolled?
	const scrollOffset = $messages.scrollTop + visibleHeight

	if (containerHeight - newMessageHeight <= scrollOffset) {
		$messages.scrollTop = $messages.scrollHeight
	}
}

socket.on("message", ({ username, message, createdAt }) => {
	const html = Mustache.render(messageTemplate, {
		username,
		message,
		createdAt: moment(createdAt).format("h:mm a"),
	})
	$messages.insertAdjacentHTML("beforeend", html)
	autoscroll()
})

socket.on("locationMessage", ({ username, url, createdAt }) => {
	const html = Mustache.render(locationTemplate, {
		username,
		url,
		createdAt: moment(createdAt).format("h:mm a"),
	})
	$messages.insertAdjacentHTML("beforeend", html)
	autoscroll()
})

socket.on("roomData", ({ room, users }) => {
	const html = Mustache.render(sidebarTemplate, {
		users,
		room,
	})
	$sidebar.innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
	e.preventDefault()

	$messageFormButton.setAttribute("disabled", "disabled")

	const message = e.target.elements.message.value
	socket.emit("sendMessage", message, (err) => {
		$messageFormButton.removeAttribute("disabled")
		$messageFormInput.value = ""
		$messageFormInput.focus()

		if (err) {
			return console.log(err)
		}

		console.log("Message delivered!")
	})
})

$sendLocationButton.addEventListener("click", () => {
	if (!navigator.geolocation) {
		alert("Geolocation is not supported")
	}

	$sendLocationButton.setAttribute("disabled", "disabled")

	navigator.geolocation.getCurrentPosition((position) => {
		const { latitude, longitude } = position.coords
		socket.emit("sendLocation", { latitude, longitude }, (err) => {
			$sendLocationButton.removeAttribute("disabled")
			if (err) return console.log(err)

			console.log("Location shared!")
		})
	})
})

socket.emit("join", { username, room }, (err) => {
	if (err) {
		alert(err)
		location.href = "/"
	}
})
