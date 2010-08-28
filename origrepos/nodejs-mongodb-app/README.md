## The idea:
the idea is to create somthing similar to hkvstore.com's Phpmaker or Aspmaker or Microsoft Dot.NET 3 sp1 DynamicData application.

an application runtime generation framework. to generate nodejs+mongodb(+nginx) applications.
in those modes of development you configure the data models, and all else is kind of, 
generated or code reused, 
to allow to create data managment web application quickly and easyly with very little effort.

## Functional application structure:

   '- server
      |- app skeleton      // creates an app object
      |- app modules files // extends the app object with models and functions (duplicates predefined objects and modifies them)
      '- serving           // extends the app object with routing, http serving functionality and initialization logic.

The first idea about application structure was:
the application is a single aplication but i can be defined in several moduls.

now i find it hard to implement everything i shared objects.

## Logical app object model:
   '- application
      |- shared models
      |- shared templates of pages
      |- shared functions of pages
      '- shared urls

###the same in words:
a module extends the application's shared objects.
shared means shared between all moduls in the application. 
a module contains aapplication definition code.
application definition can be spread between many moduls for convinience


I plan you'll be able to define a model in a module, then call kind of  a macro function 
that adds all (edit,add,delete,list) functions and templates and urls to the application 
as defined by that model.
also you can define all those by your self so you can make custom pages.

## templates system:
what is good about phpmaker is that it allows you easyly define an application,
what is good in dot net DynamicData is that the templates are like components.
in templates you have: fields/textfiled.html, paritials/grid.html, pages/list.html 
at 1st all files composed together. later it is used as template.

a problem: i have models and by a model i prepeare a template. so i have to invet how it all will possible to work.

## links:

http://www.asp.net/dynamicdata

http://www.hkvstore.com/phpmaker/

