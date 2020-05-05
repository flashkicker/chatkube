const generateMessage = ({ username, message }) => {
	return {
		username,
		message,
		createdAt: new Date().getTime(),
	}
}

const generateLocationMessage = ({
	username,
	location: { latitude, longitude },
}) => {
	return {
		username,
		url: `https://www.google.com/maps?q=${latitude},${longitude}`,
		createdAt: new Date().getTime(),
	}
}

module.exports = {
	generateMessage,
	generateLocationMessage,
}
