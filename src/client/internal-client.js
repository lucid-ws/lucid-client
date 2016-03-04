"use strict";

const NWebSocket = require("ws");
const protocol_v = "alpha2";

class LucidInternalClient{

	constructor(options, wrapper){
		if(window && window.WebSocket)
			this.ws = new window.WebSocket(`ws://${wrapper.options.url}:${wrapper.connectionMeta.wss_port}`);
		else
			this.ws = new NWebSocket(`ws://${wrapper.options.url}:${wrapper.connectionMeta.wss_port}`);
		this.wrapper = wrapper;
		this.options = options;

		this.intervals = [];

		this.temp = {};

		this.ws.onopen = () => this.eventOpen();
		this.ws.onmessage = (event) => this.eventMessage(event);
		this.ws.onclose = (code, message) => this.eventClose(code, message);
		this.ws.onerror = function(e){
			this.eventError(e);
		};
	}

	eventOpen(){
		this.send({
			t : "new_auth",
			d : {
				protocol_v
			}
		});
	}

	eventMessage(event){
		var packet;
		try{
			packet = JSON.parse(event.data);
		}catch(e){
			this.eventError(e);
			return;
		}

		if(this.wrapper.authenticated){

			switch(packet.t){
			case "disconnect":
				if(packet.d.reason.length < 64){
					this.temp.dc_reason = packet.d.reason;
				}else{
					this.disconnect("msg_too_big");
				}
				break;
			default:
				if(packet.t.startsWith("custom_")){
					// custom packets
					var type = packet.t.substr(7);
					this.wrapper.emit("message", type, packet.d);
				}
				break;
			}

		}else{
			switch(packet.t){
			case "authenticated":
				this.wrapper.token = packet.d.token;
				this.wrapper.authenticated = true;
				this.heartbeat_interval = packet.d.heartbeat_interval;
				if(this.heartbeat_interval > -1){
					this.setupHeartbeat();
				}
				this.wrapper.emit("ready");
				this.wrapper.wait_callback();
				break;
			default:
				break;
			}
		}

	}

	eventClose(code){
		this.wrapper.emit("close", this.temp.dc_reason||"unknown", code, message);
		if(!this.wrapper.authenticated){
			this.wrapper.wait_callback(new Error(`closed before connect. code '${code}' and message '${message}'`));
			this.wrapper.emit("nostart");
		}

		this.intervals.map(interval => clearInterval(interval));
	}

	eventError(error){
		try{
			this.wrapper.emit("error", error);
		}catch(e){
			// needed to stop node throwing uncaught error exceptions
		}
		if(!this.wrapper.authenticated){
			this.wrapper.emit("nostart");
			this.wrapper.wait_callback(error);
		}
	}

	setupHeartbeat(){
		this.intervals.push(setInterval(
			() => this.send({ t : "heartbeat" }),
			this.heartbeat_interval
		));
	}

	sendRaw(raw){
		this.ws.send(raw);
	}

	send(packet){
		if(this.ws.readyState === WebSocket.OPEN){
			this.ws.send(JSON.stringify(packet));
			return true;
		}else{
			return false;
		}
	}

	disconnect(reason, code, extra){
		var d = {reason};

		if(extra){
			d.extra = extra;
		}

		clearInterval(this.heartbeat_interval);

		this.send({
			t : "disconnect", d
		});

		this.temp.dc_reason = reason;

		this.ws.close(code || 1000);
	}

}

module.exports = LucidInternalClient;