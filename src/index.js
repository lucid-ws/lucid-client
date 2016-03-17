require("babel-polyfill");
var client;

var window = window || false;

module.exports = client = require("./client/client");

if(window){
	window.LucidClient = client;
}