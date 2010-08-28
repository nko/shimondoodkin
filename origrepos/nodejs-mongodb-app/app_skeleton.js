var _ = require('deps/nodejs-clone-extend/merger');  //  lets do: _.extend(same,otherobjexts),  _.clone(obj) - creates new reference, see source to understand // 
var sys = require('sys');
var path = require('path');
var fs = require('fs');

var doubletemplate = require('deps/nodejs-meta-templates/doubletemplate');  //load double teplate module
var httputils = require('httputils');
var ObjectID= require('deps/node-mongodb-native/lib/mongodb/bson/bson').ObjectID;
var step=require('deps/step/lib/step');
var phpjs = require('phpjs'); // http://phpjs.org/packages/view/2693/name:806d77a73ce93d851a4620f4a788acd7

var autoreload= require('deps/node-hot-reload');autoreload.path=__dirname;

/*

 +tables - collections
  \/
 +model - collection_specs
  \/
     // +view - compose several tables if needed( sub tables to depth) // posible to implement with a model with map reduce etc..
     //  \/  
     //
     // -meshup_of_models //put several tables here and inter connect them, but indead not required
     //  \/
     // pages - bunch of pages for a meshup_of_models from templates
 +pages - bunch of pages for a model from templates
  \/
 +templates - bunch of pages for a models_meshup
  \/
 +urls and actions - bunch of pages for a models_meshup
  \/
 +requests - bunch of pages for a models_meshup - // missing to rewrite to comp
 
*/

