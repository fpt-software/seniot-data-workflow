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
	var https = require('https');

	/**
	 * Create https configuration node
	 */
	function httpTlsCertificateNode(n) {
		RED.nodes.createNode(this, n);
		this.certificateName = n.name;
		this.doRequest = function(hostname, port, path, method) {
			var options = {
				hostname : hostname,
				port : port,
				path : path,
				method : method,
				key : fs.readFileSync(n.key),
				cert : fs.readFileSync(n.cert)
			};
			options.agent = new https.Agent(options);
			var req = https.request(options, function(res) {
			});
		};
	}
	RED.nodes.registerType("https-certificate", httpTlsCertificateNode);

	/**
	 * Create https request node
	 */
	function httpTlsRequestNode(n) {
		RED.nodes.createNode(this, n);
		this.myCertificate = n.certificate;
		this.certificate = RED.nodes.getNode(this.myCertificate);
		var self = this;

		if (this.certificate) {
			self.on("input", function(msg) {
				self.send({
					payload : msg.payload
				});
			});
		} else {
			this.error("https in is not configured");
		}
	}
	RED.nodes.registerType("https request", httpTlsRequestNode);
};
