"use strict";

const WebSocket = require("ws");
const InternalClient = require("./internal-client");
const InternalRequester = require("./internal-requester");
const EventEmitter = require("events").EventEmitter;

class LucidClient extends EventEmitter{
	constructor(options, callback){

		super();

		this.options = options;
		this.wait_callback = callback || function(err){};
		this.authenticated = false;
		this.token = null;

		this.api = new InternalRequester(this);

		this.api
			._get("/meta")
			.end((err, res) => {
				if(err){
					callback(err);
					try{
						this.emit("error", err);
					}catch(e){
						// required so that node doesn't throw an error
					}

					this.emit("nostart");
				}else{
					this.connectionMeta = res.body;
					this.internal = new InternalClient(null, this);
				}
			});

	}

	get uuid(){
		return this.token;
	}

	sendRaw(raw){
		this.internal.sendRaw(raw);
	}

	send(type, data){
		this.internal.send({
			t : "custom_"+type,
			d : data
		});
	}

	disconnect(reason, code, extra){
		this.internal.disconnect(reason, code, extra);
	}
}

module.exports = LucidClient;