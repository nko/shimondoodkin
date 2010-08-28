var expat = require('./build/default/node-expat');

// this is a very simple object parser 
// related link: stream parser: http://github.com/astro/node-xmpp/blob/master/lib/xmpp/connection.js
// related link: html parser:   http://github.com/bmeck/Witch/blob/master/parser/html/index.js

// usage
// var expat = require('./deps/node-expat');
//
// var parser=expat.parset(); // new instance of parser 
// parser.parser.parse( data, false ); 
// parser.root.children['html'][0].text
// parser.root.children['html'][0].children['body'].att['bgcolor'];
// parser.root.children['html'][0].children['head'][0].children['media'].att['title'];
// parser.root.children['html'][0].children['head'][0].nschildren['fb:media'].att['title'];
// 
 

function Parser(ignore_ns,charset)
{
 var self = this;
 self.addns=(ignore_ns==true);
 self.onfinish=function () { };
  
 if(!charset)self.charset="UTF-8";
 function reset()
 {
  self.root=null;
  self.root=self.addns?{parent:null,children:[],attrs:[],nschildren:[],nsattrs:[]}: {parent:null,children:[],attrs:[]};
  self.ns={};
  self.element = null;
 }self.reset=reset;

 function removeparent() //this allows serializing.
 { 
  // after doind this , this onject probably can't parse anymore
  //tobedone
 }this.removeparent=removeparent;
 
 function xpath(element) //this allows search.
 {
  //tobedone
 }self.xpath=xpath;
 
 self.clean=clean;
 self.element = null;
 self.root=self.addns?{parent:false,children:[],attrs:[],nschildren:[],nsattrs:[]}: {parent:null,children:[],attrs:[]};
 self.parser = new expat.Parser(self.charset);
 self.parser.addListener('startElement', function(name, attrs)
 {
  //first child might contain ns elements
  if (self.element===null)
  {
   self.ns = {};
   for(var k in attrs)
   {
    if(attrs.hasOwnProperty(key))
    {
     if (k == 'xmlns' || k.substr(0, 6) == 'xmlns:') self.ns[k] = attrs[k];
    }
   }
   self.element=self.root
  }

  var smicpos,nk;
  
  for(var k in attrs)
  {
   nk=k;
   if(attrs.hasOwnProperty(key))
   {
    smicpos=k.indexOf(':'); if(smicpos>0) nk=k.substring(smicpos+1,k.length);
    self.element.att[nk] = attrs[k];
    if(self.addns)self.element.nsatt[k] = attrs[k];
   }
  }
  
  nk=name;
  smicpos=name.indexOf(':'); if(smicpos>0) nk=name.substring(smicpos+1,k.length);
  //if(!self.element[name])self.element[name]=[];
  var el=elf.addns? {parent:null,children:[],attrs:[],nschildren:[],nsattrs:[]} : {parent:null,children:[],attrs:[]};
  
  self.element.nschildren[name].push(el);
  if(self.addns)self.element.children[nk].push(el);  
  self.element=el;
 });
 
 self.parser.addListener('endElement', function(name, attrs)
 {
  if (self.element.parent)
  {
   self.element=self.element.parent;
  }
  else if(self.onfinish)
  {
   self.onfinish();
  }
 });
 
 self.parser.addListener('text', function(str)
 {
  if (self.element) self.element.text=str;
 });
 return parser;
}; this.parser=Parser;
