var mailer = require('nodemailer');

function mailSend(data,response){
    var mailHeader = {
        from : data.sender
        , to: data.receiver
        , subject: data.subject
        , html: data.message
    };
    console.log(mailHeader);
    var transport = mailer.createTransport("SMTP", {
    host: "smtp.gmail.com", // hostname
    secureConnection: true, // use SSL
    port: 465, // port for secure SMTP
    auth: {
        user: "awesomepantscrew@gmail.com",
        pass: "the401402the"
    }
   });
   
   transport.sendMail(mailHeader,function(error,success){
        transport.close();
        //console.log(success);
        return success ? true : false;
    });
   
   response.writeHead(200,
				{
					'Content-type': "text/html",
					'Access-Control-Allow-Origin' : '*',
				}
				);
    response.write('{"success" : "sent"}');
    response.end();
   
}

exports.mailSend = mailSend;

//mailSend({sender: "sebastien@gmail.com", receiver: "sebastien.pic@gmail.com", subject: "toto est la", message: "super toto"});