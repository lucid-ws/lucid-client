"use strict";

const LucidClient = require("../");

var client = new LucidClient({address:"127.0.0.1", port:25543}, function(err){
	if(err){
		console.log("Couldn't start!");
		throw err;
	}else{
		console.log("Connected! Here is some info:");
		console.log(client.connectionMeta);
	}
});

client.on("raw", data => console.log(data));