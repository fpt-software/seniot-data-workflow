module.exports = function(RED) {
	"use strict";
	var fs = require('fs');
	var q = require('q');
	var Device = require('azure-iot-device');
	var Client = Device.Client;
	var Message = Device.Message;

	function azureIoTConnect(node, action) {
		var deferred = q.defer();
		var contextGlobal = RED.settings.get('functionGlobalContext');
		console.log("FILE", contextGlobal.safeStorage + '/' + node.deviceId + "/device.json");
		fs.readFile(contextGlobal.safeStorage + '/' + node.deviceId + "/device.json", 'utf8', function(err, data) {
			if (err) {
				node.status({
					fill : "red",
					shape : "dot",
					text : "amqp.state.configuration-failed"
				});
				deferred.reject(err);
			} else {
				if (data && data != "") {
					node.status({
						fill : "blue",
						shape : "dot",
						text : "amqp.state.connecting"
					});
					try {
						data = JSON.parse(data);
						var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKey=' + data.PrimaryKey + '';
						console.log(action, node.deviceId, connectionString);
						var device = new Client.fromConnectionString(connectionString, Device.Amqp);
						deferred.resolve(device);
					} catch (ex) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "amqp.state.disconnected"
						});
						deferred.reject({
							Error : ex.message
						});
						console.log(ex);
						throw ex;
					}
				} else {
					deferred.reject({
						Error : "Invalid configuration."
					});
				}
			}
		});
		return deferred.promise;
	}

	function azureIoTHubNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		var node = this;

		node.on("input", function(message) {
			node.deviceId = message.deviceId || node.deviceId;
			if (node.deviceId) {
				azureIoTConnect(node, "< RECV-FROM").then(function(device) {
					console.log("HELLO", device);
					if (device) {
						node.status({
							fill : "green",
							shape : "dot",
							text : "amqp.state.connected"
						});
						console.log("RECEIVER INIT");
						device.getReceiver(function(err, receiver) {
							console.log("RECEIVER:", err, receiver);
							if (receiver && !err) {
								receiver.on('message', function(msg) {
									node.send({
										payload : JSON.parse(msg.body)
									});
									console.log("***DATA", msg.body);
									receiver.complete(msg, function(error) {
										if (error) {
											node.status({
												fill : "red",
												shape : "dot",
												text : "amqp.state.confirmation-failed"
											});
											node.device = null;
										} else {
											node.status({
												fill : "green",
												shape : "dot",
												text : "amqp.state.connected"
											});
										}
									});
								});
								receiver.on('errorReceived', function(err) {
									node.status({
										fill : "red",
										shape : "dot",
										text : err.Error
									});
								});
							} else {
								node.status({
									fill : "red",
									shape : "dot",
									text : "amqp.state.disconnected"
								});
							}
						});
					} else {
						node.status({
							fill : "red",
							shape : "dot",
							text : "amqp.state.disconnected"
						});
					}
				}, function(error) {
					node.status({
						fill : "red",
						shape : "dot",
						text : "amqp.state.disconnected"
					});
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
				azureIoTConnect(node, "> SEND-TO").then(function(device) {
				}, function(error) {
					if (device) {
						node.status({
							fill : "green",
							shape : "dot",
							text : "amqp.state.connected"
						});
						if (!Buffer.isBuffer(msg.payload)) {
							if ( typeof msg.payload === "object") {
								msg.payload = JSON.stringify(msg.payload);
							} else if ( typeof msg.payload !== "string") {
								msg.payload = "" + msg.payload;
							}
						}
						var message = new Message(msg.payload);
						device.sendEvent(message, function(err, res) {
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
							text : "amqp.state.disconnected"
						});
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
