/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes/example');
var http = require('http');
var path = require('path');


var app = express();
app.use(express.static(path.join(__dirname, 'public')));

app.use('/example', routes);

var httpServer =http.createServer(app).listen(3000, function(req,res){
	console.log('Socket IO server has been started: localhost:3000');
});
//upgrade http server to socket.io server
var io = require('socket.io').listen(httpServer);
var clients = [];
var RCList = [];
var authNoList = [];

io.sockets.on('connection',function(socket){

	socket.emit('toclient',{msg:'connected: ' + socket.id});

	// new connect
	socket.on('login', function(data){

		if (data.sender == 'web') {
			console.log('connectUser: '+data.email);

			var clientInfo = new Object();
			clientInfo.uid = data.email;
			clientInfo.id = socket.id;


			var authNo = createAuthNo();// 랜덤함수
			while (!checkDuple(authNo)) {// 중복체크(*주의:배열이 꽉차잇으면 무한루프/10000명 동시접속시..그럴린없겠지만..)
				authNo = createAuthNo();
			};

			clientInfo.authNo = authNo;
			clients.push(clientInfo);
			io.sockets.connected[clientInfo.id].send(authNo);

			console.log(clients);


		} else if (data.sender == 'mobile') {

			for (var i = 0; i < clients.length; i++) {
				var client = clients[i];

				if (client.authNo == data.authNo) {
					io.sockets.connected[socket.id].send(client.uid);
					console.log(data.authNo + ' connect: ' + client.uid)
					break;
				}
				
				if (i == clients.length - 1) {
					io.sockets.connected[socket.id].send('error');
					console.log('[' + data.authNo + '] 인증 번호 목록에 존재하지 않습니다.');
				}
			}

//			io.sockets.connected[socket.id].send('authNo: '+ data.authNo);


		} else {}
	});


	socket.on('message special user', function(data) {
		for (var i=0; i < clients.length; i++) {
			var client = clients[i];
			if (client.uid == data.uid) {
				io.sockets.connected[client.id].send(data.msg);
				console.log('to: ' + client.uid + '->' + data.msg);
				break;
			}
		}
	});

	socket.on('disconnect', function() {
		for (var i=0; i < clients.length; i++) {
			var client = clients[i];
			if (client.id == socket.id) {
				clients.splice(i, 1);
				remove(client.authNo);
				break;
			}
		}
		console.log(authNoList);
		console.log('user disconnected');
	});

//	socket.on('fromclient',function(data){
//		socket.broadcast.emit('toclient',data); // 자신을 제외하고 다른 클라이언트에게 보냄
//		socket.emit('toclient',data); // 해당 클라이언트에게만 보냄. 다른 클라이언트에 보낼려면?
//		console.log('Message from client :'+data.msg);
//	});
});


//4자리 인증번호 생성(0000 - 9999)
function createAuthNo() {
	var authNo = '';
	var tempNo;
	// Math.random = [0, 1)
	tempNo = Math.floor(Math.random() * 10000);
	if (parseInt(tempNo / 10) == 0) {
		authNo += '000' + tempNo;
	} else if (parseInt(tempNo / 100) == 0) {
		authNo += '00' + tempNo;
	} else if (parseInt(tempNo / 1000) == 0) {
		authNo += '0' + tempNo;
	} else {
		authNo += tempNo;
	}

	return authNo;
}

function checkDuple(no) {

	for (var i = 0; i < authNoList; i++) {
		var authNo = authNoList[i];

		if (authNo == no) return false;
	}
	authNoList.push(no);
	return true;
}

function remove(targetAuthNo) {
	for (var i=0; i < authNoList.length; i++) {
		var authNo = authNoList[i];
		if (targetAuthNo == authNo) {
			authNoList.splice(i, 1);
			break;
		}
	}
}






