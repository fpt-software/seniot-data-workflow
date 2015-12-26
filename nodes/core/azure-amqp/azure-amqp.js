module.exports = function(RED) {
	"use strict";
	var fs = require('fs');
	var q = require('q');
	var Device = require('azure-iot-device');
	var Client = Device.Client;
	var Message = Device.Message;

	function lnxIoTHubNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.deviceId = n.deviceId;
		var self = this;

		this.connect = function() {
			var deferred = q.defer();
			if (deviceId) {
				fs.readFile('./storage/' + self.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						deferred.reject(err);
					} else {
						if (!self.device) {
							data = JSON.parse(data);
							var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKeyName=' + data.SharedAccessKeyName + ';SharedAccessKey=' + data.PrimaryKey + '';
							self.log("Initiate Azure IoT Hub AMQP node for " + self.deviceId + ", " + connectionString);
							self.device = new Client.fromConnectionString(connectionString, Device.Amqp);
							self.log("Created Azure IoT Hub AMQP" + self.device);
						}
						deferred.resolve(self.device);
					}
				});
			} else {
				deferred.resolve(null);
			}

			return deferred.promise;
		};
	}


	RED.nodes.registerType("azure-amqp-device", lnxIoTHubNode);

	function lnxIoTHubNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		this.interval = n.interval;
		var self = this;

		if (this.azureIot) {
			self.azureIot.connect().then(function(device) {
				self.status({
					fill : "green",
					shape : "dot",
					text : "common.status.connected"
				});
				self.log('Creating Azure IoTHub: AMQP OUT ' + self.azureIot.name);
				device.getReceiver(function(err, receiver) {
					receiver.on('message', function(msg) {
						self.send({
							payload : msg.body
						});
						receiver.complete(msg, function() {
							console.log('completed');
						});
						receiver.reject(msg, function() {
							console.log('rejected');
						});
						receiver.abandon(msg, function() {
							console.log('abandoned');
						});
					});
					receiver.on('errorReceived', function(err) {
						console.warn(err);
					});
				});
			}, function(error) {
				self.status({
					fill : "red",
					shape : "dot",
					text : "common.status.disconnected"
				});
				this.error("azure-amqp is not registered.");
			});
		} else {
			self.status({
				fill : "red",
				shape : "dot",
				text : "common.status.disconnected"
			});
			this.error("azure-amqp in is not configured");
		}
	}


	RED.nodes.registerType("azure-amqp in", lnxIoTHubNodeIn);

	function lnxIoTHubNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		var self = this;
		
		if (this.azureIot) {
			self.azureIot.connect().then(function(device) {
				self.status({
					fill : "green",
					shape : "dot",
					text : "common.status.connected"
				});
				console.log('Creating Azure IoTHub: AMQP IN ' + self.azureIot.name);
				self.on("input", function(msg) {
					if (!Buffer.isBuffer(msg.payload)) {
						if ( typeof msg.payload === "object") {
							msg.payload = JSON.stringify(msg.payload);
						} else if ( typeof msg.payload !== "string") {
							msg.payload = "" + msg.payload;
						}
					}
					var message = new Message(msg.payload);
					console.log("Sending message: " + message.getData());
					device.sendEvent(message, function(err, res) {
						if (!err) {
                        	self.send({
                            	status: true 
                            });
                        } else {
                        	self.send({
                        		status: false,
                        		err: err
                        	});
                        }
					});
				});
			}, function(error) {
				self.status({
					fill : "red",
					shape : "dot",
					text : "common.status.disconnected"
				});
				this.error("azure-amqp is not registered.");
			});
		} else {
			self.status({
				fill : "red",
				shape : "dot",
				text : "common.status.disconnected"
			});
			this.error("azure-amqp out is not configured");
		}
	}


	RED.nodes.registerType("azure-amqp out", lnxIoTHubNodeOut);
};
