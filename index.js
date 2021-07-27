const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const util = require('util');
const port = 3005

let subscribedClients = []

io.on('connection', async function(socket) {
  console.log("client connected");
  await addClient(socket);
  socket.on('action', async function(data) {
    console.log("received sync requests, forwarding to connected clients...")
    console.log("data: " + data) 
    await syncClients(socket, data);
  });

  socket.on('error', function(error) {
    console.log('Error : ' + error);
    removeClient(socket);
  });

  socket.on('timeout', function() {
    console.log('Socket timed out');
    removeClient(socket);
    socket.destroy();
  });

  socket.on('end', async function(data) {
    console.log('Socket ended by remote host!');
    removeClient(socket);
  });

  socket.on('disconnect', function(error) {
    removeClient(socket);
    console.log('Socket closed by remote host!');
    if (error) {
    }
  });
});

async function removeClient(socket)
{
  let index = 0
  subscribedClients.forEach((client) => {
    if(util.isDeepStrictEqual(client, socket))
    {
      subscribedClients.splice(index, 1);
      return;
    }
    index++;
  })
}

async function addClient(socket)
{
  if(!subscribedClients.includes(socket))
  {
    subscribedClients.push(socket);
  }
}

async function syncClients(socket, data)
{
  subscribedClients.forEach((client) => {
    if(!util.isDeepStrictEqual(client, socket))
    {
      client.emit('action', data);
    }
  })
}

server.listen(port);

server.on('listening', function() {
  console.log('File sharing server listening at port ' + port);
});
