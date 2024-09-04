
const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const app = express();
const server = http.createServer(app);
const { Server } = require('socket.io');
dotenv.config();
const port = process.env.PORT;
const io = new Server(server);
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const users = {};

//* Serve static files from the 'public' directory
app.use(express.static('public'));

app.get('/', (req, res) =>{
  res.sendFile('index.html');
})

//* Handle incoming messages from clients
io.on('connection', (socket)=>{

  socket.on('message', (message,room)=>{
     // If no specific room is provided, broadcast the message to all clients except the sender
    if(!room){
      socket.broadcast.emit('message', message);
    }else{
      // Send the message to clients in the specified room
      socket.to(room).emit('message', message);
    }
  })

  //* Handle new user joining: store user in memory and notify other clients
  socket.on('newUserJoined',(newUserName)=>{
    users[socket.id] = newUserName;   // Store the new user in memory with their socket ID
    socket.broadcast.emit('userJoined', newUserName);  // Notify other clients about the new user joining
  })

//* Handle user disconnection: notify other clients that a user has left
  socket.on('disconnect', (user)=>{
    socket.broadcast.emit('userLeft', users[socket.id]);  // Notify other clients about the user who has disconnected
  })

// handle receive prompt for gemini
socket.on('promptForGemini', async(prompt)=>{
  if(prompt == 'hi' || prompt == 'Hi' || prompt == 'hello' || 'Hello'){}
  const response = await generateContent(prompt);
  socket.emit('aiResponse', response);
})

})


async function generateContent(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    if(prompt === 'hi' || prompt ==='Hi' || prompt==="hello" || prompt ==="Hello"){
      return "Welcome to CareerHelp. How may i help you?"
    }
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    // Handle safety-related issues that block the content generation
    if (error.response && error.response.candidates && error.response.candidates[0].finishReason === 'SAFETY') {
      console.error('Response was blocked due to safety reasons:', error.response.candidates[0].safetyRatings);
      return 'The generated content was blocked due to safety concerns. Please try a different prompt.';
    } else {
      // Handle other errors that occur during content generation
      console.error('An error occurred while generating content:', error);
      return 'An error occurred while generating content. Please try again later.';
    }
  }
}


//* Start the server and listen for incoming connections on the specified port
server.listen(port, ()=>{
  console.log(`listening on port: ${port}`);
})