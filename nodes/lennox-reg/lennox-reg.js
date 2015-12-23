/**
 * Copyright 2015 Urbiworx
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var express = require("express");
var Controller = require('node-pid-controller');
require('String.prototype.startsWith');

module.exports = function(RED) {
	"use strict";
	var nodes = new Array();

	function lennoxReg(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name.trim();
		this.payload = n.payload;
		this.topic = n.topic;
		this.url = "/lennox/reg";

		nodes.push(this);

		var self = this;

		this.on("close", function() {
			var index = nodes.indexOf(self);
			if (index > -1) {
				nodes.splice(index, 1);
			}
		});

		this.on("input", function(msg) {
			var msg = {
				topic : this.topic,
			};
			msg.payload = this.payload;
			this.send(msg);
		});
		if (this.url) {
			RED.httpNode.use(this.url, express.static(__dirname + '/html'));
		} else {
			this.error("lennox-reg in is not configured");
		}
	}

	RED.nodes.registerType("lennox-reg", lennoxReg);

	RED.httpAdmin.post("/lennox/reg/:id", RED.auth.needsPermission("inject.write"), function(req, res) {
		var node = RED.nodes.getNode(req.params.id);
		if (node != null) {
			try {
				node.receive();
				res.sendStatus(200);
			} catch(err) {
				res.sendStatus(500);
				node.error(RED._("inject.failed", {
					error : err.toString()
				}));
			}
		} else {
			res.sendStatus(404);
		}
	});
};
