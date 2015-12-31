/**
 The MIT License (MIT)

 Copyright (c) 2015 FPT Software

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

module.exports = function(RED) {
	"use strict";
	var fs = require('fs');
	var q = require('q');
	var Device = require('azure-iot-device');
	var Client = Device.Client;
	var Message = Device.Message;
	var Http = Device.Http;

	/**
	 * Create Azure-IoT-Hub HTTP node
	 */
	function azureIoTHubHttpNode(n) {
		RED.nodes.createNode(this, n);
		this.deviceName = n.name;
		this.deviceId = n.deviceId;
		var self = this;

		this.connect = function() {
			var deferred = q.defer();
			if (self.deviceId) {
				var contextGlobal = RED.settings.get('functionGlobalContext');
				console.log("FILE", contextGlobal.safeStorage + '/' + self.deviceId + "/device.json");
				fs.readFile(contextGlobal.safeStorage + '/' + self.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						deferred.reject(err);
					} else {
						if (data && data != "") {
							data = JSON.parse(data);
							var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKey=' + data.PrimaryKey + '';
							self.log("Initiate Azure IoT Hub HTTPS node for " + self.deviceId + ", " + connectionString);
							self.device = new Client.fromConnectionString(connectionString);
							deferred.resolve(self.device);
						} else {
							deferred.reject({
								error : "File is empty"
							});
						}
					}
				});
			} else {
				deferred.reject({
					error : "DeviceID is invalid"
				});
			}
			return deferred.promise;
		};
	}


	RED.nodes.registerType("azure-https-device", azureIoTHubHttpNode);

	/**
	 * Create Azure-IoT-Hub HTTP Input (cloud-to-device) node
	 */
	function azureIoTHubHttpNodeIn(n) {
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
				self.log('Creating Azure IoTHub: HTTPS IN ' + self.azureIot.name);
				self.on("input", function(input) {
					device.receive(function(err, msg, res) {
						if (err) {
							console.warn(err);
						} else if (res.statusCode !== 204) {
							self.send({
								payload : JSON.parse(msg.getData())
							});
						}
					});
				}, self.interval);
			}, function(error) {
				self.status({
					fill : "red",
					shape : "dot",
					text : "common.status.disconnected"
				});
				self.error("azure-https is not registered.");
			});
		} else {
			self.status({
				fill : "red",
				shape : "dot",
				text : "common.status.disconnected"
			});
			self.error("azure-https in is not configured");
		}
	}


	RED.nodes.registerType("azure-https in", azureIoTHubHttpNodeIn);

	/**
	 * Create Azure-IoT-Hub HTTP Output (device-to-cloud) node
	 */
	function azureIoTHubHttpNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.myDevice = n.device;
		this.azureIot = RED.nodes.getNode(this.myDevice);
		var self = this;
		function connectToAzureAndSend(msg) {
			self.azureIot.connect().then(function(device) {
				self.status({
					fill : "green",
					shape : "dot",
					text : "common.status.connected"
				});
				console.log('Creating Azure IoTHub: HTTPS OUT ' + self.azureIot.name);
				if (msg) {
					sendAzureMsg(device, msg);
				}
			}, function(error) {
				self.status({
					fill : "red",
					shape : "dot",
					text : "common.status.disconnected"
				});
				self.error("azure-https is not registered.");
			});
		};
		function sendAzureMsg(device, msg) {
			var deferred = q.defer();
			var message = new Message(msg.payload);
			console.log("Sending message: " + message.getData());
			device.sendEvent(message, function(err, res) {
				if (!err) {
					deferred.resolve({
						payload : {
							status : true
						}
					});
				} else {
					deferred.resolve({
						payload : {
							status : false,
							err : err
						}
					});
				}
			});
			deferred.promise.then(function(msg) {
				self.send(msg);
			});
		}

		self.on("input", function(msg) {
			if (!Buffer.isBuffer(msg.payload)) {
				if ( typeof msg.payload === "object") {
					msg.payload = JSON.stringify(msg.payload);
				} else if ( typeof msg.payload !== "string") {
					msg.payload = "" + msg.payload;
				}
			}
			if (this.azureIot.device) {
				sendAzureMsg(this.azureIot.device, msg);
			} else {
				connectToAzureAndSend(msg);
			}
		});
		if (this.azureIot) {
			connectToAzureAndSend();
		} else {
			self.status({
				fill : "red",
				shape : "dot",
				text : "common.status.disconnected"
			});
			self.error("azure-https out is not configured");
		}
	}


	RED.nodes.registerType("azure-https out", azureIoTHubHttpNodeOut);

};
