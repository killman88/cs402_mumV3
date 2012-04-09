//check user's credential
$("#connectButton").on("click",function(){
	$.ajax({
	  type: "GET",
	  dataType: "json",
	  url: "/checkuser?login=" + nickInput.value + "&password=" + passwordInput.value,
	  error: function(data){
		//$("div.auth-failed").css("display","block");
		var res = JSON.stringify(data);
		alert(res);
	  },
	  success: function(data){
	    //  var parsedData = $.parseJSON(data);
	    //Think about the transition's login
	    // $('div.login_resp').html(data.check);
	      if(data.check == 'ok'){
		window.setTimeout('location.reload()', 1000);
	      }else{
		$('div.auth-failed').show();
	      }
	  }
	  
      });
  });
//-- Subscribe a new user
$("#subButton").on("click",function(){
		$.ajax({
			type: "GET",
			url: "/adduser",
			data: {login: subLogin.value, password: subPassword.value},
			error: function(){
				document.write('<p>An error occured!</p>');
			},
			success: function(data){
				var parsedData = $.parseJSON(data);
				if(parsedData.status == 'saved'){
                                    $("#subscribeForm").modal('hide');
                                    $("div.sub-success").show();
				    confirmMail();
                                }
			}
		});
		
		
	});
// Confirm user's subscription
function confirmMail(){
	 //Sends a confirmation to the user
		var to   = $("#subMail").attr("value");
		var from = 'awesomepantscrew@gmail.com';
		var sub = 'Your cs402mum credential!'
		var body = 'Subscription summary. Login: ' + subLogin.value + ' Password: ' + subPassword.value;
	    
		// validate
	    
		// make ajax request
		$.ajax({ 
		    type: "GET" // XXX should be POST
		    , dataType: "json"
		    , url: "/mail"
		    , data: { sender: from, receiver: to, subject: sub, message: body }
		    , error: function () {
		       
		      }
		    , success: function (data) {
			
		    }
		});
}