console.log("starting server");
// process.argv[2] = port (optional)
// process.argv[3] = other main module (optional), modules should be specified staticaly static or by file list  but anyways i have my proprietery website and and the example i want them both running so ican share good examples

require.paths.unshift(__dirname); //make local paths accecible
//  require('filename')  // include file - filename is without '.js' extention!!!

var sys = require('sys');   // allaws to write to application streams (write to log)
var http = require('http'); // allaws to create http server
var mongo = require('deps/node-mongodb-native/lib/mongodb'); 
var app = require('serving').app;

db = new mongo.Db(app.database.name, new mongo.Server(app.database.host, app.database.port, {}), {});
db.addListener("error", function(error) { sys.puts("Error connecting to mongo -- perhaps it isn't running?"); process.exit(-1); });

db.open(function(p_db)
{
  console.log("connected to database");
  //var app = new App();
  app.init(db, 
  function()
  {
   var server_handler_function=app.dynamicallyCreateServerHandlerFunction();
   http.createServer(server_handler_function).listen(process.argv[2] || app.server.port);
   sys.puts((new Date).toTimeString()+' Server running at http://127.0.0.1:'+(process.argv[2] || app.server.port)+'/');
  });
});

// exit if any js file or template file is changed.
// this script encapsualated in a batch while(true); so it runs again after exit.
//var autoexit_watch=require('deps/nodejs-autorestart/autoexit').watch;
//autoexit_watch(__dirname,".js");
//autoexit_watch(__dirname+"/templates",".html");
//autoexit_watch(__dirname+"/templates",".css");
//loadlater(__dirname + "/invite.js");
