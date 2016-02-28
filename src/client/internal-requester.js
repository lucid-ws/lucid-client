"use strict";

const request = require("superagent");
const url = require("url");

function join(part1, part2){
	if(part2.startsWith("/")){
		part2 = part2.substr(1);
	}
	return part1 + part2;
}

class LucidInternalRequester{
	
	constructor(wrapper){
		this.wrapper = wrapper;
		this.request = request;
		this.baseURL = url.resolve(`http://${this.wrapper.options.url}:${this.wrapper.options.port}`, "");	
	}
	
	get(path){
		return this.request
			.get(this.baseURL + join("custom_api/", path))
			.set("token", this.wrapper.token);
	}
	
	_get(path){
		return this.request.get(this.baseURL + join("api/", path));
	}
	
	post(path){
		return this.request
			.post(this.baseURL + join("custom_api/", path))
			.set("token", this.wrapper.token);
	}
	
	_post(path){
		return this.request.post(this.baseURL + join("api/", path));
	}
	
	head(path){
		return this.request
			.head(this.baseURL + join("custom_api/", path))
			.set("token", this.wrapper.token);
	}
	
	_head(path){
		return this.request.head(this.baseURL + join("api/", path));
	}
	
	put(path){
		return this.request
			.put(this.baseURL + join("custom_api/", path))
			.set("token", this.wrapper.token);
	}
	
	_put(path){
		return this.request.put(this.baseURL + join("api/", path));
	}
	
	del(path){
		return this.request
			.del(this.baseURL + join("custom_api/", path))
			.set("token", this.wrapper.token);
	}
	
	_del(path){
		return this.request.del(this.baseURL + join("api/", path));
	}
	
}

module.exports = LucidInternalRequester;