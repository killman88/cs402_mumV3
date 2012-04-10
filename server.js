//modules
//var server = require('http');
var server = require('https');
var url = require('url');
var mongoose = require('mongoose');
var qs = require('querystring');
var staticServer = require('node-static');
var sys = require("sys");
var session = require('./lib/core').session; //session module
// ReadCertificate synchronously
var readFileCert = require("fs").readFileSync;
//custom modules
var db = require('./db.js');
var encrypt = require('./encrypt.js');
var mail = require('./mail.js');
var fu = require("./js/fu");
var setsession = require("./js/setsession.js");
//variables
var port = 9000;
var fileChat = new(staticServer.Server)('./chat', { cache: 2 });
var fileAuth = new(staticServer.Server)('./public', { cache: 2 });
// var for checkuser
var data;
exports.data = data = '';
var toHash;
exports.toHash = toHash = '';
/*###############################
  Common servers functions
################################*/
function route(handle,fullurl,request,response){
	var pathname = url.parse(fullurl).pathname;
	console.log('page requested' + pathname);
	var arguments = parseURL(fullurl);
	
	switch (pathname){
		case '/login':
			return handle[pathname](fullurl);
		case '/adduser':
			return handle[pathname](arguments.login,arguments.password,response);
		case '/getuser':
			
			return handle[pathname](arguments.login,response);
		case '/checkuser':
			return handle[pathname](arguments,request,response);
		case '/mail':
			return handle[pathname](arguments,response);
		case '/join':
			return handle[pathname](request,response);
		case '/who':
			return handle[pathname](request,response);
		case '/part':
			return handle[pathname](request,response);
		case '/recv':
			return handle[pathname](request,response);
		case '/send':
			return handle[pathname](request,response);
		case '/setsess':
			return handle[pathname](request,response);
		case '/logout':
			return handle[pathname](request,response);
		default: 
			
			console.log("No actions defined to process the URL!");
			response.writeHead(200,
				{
					'Content-type': "text/html",
					'Access-Control-Allow-Origin' : '*',
					//"Content-Length": content.length
				}
			);
		
			//console.log(content);
			response.write('Error 404 not found');
			response.end();
			
	}
}

//Associate handlers to urls
//AUTH HANDLERS
var handle = {};
handle["/login"] = printURL;
handle["/adduser"] = db.addUser;
handle["/getuser"] = db.getUser;
handle["/checkuser"] = checkuser;
handle["/mail"] = mail.mailSend;
//CHAT SERVER FUNCTION
handle["/who"] = function (request, response) {
  var nicks = [];
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];
    nicks.push(session.nick);
  }
  response.simpleJSON(200, { nicks: nicks
                      , rss: mem.rss
                      });
};

handle["/join"] = function (request, response) {
  var nick = qs.parse(url.parse(request.url).query).nick;
  if (nick == null || nick.length == 0) {
    response.simpleJSON(400, {error: "Bad nick."});
    return;
  }

  var session = createSession(nick); //for the use of the chat
  if (session == null) {
    response.simpleJSON(400, {error: "Nick in use"});
    return;
  }

  //sys.puts("connection: " + nick + "@" + response.connection.remoteAddress);

  channel.appendMessage(session.nick, "join");
  response.simpleJSON(200, { id: session.id
                      , nick: session.nick
                      , rss: mem.rss
                      , starttime: starttime
                      });
};
handle["/part"] = function (request, response) {
  var id = qs.parse(url.parse(request.url).query).id;
  var session;
  if (id && sessions[id]) {
    session = sessions[id];
    session.destroy();
  }
  response.simpleJSON(200, { rss: mem.rss });
};
handle["/recv"] = function (request, response) {
  if (!qs.parse(url.parse(request.url).query).since) {
    response.simpleJSON(400, { error: "Must supply since parameter" });
    return;
  }
  var id = qs.parse(url.parse(request.url).query).id;
  var session;
  if (id && sessions[id]) {
    session = sessions[id];
    session.poke();
  }

  var since = parseInt(qs.parse(url.parse(request.url).query).since, 10);

  channel.query(since, function (messages) {
    if (session) session.poke();
    response.simpleJSON(200, { messages: messages, rss: mem.rss });
  });
};
handle["/send"] = function (request, response) {
  var id   = qs.parse(url.parse(request.url).query).id;
  var text = qs.parse(url.parse(request.url).query).text;
  var eom  = qs.parse(url.parse(request.url).query).endOfMessage;

  var session = sessions[id];
  if (!session || !text) {
    response.simpleJSON(400, { error: "No such session id" });
    return;
  }

  session.poke();

  if (eom === "true") {
    channel.appendMessage(session.nick, "msg", text);
  } else {
    channel.appendMessage(session.nick, "char", text);
  }
  
  response.simpleJSON(200, { rss: mem.rss });
};

