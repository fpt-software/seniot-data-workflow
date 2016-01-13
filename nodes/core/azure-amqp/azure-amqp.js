module.exports = function(RED) {
	"use strict";
	var fs = require('fs');
	var q = require('q');
	var Device = require('azure-iot-device');
	var Client = Device.Client;
	var Message = Device.Message;

	function azureIoTHubNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		var node = this;

		node.on("input", function(message) {
			node.deviceId = message.deviceId || node.deviceId;
			if (node.deviceId) {
				var contextGlobal = RED.settings.get('functionGlobalContext');
				console.log("FILE", contextGlobal.safeStorage + '/' + node.deviceId + "/device.json");
				fs.readFile(contextGlobal.safeStorage + '/' + node.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "amqp.state.configuration-failed"
						});
					} else {
						if (data && data != "") {
							node.status({
								fill : "blue",
								shape : "dot",
								text : "amqp.state.connecting"
							});
							data = JSON.parse(data);
							if (!node.device) {
								var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKey=' + data.PrimaryKey + '';
								node.log("Initiate Azure IoT Hub HTTPS node for " + node.deviceId + ", " + connectionString);
								node.device = new Client.fromConnectionString(connectionString, Device.Amqp);
								if (node.device) {
									node.status({
										fill : "green",
										shape : "dot",
										text : "amqp.state.connected"
									});
								}
							}
							node.device.getReceiver(function(err, receiver) {
								receiver.on('message', function(msg) {
									self.send({
										payload : msg.body
									});
									receiver.complete(msg, function() {
										node.status({
											fill : "green",
											shape : "dot",
											text : "amqp.state.connected"
										});
									});
									receiver.reject(msg, function() {
										node.status({
											fill : "red",
											shape : "dot",
											text : msg
										});
									});
									receiver.abandon(msg, function() {
										node.status({
											fill : "red",
											shape : "dot",
											text : msg
										});
									});
								});
								receiver.on('errorReceived', function(err) {
									node.status({
										fill : "red",
										shape : "dot",
										text : msg.Error
									});
								});
							});
						} else {
							node.status({
								fill : "red",
								shape : "dot",
								text : "amqp.state.configuration-failed"
							});
						}
					}
				});
			} else {
				node.status({
					fill : "red",
					shape : "dot",
					text : "amqp.state.configuration-empty"
				});
			}
		});
	}


	RED.nodes.registerType("azure-amqp in", azureIoTHubNodeIn);

	function azureIoTHubNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		var node = this;

		node.on("input", function(msg) {
			node.deviceId = msg.deviceId || node.deviceId;
			if (node.deviceId) {
				var contextGlobal = RED.settings.get('functionGlobalContext');
				console.log("FILE", contextGlobal.safeStorage + '/' + node.deviceId + "/device.json");
				fs.readFile(contextGlobal.safeStorage + '/' + node.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "amqp.state.configuration-failed"
						});
					} else {
						if (data && data != "") {
							node.status({
								fill : "blue",
								shape : "dot",
								text : "amqp.state.connecting"
							});
							data = JSON.parse(data);
							var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKeyName=' + data.SharedAccessKeyName + ';SharedAccessKey=' + data.PrimaryKey + '';
							node.log("Sending data to: " + node.deviceId + ", " + connectionString);
							node.device = new Client.fromConnectionString(connectionString, Device.Amqp);
							if (node.device) {
								node.status({
									fill : "green",
									shape : "dot",
									text : "amqp.state.connected"
								});
							}
							if (!Buffer.isBuffer(msg.payload)) {
								if ( typeof msg.payload === "object") {
									msg.payload = JSON.stringify(msg.payload);
								} else if ( typeof msg.payload !== "string") {
									msg.payload = "" + msg.payload;
								}
							}
							var message = new Message(msg.payload);
							node.device.sendEvent(message, function(err, res) {
								node.send({
									error : err
								});
								node.status({
									fill : "green",
									shape : "dot",
									text : "amqp.state.connected"
								});
							});
						} else {
							node.status({
								fill : "red",
								shape : "dot",
								text : "amqp.state.configuration-failed"
							});
						}
					}
				});
			} else {
				node.status({
					fill : "red",
					shape : "dot",
					text : "amqp.state.configuration-empty"
				});
			}
		});
	}


	RED.nodes.registerType("azure-amqp out", azureIoTHubNodeOut);
};
