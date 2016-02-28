"use strict";

const WebSocket = require("ws");
const protocol_v = require("../index").protocol_v;

class LucidInternalClient extends WebSocket{
	
	constructor(options, wrapper){
		super(wrapper.url);
		
		this.wrapper = wrapper;
		this.options = options;
		
		this.intervals = [];
		
		this.temp = {};
		
		this.on("open", () => this.eventOpen());
		this.on("message", (data, flags) => this.eventMessage(data, flags));
		this.on("close", (code, message) => this.eventClose(code, message));
		this.on("error", error => this.eventError(error));
		this.onerror = function(e){this.eventError(e)};
	}
	
	eventOpen(){
		this.send({
			t : "new_auth",
			d : {
				protocol_v
			}
		});
	}
	
	eventMessage(data, flags){
		var packet;
		try{
			packet = JSON.parse(data);
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
	
	eventClose(code, message){
		this.wrapper.emit("close", this.temp.dc_reason||"unknown", code, message);
		if(!this.wrapper.authenticated){
			this.wrapper.wait_callback(new Error(`closed before connect. code '${code}' and message '${message}'`));
			this.wrapper.emit("nostart");
		}
	}
	
	eventError(error){
		try{
			this.wrapper.emit("error", error);
		}catch(e){}
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
		super.send(raw);
	}
	
	send(packet){
		if(this.readyState === WebSocket.OPEN){
			super.send(JSON.stringify(packet));
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
		
		this.close(code || 1000);
	}
	
}

module.exports = LucidInternalClient;