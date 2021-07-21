const net = require('net');
const util = require('util');
const server = net.createServer();
const port = 3005;
const timeout = 20000;

let subscribedClients = []

server.on('connection', async function(socket) {
  console.log("client connected");
  console.log("remote client ip: " + socket.remoteAddress)
  await addClient(socket);
  socket.on('data', async function(data) {
    console.log("received data " + data)
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

  socket.setTimeout(parseInt(timeout), function() {
    removeClient(socket);
    socket.destroy();
    console.log('Socket forced timed out for maximum on-time elapsed');
  });


  socket.on('close', function(error) {
    removeClient(socket);
    console.log('Socket closed!');
    if (error) {
      console.log('Socket was closed for transmission error!');
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
      client.write(data);
    }
  })
}

server.listen(port);

server.on('listening', function() {
  console.log('File sharing server listening at port ' + port);
});
