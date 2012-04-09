function setUser(nick,request){
        request.session.data.user = nick;
        //DEBUG
        //console.log(request.session.data.user);

}
function unsetUser(request){
        request.session.data.user = "Guest";
}

exports.setUser = setUser;
exports.unsetUser = unsetUser;