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
	var request = require('request');
	var fs = require('fs');
	/**
	 * Create https configuration node
	 */
	function httpTlsCertificateNode(n) {
		RED.nodes.createNode(this, n);
		this.agentOptions = {
			cert : fs.readFileSync('../https/certs/' + n.certId + '-certificate.pem.crt'),
			key : fs.readFileSync('../https/certs/' + n.certId + '-private.pem.key'),
			ca : fs.readFileSync('../https/certs/' + n.certId + 'root-CA.crt'),
			securityOptions : 'SSL_OP_NO_SSLv3'
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
		this.method = n.method;
		this.url = n.url;
		var self = this;

		if (this.certificate) {
			self.on("input", function(msg) {
				self.method = msg.method || self.method;
				self.url = msg.url || self.url;
				request({
					url : self.url,
					method : self.method,
					agentOptions : self.certificate.agentOptions
				}, function(error, response, body) {
					self.send({
						response : response,
						payload : body
					});
				});
			});
		} else {
			this.error("https in is not configured");
		}
	}


	RED.nodes.registerType("https request", httpTlsRequestNode);
};
