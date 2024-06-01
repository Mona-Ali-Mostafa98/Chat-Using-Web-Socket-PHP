document.addEventListener('DOMContentLoaded', () => {
    const username = prompt("Please enter your name") || 'Anonymous';
    const title_h = document.getElementById('title');
    const chatbox = document.getElementById('chatbox');
    const msg_input = document.getElementById('msg');
    const send_btn = document.getElementById('send');
    const clear_btn = document.getElementById('clear_chat');
    const online_div = document.getElementById('onlineusers');

    title_h.innerHTML = `User: ${username}`;

    const ws = new WebSocket('ws://localhost:8090');

    ws.onopen = () => {
        console.log('Connection opened');
        const message_obj = {
            username: username,
            login: true
        };
        ws.send(JSON.stringify(message_obj));
    };

    ws.onmessage = (event) => {
        const msg_content = JSON.parse(event.data);
        if (msg_content.type === 'login') {
            chatbox.innerHTML += `<h3 class="text-center text-success"> ${msg_content.message} </h3>`;
        } else if (msg_content.type === 'logout') {
            chatbox.innerHTML += `<h3 class="text-center text-danger"> ${msg_content.message} </h3>`;
        } else if (msg_content.type === 'chat') {
            displayMessage(msg_content.message, 'other');
        }
        updateOnlineUsers(msg_content.online);
    };

    ws.onerror = () => {
        chatbox.innerHTML += '<h3 style="color: red">Error connecting to server</h3>';
    };

    send_btn.addEventListener('click', () => {
        sendMessage();
    });

    msg_input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    clear_btn.addEventListener('click', () => {
        chatbox.innerHTML = '';
    });

    function sendMessage() {
        const msg_val = msg_input.value.trim();
        if (msg_val) {
            const message_obj = {
                body: `${username}: ${msg_val}`
            };
            ws.send(JSON.stringify(message_obj));
            displayMessage(`Me: ${msg_val}`, 'self');
            msg_input.value = '';
        }
    }

    function displayMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', type);
        messageDiv.innerHTML = `<div class="message">${message}</div>`;
        chatbox.appendChild(messageDiv);
        chatbox.scrollTop = chatbox.scrollHeight;
    }

    function updateOnlineUsers(users) {
        online_div.innerHTML = '';
        users.forEach(user => {
            const userItem = document.createElement('li');
            userItem.classList.add('list-group-item');
            userItem.innerHTML = `<span class="bg-success"></span>${user}`;
            online_div.appendChild(userItem);
        });
    }
});