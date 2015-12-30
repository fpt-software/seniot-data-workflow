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
	var q = require('q');
	/**
	 * Create https configuration node
	 */
	function httpTlsCertificateNode(n) {
		var contextGlobal = RED.settings.get('functionGlobalContext');
		RED.nodes.createNode(this, n);
		this.agentOptions = n.disabled ? null : {
			cert : fs.readFileSync(contextGlobal.safeStorage + '/' + n.certId + '/client-crt.pem'),
			key : fs.readFileSync(contextGlobal.safeStorage + '/' + n.certId + '/client-key.pem'),
			ca : fs.readFileSync(contextGlobal.certStorage + '/ca-crt.pem'),
			rejectUnauthorized: n.rejectUnauthorized,
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
		var deferred = q.defer();
		var self = this;

		if (this.certificate) {
			self.on("input", function(msg) {
				self.method = msg.method || self.method;
				self.url = msg.url || self.url;
				self.body = msg.method == "POST" ? msg.payload : null;
				console.log(n.name, "REQUEST", self.url, self.method, self.body || "");
				request({
					url : self.url,
					method : self.method,
					body : self.body,
					agentOptions : self.certificate.agentOptions
				}, function(error, response, body) {
					console.log(n.name, "RESULT", body);
					deferred.resolve({
						payload : body,
						error : error
					});
				});
			});
			deferred.promise.then(function(msg) {
				self.send(msg);
			});
		} else {
			this.error("https in is not configured");
		}
	}


	RED.nodes.registerType("https request", httpTlsRequestNode);
};
