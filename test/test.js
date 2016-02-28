"use strict";

const LucidClient = require("../");

var client = new LucidClient({url:"127.0.0.1", port:25543}, function(err){
	if(err){
		console.log("Couldn't start!");
	}else{
		console.log("Connected! Here is some info:");
		console.log(client.connectionMeta);
	}
});