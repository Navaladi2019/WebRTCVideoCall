const { v4: uuidv4 } = require('uuid');

var WebSocketServer = require('ws').Server;
var fileSystem = require('fs');

//creating a websocket server at port 9090
var wss = new WebSocketServer({ port: process.env.port || process.env.PORT });

var twilio = require('twilio');

const accountSid = 'AC697c6756b0d91b6cf635d3309b99ced2';
const authToken = 'a5ff4c58d7d65bd2f700adf9c9dfd0ca';
const client = require('twilio')(accountSid, authToken);
var iceTwilioDetails;
client.tokens.create().then(token => iceTwilioDetails = token);

//all connected to the server users
var users = {};
var activeUsers = [];
var usersWithId = [];
var activeRoom = {};
var temporaryRoom = {};

//when a user connects to our sever
wss.on('connection', function (connection) {

   //when server gets a message from a connected user
   connection.on('message', function (message) {

      var data;
      try {
         data = JSON.parse(message);
      } catch (e) {
         data = {};
      }

      switch (data.type) {
         case "login":
            if (users[data.name]) {
               sendTo(connection, {
                  type: "login",
                  success: false
               });
            } else {
               var userId = uuidv4();
               usersWithId.push({ "id": userId, "name": data.name })
               //save user connection on the server
               users[data.name] = connection;
               connection.name = data.name;
               activeUsers.push(data.name);
               sendTo(connection, {
                  type: "login",
                  success: true,
                  users: activeUsers,
                  userId: userId
               });
            }

            break;

         case "offer":
            //if UserB exists then send him offer details
            var conn = users[data.name];

            if (conn != null) {
               //setting that UserA connected with UserB
               connection.otherName = data.name;

               sendTo(conn, {
                  type: "offer",
                  offer: data.offer,
                  name: connection.name,
                  section: data.section
               });
            }

            break;

         case "answer":
            var conn = users[data.name];

            if (conn != null) {
               connection.otherName = data.name;
               sendTo(conn, {
                  type: "answer",
                  answer: data.answer,
                  section: data.section
               });
            }

            break;

         case "candidate":
            var conn = users[data.name];

            if (conn != null) {
               sendTo(conn, {
                  type: "candidate",
                  candidate: data.candidate,
                  section: data.section
               });
            }

            break;

         case "leave":
            var conn = users[data.name];
            conn.otherName = null;

            //notify the other user so he can disconnect his peer connection
            if (conn != null) {
               sendTo(conn, {
                  type: "leave",
                  section: data.section
               });
            }
            break;
         case "iceServer":
            if (connection != null && iceTwilioDetails) {
               sendTo(connection, {
                  type: "iceserverURL",
                  iceurl: iceTwilioDetails.iceServers[0]
               })
            }
            break;
         case "userList":
            var conn = users[data.name];
            if (conn != null) {
               sendTo(conn, {
                  type: "userList",
                  users: activeUsers
               })
            }
            break;
         case "room":
            //Create or JOin a room

            var currentUserId = data.currentUserId;
            var roomId = data.roomId;
            var currentUserName = data.name;
            var hostId = data.hostId;

            console.log('Logged on: ' + getCurrentDateTime() + ' currentId', currentUserId);
            console.log('Logged on: ' + getCurrentDateTime() + ' roomId', roomId);
            console.log('Logged on: ' + getCurrentDateTime() + ' host Id', hostId);

            //Check if user exists
            if (users[currentUserId]) {
               console.log('Logged on: ' + getCurrentDateTime() + ' user exists');
               console.log('Logged on: ' + getCurrentDateTime() + users[currentUserId]);
               connection.name = currentUserId;
               users[currentUserId] = connection;
            }
            //If the user does not exist
            else {
               usersWithId.push({ "id": currentUserId, "name": currentUserName })
               //save user connection on the server
               users[currentUserId] = connection;
               connection.name = currentUserId;
               activeUsers.push(currentUserId);

               if (connection.roomId === 'undefined' && roomIndex > -1) {
                  connection.roomId = roomId;
               }
            }

            //If Host
            if (hostId === currentUserId) {
      console.log('==========================================HOST=========================================');

               //Create Room
               if (typeof activeRoom[roomId] === 'undefined') {
                  console.log('Logged on: ' + getCurrentDateTime() + ' create room', roomId);
                  activeRoom[roomId] = { "users": [currentUserId], "host": hostId };
                  if (typeof temporaryRoom[roomId] === 'undefined') { } else {
                     temporaryRoom[roomId].users.forEach(roomUserId => {
                        if (activeRoom[roomId] && activeRoom[roomId].users.indexOf(roomUserId) == -1) {
                           activeRoom[roomId].users.push(roomUserId);
                           var roomUserIndex = temporaryRoom[roomId].users.indexOf(roomUserId);
                           temporaryRoom[roomId].users.splice(roomUserIndex, 1);
                        }
                     });
                  }
               } else {
                  console.log('Logged on: ' + getCurrentDateTime() + ' Add host to the room', roomId);
                  if (activeRoom[roomId] && activeRoom[roomId].users.indexOf(currentUserId) == -1) {
                     activeRoom[roomId].users.push(currentUserId);
                  }
                  activeRoom[roomId].host = hostId;
               }
            } else {
               //If not Host
               //If room does not exists
               if (typeof activeRoom[roomId] === 'undefined') {
                  //Add user to temporary room
                  if (typeof temporaryRoom[roomId] === 'undefined') {
                     console.log('Logged on: ' + getCurrentDateTime() + ' Add user to the new temporary room', roomId);

                     temporaryRoom[roomId] = { "users": [currentUserId] };
                  } else {
                     console.log('Logged on: ' + getCurrentDateTime() + ' Add user to the temporary room', roomId);
                     if (temporaryRoom[roomId].users.indexOf(currentUserId) == -1) {
                        temporaryRoom[roomId].users.push(currentUserId);
                     }
                  }
               } else {
                  //If room exists
                  if (activeRoom[roomId] && activeRoom[roomId].users.indexOf(currentUserId) == -1) {
                     activeRoom[roomId].users.push(currentUserId);
                  }

                  var conn = users[hostId];
                  if (conn != null) {
                     sendTo(conn, {
                        type: "room",
                        roomId: roomId,
                        roomUsers: activeRoom[roomId]
                     })
                  }
               }
            }
            sendTo(connection, {
               type: "room",
               roomId: roomId,
               roomUsers: activeRoom[roomId]
            });
            connection.roomId = roomId;
            break;
         case 'endRoom':
            var conn = users[data.connectedname];
            
            if (conn != null) {
               sendTo(conn, {
                  type: 'endRoom',
                  roomId: data.roomId,
                  endby: data.name,
                  state: data.state,
                  appointmentId: data.appointmentId
               }).then(() => {
                  if (typeof activeRoom[data.roomId] !== 'undefined' && typeof activeRoom[data.roomId].users !== 'undefined') {
                     let currentRoomHostId;
                     if (typeof activeRoom[data.roomId].host !== 'undefined') {
                        currentRoomHostId = activeRoom[data.roomId].host;
                     }

                     if (activeRoom[data.roomId].users.indexOf(data.connectedname) != -1) {
                        var roomUserIndex = activeRoom[data.roomId].users.indexOf(data.connectedname);
                        if (roomUserIndex > -1 && activeRoom[data.roomId].users[roomUserIndex] != currentRoomHostId && data.state == 'end') {
                           activeRoom[data.roomId].users.splice(roomUserIndex, 1);
                        }
                     }
                  }

                  if (typeof temporaryRoom[data.roomId] !== 'undefined' && typeof temporaryRoom[data.roomId].users !== 'undefined') {

                     if (temporaryRoom[data.roomId].users.indexOf(data.connectedname) != -1) {
                        var roomUserIndex = temporaryRoom[data.roomId].users.indexOf(data.connectedname);
                        temporaryRoom[data.roomId].users.splice(roomUserIndex, 1);
                     }
                     }
               })
            }
            sendTo(connection, {
               type: 'endRoom',
               roomId: data.roomId,
               endby: data.name,
               state: data.state,
               appointmentId: data.appointmentId
            }).then(() => {
               if (typeof activeRoom[data.roomId] !== 'undefined' && typeof activeRoom[data.roomId].users !== 'undefined') {
                  if (activeRoom[data.roomId].users.indexOf(data.name) != -1) {
                     var roomUserIndex = activeRoom[data.roomId].users.indexOf(data.name);
                     activeRoom[data.roomId].users.splice(roomUserIndex, 1);
                  }
               }

               if (typeof temporaryRoom[data.roomId] !== 'undefined' && typeof temporaryRoom[data.roomId].users !== 'undefined') {

                  if (temporaryRoom[data.roomId].users.indexOf(data.name) != -1) {
                     var roomUserIndex = temporaryRoom[data.roomId].users.indexOf(data.name);
                     temporaryRoom[data.roomId].users.splice(roomUserIndex, 1);
                  }
                  }
            });

            break;
         case 'callTime':
            var conn = users[data.connectedname];
            if (conn != null) {
               var hostId = activeRoom[data.roomId].hostId;
               if (hostId == data.currentUserId) {
                  sendTo(conn, {
                     type: 'callTime',
                     roomId: data.roomId
                  })
               } else {
                  sendTo(conn, {
                     type: 'callTime',
                     roomId: data.roomId,
                     startTime: data.startTime
                  })
               }
            }
            break;
         default:
            sendTo(connection, {
               type: "error",
               message: "Command not found: " + data.type,
               section: data.section
            });
            break;
      }
   });

   //when user exits
   connection.on("close", function () {
      console.log('======================================CLOSE CONNECTION=============================================');
      console.log('Logged on: ' + getCurrentDateTime() + ' Connection is closed', connection.name)
      if (connection.name) {
         if (typeof activeRoom[connection.roomId] !== 'undefined' && typeof activeRoom[connection.roomId].users !== 'undefined') {
            if (activeRoom[connection.roomId].users.indexOf(connection.name) != -1) {
               var roomUserIndex = activeRoom[connection.roomId].users.indexOf(connection.name);
               activeRoom[connection.roomId].users.splice(roomUserIndex, 1);
            }
         }

         if (typeof temporaryRoom[connection.roomId] !== 'undefined' && typeof temporaryRoom[connection.roomId].users !== 'undefined') {
            if (temporaryRoom[connection.roomId].users.indexOf(connection.name) != -1) {
               var roomUserIndex = temporaryRoom[connection.roomId].users.indexOf(connection.name);
               temporaryRoom[connection.roomId].users.splice(roomUserIndex, 1);
            }
         }

         if (connection.otherName) {
            var conn = users[connection.otherName];
            conn.otherName = null;

            if (conn != null) {
               sendTo(conn, {
                  type: "leave"
               });
            }
         }
      }
   });
});

function sendTo(connection, message) {
   return new Promise((resolve, reject) => {
      try {
         connection.send(JSON.stringify(message));
         resolve();
      }
      catch (err) {
      console.log('==================================ERROR=================================================');
         console.log('Logged on: ' + getCurrentDateTime() + ' Error in sendTo', err);
         reject();
      }
   })
}

function getCurrentDateTime() {
   var today = new Date();
   var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
   var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
   var dateTime = date + ' ' + time;
   return dateTime;
}
