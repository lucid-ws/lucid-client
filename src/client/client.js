"use strict";

const WebSocket = require("ws");
const InternalClient = require("./internal-client");
const EventEmitter = require("events").EventEmitter;

class LucidClient extends EventEmitter{
	constructor(url, options, callback){
		
		super();
		
		this.url = url;
		this.options = options;
		this.wait_callback = callback || function(err){};
		this.authenticated = false;
		this.internal = new InternalClient(null, this);
		
	}
	
	sendRaw(raw){
		this.internal.sendRaw(raw);
	}
	
	send(type, data){
		this.internal.send({
			t : type,
			d : data
		})
	}
}

module.exports = LucidClient;