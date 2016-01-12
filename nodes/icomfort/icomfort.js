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
var sudo = require('sudo');

module.exports = function(RED) {
	"use strict";
	var nodes = new Array();

	function lennoxReg(n) {
		RED.nodes.createNode(this, n);
		this.name = n.name.trim();
		this.payload = n.payload;
		this.topic = n.topic;

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
		
		var spawnOptions = {
			cachePassword : true,
			prompt : 'Hi! Password is needed!',
			spawnOptions : {
				cwd : RED.settings.get('functionGlobalContext').certificateAuthority
			}
		};
		RED.httpNode.use("/lennox/gateway", express.static(__dirname + '/gateway'));
		RED.httpNode.use("/lennox/thermostat", express.static(__dirname + '/thermostat'));
		RED.httpNode.use("/lennox/xc25", express.static(__dirname + '/xc25'));
		RED.httpNode.get("/lennox/certs", function(req, res) {
			try {
				var child = sudo(['ls', '-d', './*/'], spawnOptions);
				child.stdout.on('data', function(data) {
					res.send({
						msg : data.toString().replace("\r\n", "\n").split('\n')
					});
				});
			} catch(err) {
				res.sendStatus(500);
			}
		});
		RED.httpNode.get("/lennox/certs/:id", function(req, res) {
			var certificateId = req.params.id;
			try {
				var child = sudo(['ls', '', './' + certificateId], spawnOptions);
				child.stdout.on('data', function(data) {
					res.send({
						msg : data.toString().replace("\r\n", "\n").replace(".\/" + certificateId + ":", "").split('\n')
					});
				});
			} catch(err) {
				res.sendStatus(500);
			}
		});
		RED.httpNode.post("/lennox/certs/:id", function(req, res) {
			var certificateId = req.params.id;
			try {
				var child = sudo(['ls', '', './' + certificateId], spawnOptions);
				child.stdout.on('data', function(data) {
					res.send({
						msg : data.toString().replace("\r\n", "\n").split('\n')
					});
				});
			} catch(err) {
				res.sendStatus(500);
			}
		});
		RED.httpNode.delete("/lennox/certs/:id", function(req, res) {
			var certificateId = req.params.id;
			try {
				var child = sudo(['ls', '-l', './'], spawnOptions);
				child.stdout.on('data', function(data) {
					console.log(data.toString());
				});
				res.sendStatus(200);
			} catch(err) {
				res.sendStatus(500);
			}
		});
	}


	RED.nodes.registerType("icomfort", lennoxReg);

	RED.httpAdmin.post("/lennox/lcc/:id", RED.auth.needsPermission("inject.write"), function(req, res) {
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
