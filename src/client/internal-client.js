"use strict";

const NWebSocket = require("ws");
const protocol_v = "alpha3";

var window = window || false;

class LucidInternalClient {

	constructor(options, wrapper) {

		this.wrapper = wrapper;
		this.options = options;

		this.intervals = [];

		this.temp = {};

		this.reconnectAttempts = 0;

		this.setup();
	}

	setup() {
		var wsA = `ws://${this.wrapper.options.address}:${this.wrapper.options.port}/ws`;
		if (window && window.WebSocket)
			this.ws = new window.WebSocket(wsA);
		else
			this.ws = new NWebSocket(wsA);

		this.ws.onopen = () => this.eventOpen();
		this.ws.onmessage = (event) => this.eventMessage(event);
		this.ws.onclose = (code, message) => this.eventClose(code, message);
		this.ws.onerror = function(e) {
			this.eventError(e);
		};
	}

	eventOpen() {
		// trying to reconnect
		if (this.reconnectAttempts > 0 &&
			this.wrapper.token &&
			this.wrapper.options.reconnect &&
			(!this.temp.dc_packet || this.temp.dc_packet.d.extra.return)) {
			this.send({
				t: "existing_auth",
				d: {
					protocol_v,
					token: this.wrapper.token,
					s: this.wrapper.options.catch_up_on_reconnect ? this.sequence : -1
				}
			});
		} else {
			// new auth
			this.send({
				t: "new_auth",
				d: {
					protocol_v
				}
			});
		}
	}

	eventMessage(event) {
		this.wrapper.emit("raw", event.data);
		var packet;
		try {
			packet = JSON.parse(event.data);
		} catch (e) {
			this.eventError(e);
			return;
		}

		if (this.wrapper.authenticated) {

			switch (packet.t) {
				case "disconnect":
					this.temp.dc_packet = packet;
					break;
				default:
					if (packet.t.startsWith("custom_")) {
						// custom packets
						var type = packet.t.substr(7);
						this.wrapper.emit("message", type, packet.d);
					}
					break;
			}

		} else {
			switch (packet.t) {
				case "authenticated":
					this.wrapper.token = packet.d.token;
					this.wrapper.uuid = packet.d.uuid;
					this.wrapper.authenticated = true;
					this.heartbeat_interval = packet.d.heartbeat_interval;
					if (this.heartbeat_interval > -1) {
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

	eventClose(code) {
		this.wrapper.emit("close", this.temp.dc_reason || "unknown", code);
		if (!this.wrapper.authenticated) {
			this.wrapper.wait_callback(new Error(`closed before connect. code '${code}'`));
			this.wrapper.emit("nostart");
		}

		if (this.wrapper.options.reconnect) {
			this.reconnectAttempts++;
			this.tryReconnect();
		}

		this.intervals.map(interval => clearInterval(interval));
	}

	eventError(error) {
		try {
			this.wrapper.emit("error", error);
		} catch (e) {
			// needed to stop node throwing uncaught error exceptions
		}
		if (!this.wrapper.authenticated) {
			this.wrapper.emit("nostart");
			this.wrapper.wait_callback(error);
		}
	}

	setupHeartbeat() {
		this.intervals.push(setInterval(
			() => this.send({ t: "heartbeat" }),
			this.heartbeat_interval
		));
	}

	sendRaw(raw) {
		this.ws.send(raw);
	}

	send(packet) {
		if (this.ws.readyState === NWebSocket.OPEN) {
			this.ws.send(JSON.stringify(packet));
			return true;
		} else {
			return false;
		}
	}

	disconnect(reason, code, extra) {
		var d = { reason };

		if (extra) {
			d.extra = extra;
		}

		clearInterval(this.heartbeat_interval);

		this.send({
			t: "disconnect", d
		});

		this.temp.dc_reason = reason;

		this.ws.close(code || 1000);
	}

}

module.exports = LucidInternalClient;