const socket = io();

// Elements
const messageForm = document.querySelector('form');
const messageFormInput = document.querySelector('input');
const messageFormButton = document.querySelector('form button');
const sendLocationButton = document.querySelector('#send-location');
const messages = document.querySelector('#messages');
const sidebar = document.querySelector('#sidebar');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {
    const newMessage = messages.lastElementChild;

    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // visual height
    const visibleHeight = messages.offsetHeight;

    // height of messages container
    const containerHeight = messages.scrollHeight;

    // how far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
     });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', (message) => {
    const html = Mustache.render(sidebarTemplate, {
        room: message.room,
        users: message.users,
    });
    sidebar.innerHTML = html;
});

document.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();

    messageFormButton.setAttribute('disabled', 'disabled');

    socket.emit('sendMessage', messageFormInput.value, (error) => {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();

        if (error) {
            return console.error(error);
        }
    });
});

document.querySelector('#send-location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('geolocation is not supported by your browser');
    }

    sendLocationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords
        socket.emit('sendLocation', { longitude, latitude }, () => {
            sendLocationButton.removeAttribute('disabled');
        });
    })
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    };
});