handle["/setsess"] = function(request,response){
	request.session.data.user = 'toto';
	response.writeHead(200,
				{
					'Content-type': "text/html",
					'Access-Control-Allow-Origin' : '*',
					//"Content-Length": content.length
				}
			);
		
			//console.log(content);
			response.write('{"session" : "ok"}');
			response.end();
};
//Logout user
handle["/logout"] = function(request,response){
	setsession.unsetUser(request);
	response.simpleText(200,'{"session" : "disconnected"}');
	
};
//Handlers functions
function printURL(fullurl){
	//var data = url.parse(fullurl).querystring['login'] + '\n' + url.parse(fullurl).querystring['password'];
	//catch the value of an arg in the url qs.parse(url.parse(fullurl).query).login
	var data = qs.parse(url.parse(fullurl).query).login + ' ' +qs.parse(url.parse(fullurl).query).password;
	return data;
}
//url parser
function parseURL(urltoparse){
var query = url.parse(urltoparse).query;
	if (query != ''){
	var arguments = qs.parse(query);
	console.log(arguments);
		//Return a JSON object with arguments
		return arguments;
	}else return {};
	
}
/*###############################
  Auth server functions
################################*/

//checkuser
function checkuser(arguments,request,response){
		
		toHash = arguments.password;
		
		db.getUser(arguments.login);
		console.log('toHash: ' + toHash);
		db.eventDb.on('user_data',function(res){
			
			if(res != null){
				data = JSON.parse(res);
				encrypt.hashPasswd(toHash,encrypt.salt,true);
			}else{
				response.writeHead(200,
						{
							'Content-type': "text/plain",
							'Access-Control-Allow-Origin' : '*',
							//"Content-Length": content.length
						}
					);
					//response.write({"check": "nouser"});
					console.log('user checked');
					response.end('{"check": "nouser"}');
			}
			
			
			});
			
		encrypt.eventC.on('user_hash',function(hash){
				// DEBUG
				console.log('hashed: ' + hash);
				console.log('recup: ' + data["password"]);
				
				if(data["password"] == hash){
					//set the session's username
					setsession.setUser(data["login"],request);
					var res = '{"check" : "ok"}';
					response.writeHead(200,
						{
							'Content-type': "text/plain",
							'Access-Control-Allow-Origin' : '*',
							//"Content-Length": content.length
						}
					);
					response.write(res);
					console.log('user checked');
					response.end();
				}else{
					var res = '{"check" : "ko"}';
					response.writeHead(200,
						{
							'Content-type': "text/plain",
							'Access-Control-Allow-Origin' : '*',
							//"Content-Length": content.length
						}
					);
					response.write(res);
					console.log('user checked');
					response.end();
				}
		});
		//return;
}
/*################################
	Chat server functions
##################################*/
//does the argument only contain whitespace?
  function isBlank(text) {
    var blank = /^\s*$/;
    return (text.match(blank) !== null);
  }

// when the daemon started
var starttime = (new Date()).getTime();

var mem = process.memoryUsage();
// every 10 seconds poll for the memory.
setInterval(function () {
  mem = process.memoryUsage();
}, 10*1000);

var MESSAGE_BACKLOG = 200,
    SESSION_TIMEOUT = 60 * 1000;
    
