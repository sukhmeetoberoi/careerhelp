
const socket = io();


const messageInput = document.getElementById('message-input');
const messageArea = document.querySelector('.message-area');
const userInfo = document.querySelector('.user-info'); 
const displayRoomID = document.getElementById('room-id');
const inputRoomID = document.getElementById('room-id-input');
const aiCheckbox = document.getElementById('ai-checkbox'); 


const incomingMsg = new Audio('../audio/incoming-msg.mp3');
const userJoin = new Audio('../audio/user-join.mp3');
const userLeft = new Audio('../audio/user-left.mp3');
const incomingMsgForAi = new Audio('../audio/ai-incoming-msg.mp3');


let name;
do {
  name = prompt('Please enter your name');
} while (!name);


messageInput.addEventListener('keyup', (e) => {
  const message = e.target.value;
  if (message.trim() === '') return
  if (e.key === 'Enter') {
    sendMessage(e.target.value);
    messageInput.value = '';
  }
})


function appendMessage(msg, type) {
  const mainDiv = document.createElement('div');
  const className = type;
  const markup = `
  <h4>${msg.name}: </h4>
  <p>${msg.message}</p>
  `
  mainDiv.innerHTML = markup;
  mainDiv.classList.add(className, 'message');
  messageArea.appendChild(mainDiv);
}

function appendUserInfo(name, statusMessage) {
  const userInfoDiv = document.createElement('div');
  const className = 'user-info';
  userInfoDiv.classList.add(className);
  const markup = `
  <p>${name} ${statusMessage}</p>
  `
  userInfoDiv.innerHTML = markup;
  messageArea.appendChild(userInfoDiv);
}


function appendAiResponse(msg, type) {
  const mainDiv = document.createElement('div');
  const className = type;
  // Format the message by replacing newline characters with HTML line breaks
  const formattedMsg = msg.replace(/\n/g, '<br>'); // Replace \n with <br>
  const markup = `
    <h4>${type === 'outgoing' ? 'You' : 'CareerHelp'}:</h4>
    <p>${formattedMsg}</p>
  `;
  mainDiv.innerHTML = markup;
  mainDiv.classList.add(className, 'message');
  messageArea.appendChild(mainDiv);
}

function sendMessage(message) {
  // Create a message object with the user's name and trimmed message text
  const msg = {
    name: name,
    message: message.trim(),
  }
  appendMessage(msg, 'outgoing');
  if (aiCheckbox.checked) {

    socket.emit('promptForGemini', message.trim());
  } else {
    socket.emit('message', msg, inputRoomID.value.trim());
  }
  scrollToBottom();
}


socket.on('connect', () => {
  displayRoomID.innerHTML = socket.id;
})

socket.on('aiResponse', (response) => {
  if (aiCheckbox.checked) {
    appendAiResponse(response, 'incoming');
    incomingMsgForAi.play();
    scrollToBottom();
  }
})


socket.on('message', (msg) => {
  if (!aiCheckbox.checked) {
    appendMessage(msg, 'incoming');
    incomingMsg.play();
    scrollToBottom();
  }
})


socket.on('userJoined', (newUser) => {
  if(!aiCheckbox.checked){
    userJoin.play();
    appendUserInfo(newUser, 'joined');
  }
});


socket.on('userLeft', (user) => {
  if(!aiCheckbox.checked){
    userLeft.play(); 
    appendUserInfo(user, 'left');
  }
})


socket.emit('newUserJoined', name);


function scrollToBottom() {
  messageArea.scrollTop = messageArea.scrollHeight;
}