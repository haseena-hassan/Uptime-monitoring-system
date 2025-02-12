/*Description : Primary file for the API
 *Author : haseena-hassan
 *Date : 12/09/19
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./lib/config');
var fs = require('fs');
var _data = require('./lib/data');
var handlers = require('./lib/handlers');
var helpers = require('./lib/helpers')




//TESTING
// @TODO delete this
// _data.create('test','newFile', {'foo' : 'bar'}, function(err){
//   console.log('This is the err called back : ',err);
// });
// _data.read('test','newFile', function(err,data){
//   console.log('This is the err called back : ',err, ' and this is the data read : ',data);
// });
// _data.update('test', 'newFile', {'fizz':'buzz'}, function(err){
//   console.log('This is the err called back : ',err);
// });
// _data.delete('test', 'newFile', function(err){
//   console.log('This is the err called back : ',err);
//});







 // Instantiate the HTTP server
var httpServer = http.createServer(function(req,res){
  unifiedServer(req,res);
});

// Start the HTTP server
httpServer.listen(config.httpPort,function(){
  console.log('The HTTP server is running on port '+config.httpPort);
});

// Instantiate the HTTPS server
var httpsServerOptions = {
  'key': fs.readFileSync('./https/key.pem'),
  'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req,res);
});

// Start the HTTPS server
httpsServer.listen(config.httpsPort,function(){
 console.log('The HTTPS server is running on port '+config.httpsPort);
});

// All the server logic for both the http and https server
var unifiedServer = function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function(data) {
    buffer += decoder.write(data);
  });

  req.on('end', function() {
    
    buffer += decoder.end();

    // Check the router for a matching path for a handler. If one is not found, use the notFound handler instead.
    var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

    // Construct the data object to send to the handler
    var data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryStringObject,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)        //make sure that payload coming to the handler isnt just raw buffer but actually the parsed json data
    };

    // Route the request to the handler specified in the router
    chosenHandler(data,function(statusCode,payload){

      // Use the status code returned from the handler, or set the default status code to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use the payload returned from the handler, or set the default payload to an empty object
      payload = typeof(payload) == 'object'? payload : {};

      // Convert the payload to a string
      var payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader('Content-Type','application/json');     //sending key-value pair to tell browser that we are sending content of type json
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("Returning this response: ",statusCode,payloadString);

    });
  });

};


// Define the request router
var router = {
  'ping' : handlers.ping,
  'users' : handlers.users,
  'tokens' : handlers.tokens
};