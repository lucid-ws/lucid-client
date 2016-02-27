"use strict";

const LucidClient = require("../");

var client = new LucidClient("ws://127.0.0.1:25543", null, function(err){
	if(err){
		console.log("Couldn't start!");
		throw err;
	}else{
		console.log("ready!");
	}
});