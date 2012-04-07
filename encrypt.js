var crypto = require('crypto');
//event listener
var eventCrypto = require('events');
var eventC;
exports.eventC = eventC = new eventCrypto.EventEmitter();
// salt
var salt = 'cs402mum';
exports.salt = salt;
//hashpassword function
function hashPasswd(password,salt,option){
	if(option){
		var hash = crypto.createHash('md5').update(password + salt,'utf8').digest('hex');
	}else{
		var hash = crypto.createHash('md5').update(password,'utf8').digest('hex');
	}
	
	console.log('Returned hash: ' + hash);
	eventC.emit('user_hash',hash);
	return hash;
}

exports.hashPasswd = hashPasswd;

