var client;

module.exports = client = require("./client/client");

if(window){
	window.LucidClient = client;
}