module.exports = function(RED) {
	"use strict";
	var fs = require('fs');
	var q = require('q');
	var common = require('azure-iot-common');
	var device = require('azure-iot-device');

	function azureIoTConnect(node, action, websocket) {
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
						var deviceObj = device.Client.fromConnectionString(connectionString, websocket ? device.AmqpWS : device.Amqp);
						deferred.resolve(deviceObj);
					} catch (ex) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "amqp.state.disconnected"
						});
						deferred.reject({
							Error : ex.message
						});
					}
				} else {
					deferred.reject({
						Error : "Invalid configuration."
					});
				}
			}
		});
		return deferred.promise;
	};

	function azureIoTHubNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		this.websocket = n.websocket;
		var node = this;

		node.on("input", function(message) {
			node.deviceId = message.deviceId || node.deviceId;
			if (node.deviceId) {
				azureIoTConnect(node, "< RECV-FROM", node.websocket).then(function(deviceObj) {
					if (deviceObj) {
						node.status({
							fill : "green",
							shape : "dot",
							text : "amqp.state.connected"
						});
						deviceObj.getReceiver(function(err, receiver) {
							if (receiver && !err) {
								receiver.on('message', function(msg) {
									console.log("***DATA", msg.body);
									node.send({
										payload : msg.body
									});
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
		this.websocket = n.websocket;
		var node = this;

		node.on("input", function(msg) {
			node.deviceId = msg.deviceId || node.deviceId;
			if (node.deviceId) {
				azureIoTConnect(node, "> SEND-TO", node.websocket).then(function(deviceObj) {
				}, function(error) {
					if (deviceObj) {
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
						var message = new device.Message(msg.payload);
						deviceObj.sendEvent(message, function(err, res) {
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
