//var createServer = require("http").createServer;
//fu modules
//var createServer = require("http").createServer;
var createServer = require("https").createServer;
var readFile = require("fs").readFile;
// ReadCertificate synchronously
var readFileCert = require("fs").readFileSync;
var sys = require("sys");
var url = require("url");
var sys = require("sys");
//fu variable
DEBUG = false;
var fu = exports;
var NOT_FOUND = "Not Found\n";

//fu functions
//Close http server
fu.close = function () { server.close(); };

function extname (path) {
  var index = path.lastIndexOf(".");
  return index < 0 ? "" : path.substring(index);
}

fu.staticHandler = function (filename) {
  var body, headers;
  var content_type = fu.mime.lookupExtension(extname(filename));

  function loadResponseData(callback) {
    if (body && headers && !DEBUG) {
      callback();
      return;
    }

    sys.puts("loading " + filename + "...");
    readFile(filename, function (err, data) {
      if (err) {
        sys.puts("Error loading " + filename);
      } else {
        body = data;
        headers = { "Content-Type": content_type
                  , "Content-Length": body.length
                  };
        if (!DEBUG) headers["Cache-Control"] = "public";
        sys.puts("static file " + filename + " loaded");
        callback();
      }
    });
  }

  return function (req, res) {
    loadResponseData(function () {
      res.writeHead(200, headers);
      res.end(req.method === "HEAD" ? "" : body);
    });
  }
};
