var sys = require('sys');

var url = require('url');   // allaws to parse urls                        
var _ = require('deps/nodejs-clone-extend/merger');  //  lets do: _.extend(same,otherobjexts),  _.clone(obj) - creates new reference, see source to understand // 
var doubletemplate = require('deps/nodejs-meta-templates/doubletemplate');  //load double teplate module
//var doubletemplate=te.doubletemplate; // export double template function to global
var fs = require('fs');    // allaws to open files
var app=require('app_skeleton').app; // include  basic definision of a model and a filed in a model
var app_loaded=false;
//var milliseconds = require('deps/node-microseconds/lib/node-microseconds').milliseconds;
console.log("start require modules");
if(process.argv[3])
{
 var modules=[  require(process.argv[3]) ];  // same as below but dynamicaly for testing only
}
else
{
 var modules=[  require('templates/website/pijimi_heb/modules/main'),require('templates/website/pijimi_heb/modules/event') ]; // include  basic definision of a model and a filed in a model
}
console.log("end require modules");

//require("sys").puts(milliseconds());
//sys.puts('test');

console.log("starting to install modules and to setup models");
    // install modules and setup models
    for(var i =0; i < modules.length ; i++ ) modules[i].setupfirst(app);
console.log("start app.load_app_templates");
    app.load_app_templates(); 
console.log("start modules[i].setup");
    for(var i =0; i < modules.length ; i++ ) modules[i].setup(app)   ;
console.log("start app.models[i].setupfirst");
     for(var i in app.models) app.models[i].setupfirst(app);
console.log("start app.models[i].setup");
     for(var i in app.models) app.models[i].setup(app);
    // end install modules and setup models

     

     
var cookie = {
	req:null,
	get:function() { 
	 var req = this.req;
	 return (req.headers.cookie ? this.parse(req.headers.cookie) : {});
	},
	parse:function(str)	{
	    var obj = {},
	        pairs = str.split(/[;,] */);
	    for (var i = 0, len = pairs.length; i < len; ++i) {
	        var pair = pairs[i],
	            eqlIndex = pair.indexOf('='),
	            key = pair.substr(0, eqlIndex).trim().toLowerCase(),
	            val = pair.substr(++eqlIndex, pair.length).trim();
	        // Quoted values
	        if (val[0] === '"') {
	            val = val.slice(1, -1);
	        }
	        // Only assign once
	        if (obj[key] === undefined) {
	            //obj[key] = querystring.unescape(val, true);
	        	obj[key] = val;
	        }
	    }
	    return obj;
	}
};


function getuser(callback){
	var req = this;
	data = req.cookie.get();
	if (data.user_id){
		data.user_id = app.ObjectID.createFromHexString(data.user_id);
		app.models.t2_users.getall({_id:data.user_id} , function(result){ 
			if (result.length>0){
				req.user = result[0];
				callback(req.user);
			} else {
				callback(false);
			}
			
		})
	} else {
		callback(false);
	}
}

function redirect(res, url, callback, code ) {
 res.writeHead( code || 302, {'Location': url } );
 res.end();
 if(callback)callback();
};