function App()
{
    this.autoreload=autoreload;
	  this._=_;
	  this.phpjs=phpjs;
	  this.path=path;
	  this.fs=fs;
    var app=this;
    this.server={port:8000};
    this.websocket={port:8000};
    this.templates_path=__dirname+'/templates/';
    this.files_path=__dirname+'/files/';
    this.root_path=__dirname;
    this.doubletemplate=doubletemplate;
    this.httputils=httputils;
    this.ObjectID=ObjectID;
    this.step=step;
    this.sys=sys;
    
    this.database={name:'test',server:'localhost',port:27017};
    this.models={};
    this.urls_route_before=[];
    this.url_routes=[];
    this.url_routes_after=[];  
    this.master_templates_cache
    this.pages=[]; 

    this.menus={}; 
    this.collections={};


    this.templates= // master templates
    {
     pagefilename:__filename,
     load_templates:  // texts treated as templates filenames to load and prepeare
     {
      admin:"admin.html",
     },
     
     prepeare_templates:  // function treated as templates function to prepeare
     {
      //template2:function template2(var){...}, // function template to be prepeared here instantly= bad idea
     },
    };
    
    this.editfields= // master templates
    {
     pagefilename:__filename,
     load_templates:  // texts treated as templates filenames to load and prepeare
     {
      checkbox:"editfields/checkbox.html",
      date:"editfields/date.html",
      file:"editfields/file.html",
      hidden:"editfields/hidden.html",
      image:"editfields/image.html",
      number:"editfields/number.html",
      password:"editfields/password.html",
      radio:"editfields/radio.html",
      select:"editfields/select.html",
      text:"editfields/text.html",
      textarea:"editfields/textarea.html",
      html:"editfields/html.html",     
     },
     
     prepeare_templates:  // function treated as templates function to prepeare
     {
      //template2:function template2(var){...}, // function template to be prepeared here instantly= bad idea
     },
     
     // there is no data to templates of the 1st step
     //prepere_data:function (template_name) {  return {'app':app};},
     
    };
    
    this.viewfields= // master templates
    {
     pagefilename:__filename,
     load_templates:  // texts treated as templates filenames to load and prepeare
     {
      div:"viewfields/div.html",
      link:"viewfields/link.html",
      image:"viewfields/image.html",
      //additional might be good idea
      checkbox:"viewfields/checkbox.html",
      date:"viewfields/date.html",
      file:"viewfields/file.html",
      hidden:"viewfields/hidden.html",
      //image:"viewfields/image.html",
      number:"viewfields/number.html",
      password:"viewfields/password.html",
      radio:"viewfields/radio.html",
      select:"viewfields/select.html",
      text:"viewfields/text.html",
      textarea:"viewfields/textarea.html",
      html:"viewfields/html.html",     
     },
     
     prepeare_templates:  // function treated as templates function to prepeare
     {
      //template2:function template2(var){...}, // function template to be prepeared here instantly= bad idea
     },

     // there is no data to templates of the 1st step
     //prepere_data:function (template_name) {  return {'app':app};},
    };
    
   
   
    this.load_templates = function (templates_object,callback)
    {

       templates_object.htmlencode=doubletemplate.htmlencode;
       
       templates_object.load=function(tempalte_name,template_file,data2)
       {
        // data1 might need clone here , but seems not needed because wil never changed from inside template
        templates_object.prepere_data(templates_object,tempalte_name,
         function(data1)
         {
          if(typeof data2 === 'undefined' && typeof data1 !== 'undefined')
           data2={};
          if(typeof data2 !== 'undefined')
           _.add(data2,data1);
          if(templates_object[tempalte_name])
           throw new Error('template '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+' already exists.');
          else
          {
           //console.log('load template1 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+'.');
           templates_object[tempalte_name]=doubletemplate.loadtemplate(app.templates_path+template_file,templates_object,data2);
          }
         }        
        );
       }
       templates_object._=_;
       
       templates_object.load1=function(tempalte_name,template_file)
       {
        if(templates_object[tempalte_name])
         throw new Error('template '+(templates_object.pagefilename?templates_object.pagefilename:'')+tempalte_name+' already exists.');
        else
        {
         templates_object[tempalte_name]=doubletemplate.loadtemplate1(app.templates_path+template_file,templates_object);
         //console.log('load template2 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+'.');
        }
       }
       
       var data,tempalte_name,template_file;
       // load templates
       var countcallback=0;// count inner loops until callback
       countcallback++;//one more for this function;
       if(templates_object.load_templates)
       _.foreach(templates_object.load_templates,
       function (template_file,tempalte_name)
       {
         countcallback++;
         templates_object.prepere_data(templates_object,tempalte_name, function(data)
         {
          if(templates_object[tempalte_name])
           throw new Error('template3 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+' already exists.'+' model:'+(templates_object.model?templates_object.model.modelname:''));
          else
          {
           /*
           //// debug template redifinition: (uncomment then recomment) 
           if((templates_object.pagefilename?templates_object.pagefilename:'')=='/var/www/nodejs-mongodb-app/templates/default/add.js'&& tempalte_name=='content')
           {
            try
            { 
             throw new Error('load_template trace '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+' model:'+(templates_object.model?templates_object.model.modelname:''));
            }
            catch (e) { console.log(e.stack); }
           }
           //// end debug template redifinition:
           */ 
           //console.log('load template3 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+' model:'+(templates_object.model?templates_object.model.modelname:''));
           templates_object[tempalte_name]=doubletemplate.loadtemplate(app.templates_path+template_file,templates_object,data)
          }
          countcallback--;
          if(countcallback==0) {if(callback)callback(); }
         }
        );
       },this);
       
                
       // prepeare function templates
       if(templates_object.prepeare_templates)
       _.foreach(templates_object.prepeare_templates,
       function (template_file,tempalte_name)
       {
        countcallback++;
        templates_object.prepere_data(templates_object,tempalte_name,function (data)
        {
         if(templates_object[tempalte_name])
          throw new Error('template '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+' already exists.');
         else
         {
          //console.log('load template4 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+'.');
          templates_object[tempalte_name]=doubletemplate.prepeare(template_file,'function/'+tempalte_name,templates_object,data);
         }
         countcallback--;
         if(countcallback==0) if(callback)callback();
        });
       }
       ,this);
       countcallback--;
       if(countcallback==0) {if(callback)callback(); }
    }
    
    this.load_templates1 = function (templates_object)
    {
       //   console.log(templates_object.pagefilename);
       templates_object.htmlencode=doubletemplate.htmlencode;
       
       templates_object.load=function(tempalte_name,template_file)
       {
        if(templates_object[tempalte_name])
         throw new Error('template '+tempalte_name+' already exists.');
        else
        {
          //console.log('load template5 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+'.');
          templates_object[tempalte_name]=doubletemplate.loadtemplate1(app.templates_path+template_file,templates_object);
        }
       }
       templates_object._=_;
       
       var tempalte_name;
       // load templates
       if(templates_object.load_templates)
       _.foreach(templates_object.load_templates,
       function (template_file,tempalte_name)
       {
        var template_file=templates_object.load_templates[tempalte_name];
        if(templates_object[tempalte_name])
         throw new Error('template '+tempalte_name+' already exists.');
        else
         {
          //console.log('load template6 '+(templates_object.pagefilename?templates_object.pagefilename:'')+' - '+tempalte_name+'.');
          templates_object[tempalte_name]=doubletemplate.loadtemplate1(app.templates_path+template_file,templates_object)
         }
       },this);
    }
    
    this.load_app_templates=function (callback)
    {
     this.load_templates1(this.templates);
     this.load_templates1(this.editfields);
     this.load_templates1(this.viewfields);      
     if(callback)callback(callback);
    };
   

    this.defaultvalidation=function ()
    {
     return {valid:true,message:''};
    }
    
    
    this.prepare_subitems_lists = function (main_model)
    {
     //sys.puts(sys.inspect(main_model));
     var operation,operations=['edit','view'];
     var operations_copy={'list':'view','add':'edit','multiupdate':'edit','advancedsearch':'edit'};
     var arrselections,fieldname,havelookup,lookupinfo,field,operations_type;
     
     main_model.prep_subitems={};
     
     for(var i=0;i<operations.length;i++)
     {
      operation=operations[i];
      arrselections=[];
      operations_type=operation;
           if(operation=='view')           operations_type='view';
      else if(operation=='list')           operations_type='view';
      else if(operation=='add')            operations_type='edit';
      else if(operation=='multiupdate')    operations_type='edit';
      else if(operation=='advancedsearch') operations_type='edit'; // add searchtags later
      for(fieldname in main_model.fields)
      {
       if(!main_model.fields[fieldname]) console.log('field \''+main_model.general.name +','+fieldname+'\' not found')
       field=main_model.fields[fieldname];

       if(operations_type=='view')
       {
        if(typeof field.viewtag[
         field[operations_type].ftype
        ].lookup===null)
        {
         havelookup=field.edittag[
          field['edit'].ftype
         ].lookup
         ?true:false;
         if(havelookup)
          lookupinfo=field.edittag.lookup;
        }
        else
        {
         havelookup=field.edittag[
          field[operations_type].ftype
         ].lookup
         ?true:false;
         if(havelookup)
         {
          if(field.viewtag.lookup.sameasedit)
           lookupinfo=field.edittag.lookup;
          else
          {
           lookupinfo=field.viewtag.lookup;
          } 
         }
        }
       }
       else
       {
        //sys.puts(operations_type);
        //sys.puts(sys.inspect(field));
         havelookup=field.edittag[ field[operations_type].ftype  ].lookup?true:false;
         if(havelookup)
         {
          lookupinfo=field.edittag.lookup;
         }
       }
        
       if(havelookup)
       {
        arrselections.push({where:(lookupinfo.where?lookupinfo.where:false), submodel:app.models[lookupinfo.tablename],'fieldname':fieldname,cursor:[],'lookupinfo':lookupinfo});
       }
      }
      
      main_model.prep_subitems[operation]=arrselections;
     }
       
     
     var source,target;
     for(target in operations_copy)
     {
      source=operations_copy[target];
      main_model.prep_subitems[target]=main_model.prep_subitems[source];
     }
     //sys.puts(sys.inspect(main_model.prep_subitems));
    }

    this.fake_load_data= function(items_to_load,retdata,callback)
    {
             var call_count=1;

              for(var items_to_load_key2 in items_to_load)
              {
               if(items_to_load.hasOwnProperty(items_to_load_key2))
               {
                var info_of_model_to_load2=items_to_load[items_to_load_key2];
                call_count++;
                (function(info_of_model_to_load,items_to_load_key) {
                process.nextTick(function ()
                {
                      var loaded_subitems={},items={};
                      //
                      retdata['item_name']                     = items_to_load_key;
                      retdata[items_to_load_key]              = _.clone(info_of_model_to_load.empty_object);
                      //
                      //sys.puts(sys.inspect(info_of_model_to_load))
                      retdata['error_name']                      = 'error_'       +items_to_load_key;
                      retdata['error_'      +items_to_load_key]   = null;
                      //
                      retdata['cursor_name']                     = 'cursor_'      +items_to_load_key;
                      retdata['cursor_'      +items_to_load_key]  = items;
                      //
                      if(info_of_model_to_load.load_one)
                      {
                       retdata['item_name']                      = items_to_load_key;
                       retdata[items_to_load_key]                = _.clone(info_of_model_to_load.model.empty_object);
                      }
                      //
                      if(info_of_model_to_load.askey)
                      {
                       var askey={};
                       //for(var i=0;i<items.length;i++)
                       //{
                       // askey[items[i]._id]=items[i];
                       //}
                       retdata['askey_name']                      = "askey_"+items_to_load_key;
                       retdata["askey_"+items_to_load_key]        = askey;
                      }
                      //
                      retdata['model_name']                       = 'model_'       +items_to_load_key;
                      retdata['model_'       +items_to_load_key]  = info_of_model_to_load.model;
                      //
                      retdata['sub_cursors_name']                 = 'sub_cursors_' +items_to_load_key;
                      retdata['sub_cursors_' +items_to_load_key]  = loaded_subitems;
                      //sys.puts(sys.inspect(   items ));
                      call_count--;  if(call_count==0)     callback();
                      //fs.readFile(__filename, group_slot);
                }); // next tick
                })(info_of_model_to_load2,items_to_load_key2);// subfunction
               }; // if has own
              } //for in

             call_count--;  if(call_count==0)     callback();
    };
    
    this.load_data= function(items_to_load,retdata,callback)
    {
             var call_count=1;


              for(var items_to_load_key2 in items_to_load)
              {
               if(items_to_load.hasOwnProperty(items_to_load_key2))
               {
                var info_of_model_to_load2=items_to_load[items_to_load_key2];
                call_count++;
                (function(info_of_model_to_load,items_to_load_key) {
                //sys.puts("top model---------------************************************");
                //sys.puts(sys.inspect(info_of_model_to_load,0));
                process.nextTick(function ()
                {
                 
                 if(items_to_load_key=='homepage' && info_of_model_to_load.where && ('_id' in info_of_model_to_load.where) && (!info_of_model_to_load.where['_id'])) // have _id but it is null or undefined
                 {
                  console.log("load where:--"+require('sys').inspect(info_of_model_to_load.where));
                  //info_of_model_to_load.load_subitems=false
                  //info_of_model_to_load.load_items=false;
                  //info_of_model_to_load.load_one=false;
                 }
                 
                 var loaded_subitems={},items={};
                 if(info_of_model_to_load.load_subitems && info_of_model_to_load.load_items)
                 { // multi load double
                  app.load_subitems( info_of_model_to_load.model , info_of_model_to_load.column_set , function (loaded_subitems)
                  {
                  info_of_model_to_load.model.select(info_of_model_to_load.where,function (cursor)
                  {
                  cursor.toArray(function(err, items)
                  {
                         //sys.puts("inner model1---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(info_of_model_to_load,0));
                         //
                         retdata['error_name']                      = 'error_'       +items_to_load_key;
                         retdata['error_'      +items_to_load_key]  = err;
                         //
                         if(info_of_model_to_load.fill_empty)
                         {
                          for(var i=0;i<items.length;i++)
                          {
                           _.add(items[i],info_of_model_to_load.empty_object);
                          }
                         }
                         //
                         retdata['cursor_name']                     = 'cursor_'      +items_to_load_key;
                         retdata['cursor_'      +items_to_load_key] = items;
                         //
                         if(info_of_model_to_load.load_one)
                         {
                          retdata['item_name']                      = items_to_load_key;
                          retdata[items_to_load_key]                = items.length>0?items[0]:_.clone(info_of_model_to_load.model.empty_object);
                         }
                         //
                         if(info_of_model_to_load.askey)
                         {
                          var askey={};
                          for(var i=0;i<items.length;i++)
                          {
                           askey[items[i]._id]=items[i];
                          }
                          retdata['askey_name']                      = "askey_"+items_to_load_key;
                          retdata["askey_"+items_to_load_key]        = askey;
                         }
                         //
                         if(info_of_model_to_load.asgroups)
                         {
                          var asgroups={},asgroupname=info_of_model_to_load.asgroups;
                          for(var i=0;i<items.length;i++)
                          {
                           var key=items[i][asgroupname];
                           if(! (key in asgroups)) asgroups[key]=[];
                           asgroups[key].push(items[i]);
                          }
                          retdata['asgroups_name']                      = "asgroups_"+items_to_load_key;
                          retdata["asgroups_"+items_to_load_key]        = asgroups;
                         }
                         //
                         retdata['model_name']                      = 'model_'       +items_to_load_key;
                         retdata['model_'       +items_to_load_key] = info_of_model_to_load.model;
                         //
                         retdata['sub_cursors_name']                = 'sub_cursors_' +items_to_load_key;
                         retdata['sub_cursors_' +items_to_load_key] = loaded_subitems;
                         //
                         //sys.puts(sys.inspect(   items ));
                         call_count--;  if(call_count==0)     callback();
                         //
                  });//toarray
                  });//select
                  });//subitems2
                 }
                 else if(info_of_model_to_load.load_subitems)
                 { // multi load
                   app.load_subitems( info_of_model_to_load.model , info_of_model_to_load.column_set , function (loaded_subitems)
                   {
                         //sys.puts("inner model2---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(info_of_model_to_load,0));
                         //sys.puts(sys.inspect(info_of_model_to_load))
                         retdata['error_name']                      = 'error_'       +items_to_load_key;
                         retdata['error_'      +items_to_load_key]  = null;
                         //
                         if(info_of_model_to_load.fill_empty)
                         {
                          for(var i=0;i<items.length;i++)
                          {
                           _.add(items[i],info_of_model_to_load.empty_object);
                          }
                         }
                         //
                         retdata['cursor_name']                     = 'cursor_'      +items_to_load_key;
                         retdata['cursor_'      +items_to_load_key] = items;
                         //
                         if(info_of_model_to_load.load_one)
                         {
                          retdata['item_name']                      = items_to_load_key;
                          retdata[items_to_load_key]                = items.length>0?items[0]:_.clone(info_of_model_to_load.model.empty_object);
                         }
                         //
                         if(info_of_model_to_load.askey)
                         {
                          var askey={};
                          //  for(var i=0;i<items.length;i++)
                          //  {
                          //   askey[items[i]._id]=items[i];
                          // }
                          retdata['askey_name']                      = "askey_"+items_to_load_key;
                          retdata["askey_"+items_to_load_key]        = askey;
                         }
                         //
                         if(info_of_model_to_load.asgroups)
                         {
                          var asgroups={},asgroupname=info_of_model_to_load.asgroups;
                          //for(var i=0;i<items.length;i++)
                         // {
                         //  if(! (items[i][asgroupname] in asgroups)) asgroups[items[i][asgroupname]]=[];
                         //  asgroups[items[i][asgroupname]].push(items[i]);
                         // }
                          retdata['asgroups_name']                      = "asgroups_"+items_to_load_key;
                          retdata["asgroups_"+items_to_load_key]        = asgroups;
                         }
                         //

                         //
                         retdata['model_name']                      = 'model_'       +items_to_load_key;
                         retdata['model_'       +items_to_load_key] = info_of_model_to_load.model;
                         //
                         retdata['sub_cursors_name']                = 'sub_cursors_' +items_to_load_key;
                         retdata['sub_cursors_' +items_to_load_key] = loaded_subitems;
                         sys.puts(sys.inspect(   loaded_subitems ));
                         call_count--;  if(call_count==0)     callback();
                         //
                   });//subitems2
                 }
                 else if(info_of_model_to_load.load_items || info_of_model_to_load.load_one)// load select
                 {
                   // single load 
                   info_of_model_to_load.model.select(info_of_model_to_load.where,function (cursor)
                   {
                   cursor.toArray(function(err, items)
                   {
                         //sys.puts("inner model3---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(info_of_model_to_load,0));
                         //sys.puts(sys.inspect(info_of_model_to_load))
                         retdata['error_name']                      = 'error_'       +items_to_load_key;
                         retdata['error_'      +items_to_load_key]  = err;
                         
                         if(info_of_model_to_load.fill_empty)
                         {
                          for(var i=0;i<items.length;i++)
                          {
                           _.add(items[i],info_of_model_to_load.empty_object);
                          }
                         }
                         
                         retdata['cursor_name']                     = 'cursor_'      +items_to_load_key;
                         retdata['cursor_'      +items_to_load_key] = items;
                                              
                         if(info_of_model_to_load.load_one)
                         {
                          retdata['item_name']                       = items_to_load_key;
                          retdata[items_to_load_key]                 = items.length>0?items[0]:_.clone(info_of_model_to_load.model.empty_object);
                         }
                         
                         //
                         if(info_of_model_to_load.askey)
                         {
                          var askey={};
                          for(var i=0;i<items.length;i++)
                          {
                           askey[items[i]._id]=items[i];
                          }
                          retdata['askey_name']                      = "askey_"+items_to_load_key;
                          retdata["askey_"+items_to_load_key]        = askey;
                         }
                         //
                         if(info_of_model_to_load.asgroups)
                         {
                          var asgroups={},asgroupname=info_of_model_to_load.asgroups;
                          for(var i=0;i<items.length;i++)
                          {
                           var key=items[i][asgroupname];
                           if(! (key in asgroups)) asgroups[key]=[];
                           asgroups[key].push(items[i]);
                          }
                          retdata['asgroups_name']                      = "asgroups_"+items_to_load_key;
                          retdata["asgroups_"+items_to_load_key]        = asgroups;
                         }
                         //
                         
                         retdata['model_name']                      = 'model_'       +items_to_load_key;
                         retdata['model_'       +items_to_load_key] = info_of_model_to_load.model;
                         
                         retdata['sub_cursors_name']                = 'sub_cursors_' +items_to_load_key;
                         retdata['sub_cursors_' +items_to_load_key] = {};//loaded_subitems;
                         //sys.puts("inner retdata3---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(retdata,0));
                         //sys.puts(sys.inspect(   items ));
                         call_count--;  if(call_count==0)     callback();
                         //
                   });//toarray
                   });//select
                 }
                 else // return empty row /  rows
                 {
                         //sys.puts("inner model3---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(info_of_model_to_load,0));
                         //sys.puts(sys.inspect(info_of_model_to_load))
                         retdata['error_name']                      = 'error_'       +items_to_load_key;
                         retdata['error_'      +items_to_load_key]  = null;
                         
                         retdata['cursor_name']                     = 'cursor_'      +items_to_load_key;
                         retdata['cursor_'      +items_to_load_key] = [];
                                              
                         if(info_of_model_to_load.load_one)
                         {
                          retdata['item_name']                       = items_to_load_key;
                          retdata[items_to_load_key]                 = _.clone(info_of_model_to_load.model.empty_object);
                         }
                         
                         //
                         if(info_of_model_to_load.askey)
                         {
                          var askey={};
                          retdata['askey_name']                      = "askey_"+items_to_load_key;
                          retdata["askey_"+items_to_load_key]        = askey;
                         }
                         //
                         if(info_of_model_to_load.asgroups)
                         {
                          var asgroups={};
                          retdata['asgroups_name']                      = "asgroups_"+items_to_load_key;
                          retdata["asgroups_"+items_to_load_key]        = asgroups;
                         }
                         //
                         
                         retdata['model_name']                      = 'model_'       +items_to_load_key;
                         retdata['model_'       +items_to_load_key] = info_of_model_to_load.model;
                         
                         retdata['sub_cursors_name']                = 'sub_cursors_' +items_to_load_key;
                         retdata['sub_cursors_' +items_to_load_key] = {};
                         //sys.puts("inner retdata3---------------+++++++++++++++++++++++++++++++++");
                         //sys.puts(sys.inspect(retdata,0));
                         //sys.puts(sys.inspect(   items ));
                         call_count--;  if(call_count==0)     callback();
                         //
                 }
                 //fs.readFile(__filename, group_slot);

                }); // next tick
                })(info_of_model_to_load2,items_to_load_key2);// subfunction
               }; // if has own
              } //for in
          call_count--;  if(call_count==0)     callback();
       
    };
    
    this.load_subitems = function (main_model,operation,callback)
    {        //shoud i add static support ? app.load_subitems( page.model , 'static/cached/on change of a specific model(onchange is multi process unsupported)') ? <<should i add this later? 
     if(main_model.prep_subitems[operation].length==0)callback({});
     //sys.puts(main_model.modelname+','+operation);
     //sys.puts(main_model.modelname+"|"+operation+"| "+sys.inspect(main_model.prep_subitems[operation]));     
     var arrselections=_.cloneuptolevel(main_model.prep_subitems[operation],2)
     app.step(
      function ()
      {
       //sys.puts('start get items for a all sub items collection');
       var new_group = this.group();
       //sys.puts(sys.inspect(arrselections,false,1));
       arrselections.forEach(function (selection,i,arr)
       //for(var i=0,l=arrselections.length;i<l;i++)
       {
        //sys.puts('start get items for a subitem collection '+selection.fieldname);
        var ret_group=new_group(); // add + 1 count to wait for results list
        //sys.puts('select sub items: selections.'+selection.fieldname+'.fieldname = '+selection.fieldname);
        if(!selection.where)selection.where=null;
     
        selection.submodel.select(selection.where,function (cursor)
        {
         try{
//          sys.puts('ret list' + sys.inspect(cursor));
         cursor.toArray(function(err, items)
         {
          ///sys.puts('recevied array');
          //sys.puts('received subitems '+selection.fieldname);
          //sys.puts(sys.inspect(items));
          selection.cursor=items;
          ret_group(null,true); 
         });
         }
         catch(e)
         {
          //sys.puts('error in load_subitems');
          //(new_group())(null,true);
          ret_group(null,false);
         }
         
        });
        
       });
       //sys.puts('step 100');
       //this.next();
      },
      function (err, contents)
      {   //     sys.puts('end');
       //if(err)
       // sys.puts('step 200 ='+err);
       //else 
       // sys.puts('step 200 ='+contents);
       err=null;
       //sys.puts(sys.inspect(arrselections))
       var byfield={};
       for(var i=0,l=arrselections.length;i<l;i++)
        byfield[arrselections[i].fieldname]=arrselections[i];
       //if (err) { throw err; }
       arrselections=null;
       callback(byfield);
       
      }
     );
    }
     
    this.defaultfield= 
      {
      
       collections_meshup:        {},
       
       general:        { title : 'id', ftype : 'string', size : '20',  primerykey : false, page : 1, autoupdatevalue : null, /* initial value */ },
       list:           { use: true, agregate : null, width : null, ftype: 'text' /* text / image */, wrap : true, quicksearch: true, extsearch: false, tempalte:null /* null or custom template function or file name etc */, },
       view:           { use: true, title: null,                   ftype: 'text' /* text / image */, },
       edit:           { use: true, title: null, readonly:false,   ftype: 'text' /* text / date / password / radio / checkbox / select / textarea / html / file / hidden */, },
       add:            { use: true, /*default_value: '',*/ },
       multiupdate:    { use: true, },
       advancedsearch: { use: true, operator1: 'like', operator2:'like', /*  user select / > / < / >= / <= / between / like / not like / starts with / ends with */ tempalte:null /* null or custom template function orfile name etc */, },
       viewtag:        {
       
        div:   { use:false, bold: false, italic : false, align: 'right', /* right / left / center */ direction: '',  /* '' / ltr / rtl */   attributes: '' /* right / left / center */,  lookup: null,  },
        image: { height: 0, width: 0, resize: false, alt:'', align: 'right', /* right / left / center */ attributes: '',  lookup: null, },
        link:  { prefix: '', suffix: '', herffield: "", /* name of a field */ originalvalue: false,  lookup: null, },

        text:      { size: 30, maxlength: null, attributes: '', lookup: null, }, 
        password:  { size: 30, maxlength: null, attributes: '', }, 
        radio:     { attributes: '', lookup: null, }, 
        checkbox:  { attributes: '', lookup: null, },
        select:    { size: 1,  multiple : false, attributes: '', lookup: null, }, 
        textarea:  { cols: 48,  rows: 4, attributes: '', },
        html:      { cols: 48,  rows: 4, attributes: '', }, 
        date:     { cols: 48,  rows: 4, attributes: '', },
        file:      { size: 30, attributes: '', resizeimage: false, resizeheight: 0, resizewidth: 0, resizetype: 'jpg', /* jpg / png*/ }, 
        hidden:    { customvalue: '', attributes: '', },
        validation:{ validate: false, type:'' /* date/phone... */, regex:'', required:false,  errormessage: '', /* addition to error mesage */ userfunc:app.defaultvalidation, },
        lookup:    { sameasedit:false, values: {}, /* key-value object array */ usetable: false, tablename: '', linkedfield: '', displayfield: '', displayfield2: '', orderby: '', ascdesc: '', /* '' / asc / desc */ filter: '', distinct: false, filterfield: '', parentfield: '', },
        tempalte:false /* null or custom template function or file name etc */,
       },
       edittag:        {
        text:      { size: 30, maxlength: null, attributes: '', lookup: false, }, 
        password:  { size: 30, maxlength: null, attributes: '', }, 
        radio:     { attributes: '', lookup: false, }, 
        checkbox:  { attributes: '', lookup: false, },
        select:    { size: 1,  multiple : false, attributes: '', lookup: false, }, 
        textarea:  { cols: 48,  rows: 4, attributes: '', },
        html:      { cols: 48,  rows: 4, attributes: '', },
        date:     { cols: 48,  rows: 4, attributes: '', }, 
        file:      { size: 30, attributes: '', resizeimage: false, resizeheight: 0, resizewidth: 0, resizetype: 'jpg', /* jpg / png*/ }, 
        hidden:    { customvalue: '', attributes: '', },
        validation:{ validate: false, type:'' /* date/phone... */, regex:'', required:false,  errormessage: '', /* addition to error mesage */ userfunc:app.defaultvalidation, },
        lookup:    {                   values: {}, /* key-value object array */ usetable: false, tablename: '', linkedfield: '', displayfield: '', displayfield2: '', orderby: '', ascdesc: '', /* '' / asc / desc */ filter: '', distinct: false, filterfield: '', parentfield: '', },
        tempalte:false /* null or custom template function or file name etc */,
       },
      }  /* end field */; 
     

    this.basicfields=
    {
      _id:     _.cloneextend(app.defaultfield,{general:{title : 'id', pimerykey:true, ftype : 'number'},add:{use:false},edit:{use:false,readonly:true}}) ,
      normal: _.cloneextend(app.defaultfield,{general:{}}),
    };
    this.basicfields.textarea = _.cloneextend(app.basicfields.normal, { edit:{ftype:'textarea'}});
    this.basicfields.html     = _.cloneextend(app.basicfields.normal, { edit:{ftype:'html'}});
    this.basicfields.date     = _.cloneextend(app.basicfields.normal, { edit:{ ftype:'date'}});
    this.basicfields.number   = _.cloneextend(app.basicfields.normal, { edittag: { validation: { validate: false, type: 'number'} }, general: { ftype: 'number'} });
    this.basicfields.lookup   = _.cloneextend(app.basicfields.normal, { edit: { ftype: 'select' }, edittag: { select: { lookup: true }, lookup: { usetable: true}} });
    this.basicfields.keyvalue = _.cloneextend(app.basicfields.normal, { edit: { ftype: 'select' }, edittag: { select: { lookup: true }, lookup: { usetable: false}} });
    this.basicfields.file     = _.cloneextend(app.basicfields.normal, { edit: { ftype: 'file' } });

    this.path_exists={};    
    this.mkdir_cached=function (wantedpath,callback)
    {
     if(app.path_exists[wantedpath])callback();
     app.path.exists(wantedpath,
     function (wantedpath_exists)
     {
      if(!wantedpath_exists)
      {
       fs.mkdir(wantedpath, 0777, function (err)
       {
        if(err) throw err; 
        callback();
       });
      }
      else
      {
       app.path_exists[wantedpath]=true;
       callback();
      }
     });
    }
    
    this.mkdir=function (wantedpath,callback)
    {
     app.path.exists(wantedpath,
     function (wantedpath_exists)
     {
      if(!wantedpath_exists)
      {
       fs.mkdir(wantedpath, 0777, function (err)
       {
        if(err) throw err; 
        callback();
       });
      }
      else
      {
       callback();
      }
     });
    }
           
    
    this.basicmodel=
    {
     modelname:"set in serving.js",
     collection:null, //handle to main mongodb collection
     links:[], //handle to main mongodb collection
     empty_object:{},
     general:
     {
      urlprefix:'model',
      use:true,
      name:'list',
      load_collections:[], //names of mongodb collection to also load
      title:'List',
      filter: null,
      sort: null,
      main: false,
      menu_item: true,
     },
     list:
     {
      use:false,
      inline_add:false,
      inline_copy:false,
      inline_edit:false,
      grid_edit:false,
      must_search:false,
     },
     view:
     {
      use:false,
     },
     add:
     {
      add:true,
      copy:false,
      captcha:false,
      confirm:false,
     },
     del:
     {
      use:false,
      confirm:true,
     },
     edit:
     {
      edit:true,
      confirm:false,
     },
     multiupdate:
     {
      use:false,
      confirm:true,
     },
     search:
     {
      quick:true,
      advanced:false,
      hightlight:false,
     },
     audit:
     {
      use:false,
     },
     email:
     {
      onadd:false,
      onedit:false,
      ondelete:false,
     },
     fields:
     {
     },

     save: function( data , callback)
     {
      var that=this;
    	this.preprocess_document(data , data._id!=null,function (data2){
     	  that.collection.save(data2 ,function(err , result){
    		 callback(result);
    	  });       
      });

     },   

     insert: function( data ,callback )
     {
      var that=this;
      this.preprocess_document(data , true,function (data2)
      {
       that.collection.insert(data2,function (err,doc)
       {
        //console.log("removed:"+sys.inspect(doc));
        if(err) throw err;
        //sys.puts('sucsess');
        //sys.puts(JSON.stringify(doc) );
        if(callback) callback(doc);
       });
      });
     },
     
     remove: function( where, callback )
     {
      // delete files here
      this.collection.remove( where, function (err,data)
      {
       console.log("removed:"+sys.inspect(data));
       if(err) throw err;
       //var callback_count=0;
       // callback_count++;
 
       var model = this;
       console.log("doc in delete:"+sys.inspect(data));
       for(var x in model.fields)
       {
        if( model.fields.hasOwnProperty( x))
        {
         var field = model.fields[x];
         //console.log(sys.inspect(field.edit));
         //console.log(sys.inspect(field.general.title));
         //console.log(sys.inspect(data.x));
         if(field.edit.ftype==='file') // delete files
         {
          if (x in data )
          {
           if('path' in data[x] && data[x].path!='')
           {
            var filetodelete=app.files_path+data[x].path;
              //delete data[x];
            //callback_count++;
            path.exists(filetodelete,function(exists)
            {
             fs.unlink(filetodelete, function (){
              // callback_count--;
              // if(callback_count==0)
              //  callback(data);
             });
            });
           }
          }//if x in data
         }//end of: if ( field.edit.ftype==='file' ) //
        }//if has own
       }//for fileds
       
       //callback_count--;
       //if(callback_count==0)
       // callback(data);
       
       //sys.puts('sucsess');
       //sys.puts(JSON.stringify(doc) );
      });
      if(callback) callback();
     },
     
     update: function( where, data ,callback )
     {
      var that=this;
      this.preprocess_document(data , false,function (data2)
      {
       //sys.puts(sys.inspect([where,data]));
       that.collection.update(where,{'$set':data2},function (err,doc)
       {
        if(err) throw err;
        //sys.puts('sucsess');
        //sys.puts(JSON.stringify(doc) );
        if(callback) callback(doc);
       });
      });
     },
     updatedoc: function( where, data ,callback )
     {
      var that=this;
      this.preprocess_document(data , false,function (data2)
      {
       //sys.puts(sys.inspect([where,data]));
       that.collection.update(where,data2,function (err,doc)
       {
        if(err) throw err;
        //sys.puts('sucsess');
        //sys.puts(JSON.stringify(doc) );
        if(callback) callback(doc);
       });
      });
     },
 /*  multiupdate: function( where ) { },
     report:      function( where ) { },
     search:      function( where ) { },
     onview:      function( where ) { },   */
     preprocess_document: function(data , add, callback)
     {
      var callback_count=0;
      callback_count++;
      
      var model = this;
      //console.log(sys.inspect(data));
      
      if('_id' in data && typeof data['_id']==='string')
      {
       if(data['_id']=='')
       {
        if(add) delete data['_id'];   
       }
       else 
       {
        data['_id']=app.ObjectID.createFromHexString(data['_id']); 
       }
      }
        
      for(var x in model.fields)
      {
       if( model.fields.hasOwnProperty( x))
       {
        var field = model.fields[x];
        //console.log(sys.inspect(field.edit));
        //console.log(sys.inspect(field.general.title));
        //console.log(sys.inspect(data.x));
        //every time especialy on update

        if(field.edit.ftype==='select' && 
           field.edittag.lookup.usetable && 
           field.edittag.lookup.linkedfield=='_id')
        {
         if (x in data && typeof data[x]==='string')
         {
          if(data[x]=='')
          {
           delete data[x];   
          }
          else        
          {
           data[x]=app.ObjectID.createFromHexString(data[x]); 
          }
         }
        }

        if(field.edit.ftype==='file')
        {
         if (x in data ) //&& typeof data[x]==='object'
         {
          var action;
          action = 'replace';
          if('action' in data[x]) { action=data[x]['action']; } // keep strategy
          if(action == 'keep')
          {
           if('value' in data[x]) // keep strategy
           {
            //console.log("the value="+data[x]['value']);
            data[x]=JSON.parse(data[x]['value']);
           }
          }
          else if(action == 'delete')
          {
           if((x in data) && ('value' in data[x]))// delete file
           {
            var value=false;
            try{value==JSON.parse(data[x]['value']);} catch (e) {console.log(e.stack);}
            if(value!==false)
            data[x]=value;
            if('path' in data[x] && data[x].path!='')
            {
             var filetodelete=app.files_path+data[x].path;
             delete data[x];
             callback_count++;
             path.exists(filetodelete,function(exists)
             {
              fs.unlink(filetodelete, function (){
                callback_count--;
                if(callback_count==0)
                 callback(data);
              });
             });
            }
           }// end delete file
          }
          else if(action == 'replace')
          {
           callback_count++;
          
           if((x in data) && ('value' in data[x]))// delete file
           {
            var value=false;
            try{value=JSON.parse(data[x]['value']);} catch (e) {console.log(e.stack);}            
            if( value!==false && ('path' in value) && value.path!='')
            {
             var filetodelete=app.files_path+value.path;
             //delete data[x];
             callback_count++;
             path.exists(filetodelete,function(exists)
             {
              //console.log("file raplace - delete : \r\n"+filetodelete+"\r\n"+sys.inspect(value));
              fs.unlink(filetodelete, function (){
                callback_count--;
                if(callback_count==0)
                 callback(data);
              });
             });
            }
           }// end delete file
           
           //console.log("file raplace: \r\n"+sys.inspect(data)); // instead of value i need to load all data from database.
           var filepath = data[x]['upload']['path'];
           //console.log(sys.inspect(data[x]));
           filepath_basename=filepath.substring(filepath.lastIndexOf('/')+1,filepath.length);
           
           var newpath1=app.files_path+model.modelname;
           var newpath2=app.files_path+model.modelname+'/'+x;
           
           var newpath =app.files_path+model.modelname+'/'+x+'/'+filepath_basename;
           var dbpath =model.modelname+'/'+x+'/'+filepath_basename;
           
           //create folders
           //move file
           //update data
           data[x]=
           {
            mime:data[x]['upload']['mime'],
            filename:data[x]['upload']['filename'],
            path:dbpath
            /*,meta:data[x]['file']['meta']*/
           };
           

           app.mkdir_cached(newpath1, function ()
           {
            app.mkdir_cached(newpath2, function ()
            {
             fs.rename(filepath, newpath, function (err)
             {
              if(err)throw err;
              callback_count--;
              if(callback_count==0)
               callback(data);
             });
            });
           });
          }//if replace
         }//if x in data
        }//end of: if ( field.edit.ftype==='file' ) //
        
        if(field.general.ftype==='date')
        {
         if (x in data && typeof data[x]==='string' && data[x]!='')
         {
          data[x]=app.phpjs.strtotime(data[x]); 
         }
         else
         {
          delete data[x];   
         }
        }
        
        // on add
        if(add)
        {
         if ('default_value' in field.add)
         {
          data[x]=field.add.default_value;
         }
        }
       }//if
      }//for
      callback_count--;
      if(callback_count==0)
       callback(data);
     },
     select: function(where , callback ) // skip(4).limit(8);
     {
    //http://www.slideshare.net/kbanker/mongodb-schema-design-mongony
     
	  // http://www.mongodb.org/display/DOCS/Querying
	  // http://www.mongodb.org/display/DOCS/Queries+and+Cursors
	  // http://www.mongodb.org/display/DOCS/Advanced+Queries
	  // http://www.mongodb.org/display/DOCS/Optimization
		 
	  // to joins replace this method with something like db.runCommand((function () { mongodbcode }).toSource )
	  // http://github.com/mongodb/mongo/blob/master/jstests/mr1.js
	  // http://github.com/mongodb/mongo/blob/master/jstests/mr2.js 
	  // http://www.mongodb.org/display/DOCS/MapReduce
	  // http://www.mongodb.org/display/DOCS/Aggregation
	  // http://rickosborne.org/blog/index.php/2010/02/09/infographic-migrating-from-sql-to-mapreduce-with-mongodb/
	  // http://rickosborne.org/download/SQL-to-MongoDB.pdf
	  // http://rickosborne.org/blog/index.php/2010/02/08/playing-around-with-mongodb-and-mapreduce-functions/
		 
		  if(!where)
      {
       this.collection.find(
       function(err, cursor)
       {
        if(err) throw err;
        else 
        {
         if(callback) callback(cursor);
        }
       });
      }
      else
      {
       this.collection.find(where,
       function(err, cursor)
       {
        if(err) throw err;
        else 
        {
         if(callback) callback(cursor);
        }
       });
      }
      // iterating thru cursor:
      //  cursor.each(function(err, item) {
      //    if(item != null) sys.puts(sys.inspect(item));
      //  });

     },
     getall: function(where , callback)
     {
      this.select(where,function (cursor)
      {
       cursor.toArray(function(err, items)
       {
        callback(items);
       });
      });
     }
     ,
     getallaskey: function(where , callback)
     {
      this.select(where,function (cursor)
      {
       cursor.toArray(function(err, items)
       {
        var askey={};
        for(var i=0;i<items.length;i++)
        {
         askey[items[i]._id]=items[i];
        }
        callback(askey);
       });
      });
     }
     ,
     addpages: function (callback)
     {
      var p,tempalte_name,template_function;
      for(p in this.pages)
      {
       var page=this.pages[p];
       //add .model reference to page
       page.model=this;
       //if(this.modelname=='t1_organization')  console.log(" addpages page "+p);      
       app.load_templates(page);
      }
      if(callback)callback(callback);
     },
     addurls: function (callback)
     {
      var p;
      // adlater calling route before, route after
      for(p in this.pages)
      {
       var pageurl='/'+this.general.urlprefix+this.pages[p].pageurl;
       
       //app.url_routes.push({path:pageurl,code:function(req,res,page,callback){res.writeHead(200, { 'Content-Type': 'text/plain'});res.write('hello world');res.end();}});
       app.url_routes.push({path:pageurl,page:this.pages[p]});
      }

      if(callback)callback(callback);
     },
     setupfirst: function( data )
     {

     },
     setup: function( data )
     {

     },
     setuplast: function( data )
     {
      app.prepare_subitems_lists(this);
      var self = this;
      _.foreach(this.fields , function(field , field_key){
    	  self.empty_object[field_key] = '';
      });
      this.addpages();
      this.addurls();
     },
     pages:
     {
      list:require('templates/default/list').page.call(this,app,this), 
      add:require('templates/default/add').page.call(this,app,this), 
      edit:require('templates/default/edit').page.call(this,app,this), 
      del:require('templates/default/del').page.call(this,app,this), 
     },
     
        
     
    };
    
  this.pages=
  {
   admin           :require('templates/default/default').page.call(this,this), 
   website_default :require('templates/website/default').page.call(this,this), 
   favicon         :require('cachedfile_page'  ).page.call(this,this,'favicon.ico','favicon.ico'), 
   jquery          :require('cachedfolder_page').page.call(this,this,'lib/jquery','deps/jquery',false,/(^development-bundle)|jquery-validate\\lib|demo/),
   ckeditor        :require('cachedfolder_page').page.call(this,this,'lib/ckeditor','deps/ckeditor',/\.(js|html|gif|png|jpg|ico|css)$/,/(^\.)|(^_)|(\.\/)|(\.svn)/),
   slickgrid       :require('cachedfolder_page').page.call(this,this,'lib/slickgrid','deps/SlickGrid',/\.(js|html|gif|png|jpg|ico|css)$/,/MIT-LICENSE.txt|tests|build|\.git/),
  
  };
  
  this.setuppages=function (callback)
  {
   var p,tempalte_name,template_function;
   for(p in this.pages)
   {
    if(this.pages.hasOwnProperty(p) )
    {
     var page=this.pages[p];
     //add .model reference to page
     app.load_templates(page);
    }
   }
   // adlater calling route before, route after
   for(p in this.pages)
   {
    if(this.pages.hasOwnProperty(p) )
    {
     var pageurl='/'+this.pages[p].pageurl;
     var amatch={page:this.pages[p]};
     if(this.pages[p].urlmatch)
     {
      //sys.puts(this.pages[p].urlmatch+"="+pageurl);
      amatch[this.pages[p].urlmatch]=pageurl;
     }
     else
      amatch['path']=pageurl;
     //app.url_routes.push({path:pageurl,code:function(req,res,page,request_i){res.writeHead(200, { 'Content-Type': 'text/plain'});res.write('hello world');res.end();}});
     app.url_routes.push(amatch);
    }
   }
   
   //add some more other non page routes
   app.url_routes.push({path:'/exit',code:function(req,res,page,request_i){res.writeHead(200, { 'Content-Type': 'text/plain'});res.write('exit');res.end();process.nextTick(function () {process.exit();});}});
   
   if(callback)callback(callback);
  }
   
  this.watchpage = function (pagename,filename)
  {
   var watch_arr=[];
   for(k in app.pages[pagename].load_templates)
   {
    if(app.pages[pagename].load_templates.hasOwnProperty (k))
    {
     watch_arr.push('templates/'+app.pages[pagename].load_templates[k]);
    }
   }
   watch_arr.push(filename);

   autoreload.watchrel(watch_arr,filename, function (newmodule)
   {
    var oldpage=app.pages[pagename];
    var page=newmodule.page.apply(oldpage.pagethis?oldpage.pagethis:app,oldpage.pagearguments?oldpage.pagearguments:[app]);
    app.load_templates(page,function ()
    {
    
     app.pages[pagename]=page; // update main page reference
     
     for(var i=0;i<app.url_routes.length;i++) // serch routes and update routes
     {
      if(app.url_routes[i].page)
      if(app.url_routes[i].page.pagefilename==oldpage.pagefilename)
      {
       app.url_routes[i].page=page;
       /*
       if(oldpage.urlmatch)
        delete app.url_routes[i][oldpage.urlmatch];
       else 
        delete app.url_routes[i]['path'];

       if(page.urlmatch)
        app.url_routes[i][page.urlmatch]=page.pageurl;
       else
        app.url_routes[i]['path']=page.pageurl;
        */
       console.log( (new Date).toTimeString() + ' page ' + i + ' reloaded ' + filename );
      }
     }
    }); 
    // route update here
   }); 
  }
  
}

var app = new App();
this.app = app;

   autoreload.watchrel("httputils.js", function (newmodule)
   {
    app.httputils=newmodule;
   });