var channel = new function () {
  var messages = [],
      callbacks = [];

  this.appendMessage = function (nick, type, text) {
    var m = { nick: nick
            , type: type // "msg", "join", "part"
            , text: text
            , timestamp: (new Date()).getTime()
            };

    switch (type) {
      case "char":
        //sys.puts("updating last message by " + nick + " to " + text);
        break;
      case "msg":
        sys.puts("<" + nick + "> " + text);
        break;
      case "join":
        sys.puts(nick + " join");
        break;
      case "part":
        sys.puts(nick + " part");
        break;
    }

    if (type !== "char")
      messages.push( m );
    else {
      //if (type === "char") {

      for (i = messages.length - 1; i >= 0; i--) {
        if (messages[i].nick === m.nick) {
          messages[i] = m;
          break;
        }
        messages.push( m );
      }
        
    }

    while (callbacks.length > 0) {
      callbacks.shift().callback([m]);
    }

    while (messages.length > MESSAGE_BACKLOG)
      messages.shift();
  };

  this.query = function (since, callback) {
    var matching = [];
    for (var i = 0; i < messages.length; i++) {
      var message = messages[i];
      if (message.timestamp > since)
        matching.push(message)
    }

    if (matching.length != 0) {
      callback(matching);
    } else {
      callbacks.push({ timestamp: new Date(), callback: callback });
    }
  };

  // clear old callbacks
  // they can hang around for at most 30 seconds.
  setInterval(function () {
    var now = new Date();
    while (callbacks.length > 0 && now - callbacks[0].timestamp > 30*1000) {
      callbacks.shift().callback([]);
    }
  }, 3000);
};

var sessions = {};

function createSession (nick) {
  if (nick.length > 50) return null;
  if (/[^\w_\-^!]/.exec(nick)) return null;

  for (var i in sessions) {
    var session = sessions[i];
    if (session && session.nick === nick) return null;
  }

  var session = { 
    nick: nick, 
    id: Math.floor(Math.random()*99999999999).toString(),
    timestamp: new Date(),

    poke: function () {
      session.timestamp = new Date();
    },

    destroy: function () {
      channel.appendMessage(session.nick, "part");
      delete sessions[session.id];
    }
  };

  sessions[session.id] = session;
  return session;
}

// interval to kill off old sessions
setInterval(function () {
  var now = new Date();
  for (var id in sessions) {
    if (!sessions.hasOwnProperty(id)) continue;
    var session = sessions[id];

    if (now - session.timestamp > SESSION_TIMEOUT) {
      session.destroy();
    }
  }
}, 1000);

  
  
//Server

function startServer(port,route,handle){
	//
	// Create a node-static server instance to serve the './public' folder
	//
	//var file = new(staticServer.Server)('./chat', { cache: 2 });
	//var fileChat = new(staticServer.Server)('./chat', { cache: 2 });
	//var fileAuth = new(staticServer.Server)('./public', { cache: 2 });
	//Manage incoming requests
	function onRequest(request,response){
		session(request, response, function(request, response){
                var fullurl = request.url;
		response.simpleText = function (code, body) {
		      response.writeHead(code, { "Content-Type": "text/plain"
					  , "Content-Length": body.length
					  });
		      response.end(body);
		};
		
		response.simpleJSON = function (code, obj) {
		      var body = new Buffer(JSON.stringify(obj));
		      response.writeHead(code, { "Content-Type": "text/json"
					  , "Content-Length": body.length
					  });
		//write the http response
		response.end(body);
		};
		
		//Server static file and manage user's session
		
		
		// Test if ! a query
		if(url.parse(fullurl).pathname != '/favicon.ico' && url.parse(fullurl).pathname in handle ){
			route(handle,fullurl,request,response);
		}else{
			request.addListener('end', function () {
			//
			// Serve files regarding the user's session
			// If authentified => chat, else auth
			if(request.session.data.user == 'Guest'){
				fileAuth.serve(request, response);
				console.log('The user is ' + request.session.data.user);
			}else{
				fileChat.serve(request, response);
			}
			
						
			});
		}
    
		});
              
		
	}
	//--------------------
	// Create Http server
	//--------------------
	// SSL certificate
	// How to generate keyPair
	// Generate the private key : openssl genrsa -out ryans-key.pem 1024
	// Generate the CSR (Certificate Signing Request) : openssl req -new -key ryans-key.pem -out ryans-csr.pem
	// Generate the self signed cert : openssl x509 -req -in ryans-csr.pem -signkey ryans-key.pem -out ryans-cert.pem
	var ssl_options = {
	key: readFileCert('keys/cs402mum_private.pem'),
	cert: readFileCert('keys/cs402mum_cert.pem')
      };
	server.createServer(ssl_options,onRequest).listen(port,'localhost',function(){
		console.log('Server listening on ' + port);
	});
	
}



startServer(port,route,handle);