console.log("starting extend application");
app = _.extend(app,{
  //'milliseconds':milliseconds,
  init: function(db, callback)
  {
  
    this.setupDb(db, function() {

     //  last install modules and setup models
     for(var i in app.models) app.models[i].setuplast(app);
     for(var i =0; i < modules.length ; i++ ) modules[i].setuplast(app) ;
     app.setuppages();
     // end last install modules and setup models
    
    callback(); 
    
    } );   
    //    this.setupWebSocket();
    //this.addAllMetrics(db);
  }
  ,
  
  setupDb: function(db, callback) {
    
    // simple version:
    // db.createCollection('visits', function(err, collection)
    // {
    //  db.collection('visits', function(err, collection)
    //  {
    //    model.collection = collection;  callback();   });  });
    var arrmodels=[],key;
    for(key in app.models)
    {
     app.models[key].modelname=key;
     arrmodels.push(app.models[key]);
    }
    
    
    // chained version:
    app.step(
     function ()
     {
      var newgroup = this.group();
      arrmodels.forEach(function (model)
      {
       var ret_group_item=newgroup();
       //sys.puts('create collection: app.models.'+model.modelname+'.collection = '+model.general.name);
       db.collection
       (
        model.general.name
         ,
        function(err, collection)
        {
         model.collection = collection;
         ret_group_item(null,true);         
        }
       );
      });
     },
     function (err, contents)
     {
      //if (err) { throw err; }
      callback();
     }
    );

  },
  setupPages: function ()
  {
   
  },
/*
  setupWebSocket: function()
  {
    // Websocket TCP server
    var wsServer = ws.createServer({log: false});
    wsServer.listen(config.websocket_port);

    wsServer.addListener("connection", function (conn) {
      sys.log("ws connect: " + conn._id);
      conn.addListener("close", function () {
        sys.log("ws close: " + conn._id);
      });
    });

    this.wsServer = wsServer;

    sys.puts('Web Socket server running at ws://*:' + app.websocket_port);
  },


  addAllMetrics: function(db) {
    var self = this;

    Metric.allMetrics(function(metric) {
      metric.init(db);
      metric.wsServer = self.wsServer;
      self.metrics.push(metric);
    });
  },
  */
  dynamicallyCreateServerHandlerFunction: function ()
  {
   return function (req,res)
   {
    if (req.method==='POST')
    {
     app.httputils.realpost(req,res,function (querydata)
     {
      //req.post=querydata;
      app.serveRequest(req,res);
     });
    }
    else
    {
     app.serveRequest(req,res);    
    }
   }
  },
  extendrequest: function(req)
  {
   req.cookie = cookie;
   req.cookie.req = req;
   req.user = null;
   req.getuser = getuser;
   req.redirect = redirect;
   /*
   
   req.sessions={}
   req.sessions.req=req;
   req.sessions.save=session.save;
   */
  }
  ,
  serveRequest: function(req, res, newi) // rename to route
  {
   this.extendrequest(req);

   app.httputils.get_user(req);
   if(!app_loaded)
   {
    process.on('uncaughtException', function (err) { 
      console.log('Caught exception: ' + err.stack);
    });
    app_loaded=true;
   }

   try
   {
    if (!req.parsedurl)
    {
     req.parsedurl=url.parse(req.url,true);
     if(!req.parsedurl.pathname) req.parsedurl={pathname:'error_in_url'};
     if(!req.parsedurl.query)req.parsedurl.query={};
     if(req.parsedurl && req.parsedurl.pathname)req.parsedurl.pathname=decodeURIComponent(req.parsedurl.pathname.replace(/\+/g, '%20'));
     //req.times=[];
     //req.times_start=milliseconds();
     //req.times.push(milliseconds()-req.times_start);
    }
    //sys.puts(' serveRequest '+newi);
    if(!newi) newi=0;
    
    var myurl=req.parsedurl;
    var urlmatch=false;

    
    for(var i=newi;i<app.url_routes.length;i++)
    {
     //sys.puts(' serveRequest loop '+i);
     urlmatch=false;
     if(app.url_routes[i].path=='default') continue; //add defaut  at the end
     if(typeof app.url_routes[i].pathbegins!='undefined')
     {
      if( myurl.pathname.substring(0,app.url_routes[i].pathbegins.length)==app.url_routes[i].pathbegins )
      {
       urlmatch=true;
       //sys.puts("match: "+app.url_routes[i].pathbegins);
      }
     }
     else if(typeof app.url_routes[i].path!='undefined')
     {
      if(myurl.pathname==app.url_routes[i].path)
      {
       urlmatch=true;
       //sys.puts("match: "+app.url_routes[i].path);
      }
     }
     if(urlmatch)
     {
      if(typeof app.url_routes[i].func!='undefined')
      {
       if(app.url_routes[i].func(data,settings,res,req,myurl))
        return true; // true means break the preview function
       else urlmatch=false;
      }
      if(typeof app.url_routes[i].page!='undefined')
      {
        /*
        //var req2=req,res2=res;
        setTimeout(function(){
        app.httputils.post(req,res,function (querydata){
              console.log("success"); 
              res.writeHead(200, { 'Content-Type': 'text/html'});
              res.write(sys.inspect(querydata));
              res.end();
        });},530);
 return true;*/
 
       if(app.url_routes[i].page.main( req, res, app.url_routes[i].page, i ))
       {
        return true; // true means break the preview function
       }
       else urlmatch=false;
      }
      else if(typeof app.url_routes[i].code!='undefined')
      {
       var ftext=app.url_routes[i].code.toString();
       ftext=ftext.substring(ftext.indexOf('{')+1,ftext.lastIndexOf('}'));
       eval(ftext);
      }
      //if(typeof app.url_routes[i].dontbreak=='undefined')  myswitch += 'break;';
      //else if(app.url_routes[i].dontbreak==false)  myswitch += 'break;';
     }
     
    }
    
    
    if(!urlmatch)
    {
     sys.puts("not found: "+req.parsedurl.pathname);
     //app.urls[0][1][app.urls[0][2]](req, res);
     res.writeHead(202, { 'Content-Type': 'text/html'});
     res.write("<html><head><title>Unhandeld request</title></head><body>hendle request (req, res) \r\n did not match any url: \r\n "+req.parsedurl.pathname+" \r\n<br\ > <a href='/'>click here</a> to go to the main page</body></html>");
     res.end();
    }
    }
    catch(error)
    {
     sys.puts("error: "+req.parsedurl.pathname);
     //app.urls[0][1][app.urls[0][2]](req, res);
     res.writeHead(202, { 'Content-Type': 'text/html'});
     res.write("<html><head><title>Server Error</title></head><body>Server Error in Handle Request (url: "+req.parsedurl.pathname+"): \r\n  <pre>"+error.stack+"</pre> \r\n<br\ > <a href='/'>click here</a> to go to the main page</body></html>");
     res.end();
    }
    
    //this.writePixel(res);

    //var env = this.splitQuery(req.url.split('?')[1]);
    //env.timestamp = new Date();
    // sys.log(JSON.stringify(env, null, 2));

    //var view = new View(env);

    //env.url_key = view.urlKey();
    //env.product_id = view.productId();

    //this.collection.insertAll([env]);

    //for(var i = 0; i < this.metrics.length; i++) {
    //  this.metrics[i].incrementCallback(view);
    //}
  },

  /*
  splitQuery: function(query) {
    var queryString = {};
    (query || "").replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { queryString[$1] = querystring.unescape($3.replace(/\+/g, ' ')); }
    );

    return queryString;
  },
  */
  /*
  writePixel: function(res) {
    res.writeHead(200, { 'Content-Type': 'image/gif',
                         'Content-Disposition': 'inline',
                         'Content-Length': '43' });
    res.end(this.pixel);
  },
*/
  handleError: function(req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.end();

    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  }
});

this.app = app;
