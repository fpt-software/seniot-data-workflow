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
	 * Create Azure-IoT-Hub HTTP Input (cloud-to-device) node
	 */
	function azureIoTHubHttpNodeIn(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		var node = this;

		node.on("input", function(message) {
			if (node.deviceId) {
				var contextGlobal = RED.settings.get('functionGlobalContext');
				console.log("FILE", contextGlobal.safeStorage + '/' + node.deviceId + "/device.json");
				fs.readFile(contextGlobal.safeStorage + '/' + node.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "Read configuration file error."
						});
					} else {
						if (data && data != "") {
							node.status({
								fill : "blue",
								shape : "dot",
								text : "httpin.status.receiving"
							});
							data = JSON.parse(data);
							var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKey=' + data.PrimaryKey + '';
							node.log("Initiate Azure IoT Hub HTTPS node for " + node.deviceId + ", " + connectionString);
							var device = new Client.fromConnectionString(connectionString);
							device.receive(function(err, msg, res) {
								node.send({
									error : err,
									payload : JSON.parse(msg.getData())
								});
								node.status({});
							});
						} else {
							node.status({
								fill : "red",
								shape : "dot",
								text : "Configuration file is empty"
							});
						}
					}
				});
			} else {
				node.status({
					fill : "red",
					shape : "dot",
					text : "DeviceID is not set in the configuration settings."
				});
			}
		});
	}


	RED.nodes.registerType("azure-https in", azureIoTHubHttpNodeIn);

	/**
	 * Create Azure-IoT-Hub HTTP Output (device-to-cloud) node
	 */
	function azureIoTHubHttpNodeOut(n) {
		RED.nodes.createNode(this, n);
		this.deviceId = n.deviceId;
		var node = this;

		node.on("input", function(message) {
			if (node.deviceId) {
				var contextGlobal = RED.settings.get('functionGlobalContext');
				console.log("FILE", contextGlobal.safeStorage + '/' + node.deviceId + "/device.json");
				fs.readFile(contextGlobal.safeStorage + '/' + node.deviceId + "/device.json", 'utf8', function(err, data) {
					if (err) {
						node.status({
							fill : "red",
							shape : "dot",
							text : "Read configuration file error."
						});
					} else {
						if (data && data != "") {
							node.status({
								fill : "blue",
								shape : "dot",
								text : "httpin.status.requesting"
							});
							data = JSON.parse(data);
							var connectionString = 'HostName=' + data.HostName + ';DeviceId=' + data.DeviceId + ';SharedAccessKey=' + data.PrimaryKey + '';
							node.log("Initiate Azure IoT Hub HTTPS node for " + node.deviceId + ", " + connectionString);
							var device = new Client.fromConnectionString(connectionString);
							device.sendEvent(message, function(err, res) {
								node.send({
									err : err,
									payload : res
								});
								node.status({});
							});
						} else {
							node.status({
								fill : "red",
								shape : "dot",
								text : "Configuration file is empty"
							});
						}
					}
				});
			} else {
				node.status({
					fill : "red",
					shape : "dot",
					text : "DeviceID is not set in the configuration settings."
				});
			}
		});
	}


	RED.nodes.registerType("azure-https out", azureIoTHubHttpNodeOut);

};
