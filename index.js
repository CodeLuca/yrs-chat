var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var sanitizeHtml = require('sanitize-html');
var fs = require('fs');
app.use(express.static(__dirname));
var list = require('badwords-list');
banned = list.array;

var data = fs.readFileSync("config.json", "utf8", function(err, data) {
	if (err) throw err;
});
var config = JSON.parse(data);

app.get('/', function(req, res) {
	var page = fs.readFileSync("./chat.html", "utf8", function(err, data) {
		if (err) throw err;
	});

	page = page.replace("***firebase-url***", config.firebase_url);
	res.send(page);
});


io.on('connection', function(socket){
	socket.on('chat message', function(msg, user, imageLink){
		if(msg == '' || msg == undefined || msg == null) {
			return;
		}

		var allowed = true;
		var m = msg.split(' ');
		m.forEach(function(msg) {
			banned.forEach(function(word) {
				if(wordInString(msg, word)) {
					allowed = false;
				}
			});
		});

		if(allowed == false) {
			return;
		}

		var clean = sanitizeHtml(msg, {
			allowedTags: [ 'b', 'i', 'em', 'strong']
		});
		var cleanUser = sanitizeHtml(user, {
			allowedTags: [ 'b', 'i', 'em', 'strong']
		});
		io.emit('chat message', clean, cleanUser, imageLink);
	});
});

function wordInString(s, word){
	return new RegExp( '\\b' + word + '\\b', 'i').test(s);
}

http.listen(config.port, function(){
		banned.push('SPAM');
    console.log('listening on Port ' + config.port);
});
