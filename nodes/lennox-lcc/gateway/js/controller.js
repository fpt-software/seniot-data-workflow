var powerOn = false;
var connected = false;
var wsUri = "ws://" + window.location.hostname + ":1880/ws/gateway";
var wsClient = null;
function wsGateway() {
	wsClient = new WebSocket(wsUri);
	wsClient.onmessage = function(m) {
		console.log('< from-node-red:', m.data);
		msg = JSON.parse(m.data);
		if (msg.topic == "power") {
			setPowerState(msg.data.powerState);
		} else {

		}
	};
	wsClient.onopen = function() {
		connected = true;
		var obj = {
			"id" : "init",
			"v" : 1
		};
		getRequest = JSON.stringify(obj);
		wsClient.send(getRequest);
		console.log("sent init requeset");
	};

	wsClient.onclose = function() {
		console.log('Node-RED connection closed: ' + new Date().toUTCString());
		connected = false;
		wsClient = null;
		setTimeout(wsGateway, 10000);
	};
	wsClient.onerror = function() {
		console.log("connection error");
	};
}

wsGateway();

function setPowerState(powerState) {
	powerOn = powerState;
	console.log(powerOn);
	if (powerOn) {
		$("#power").addClass("ui-btn-active");
		$("#gateway").removeClass("power-off");
	} else {
		$("#power").removeClass("ui-btn-active");
		$("#gateway").addClass("power-off");
	}
}

$(function() {
	$(document).on("vclick", "#power", function(event) {
		$(event.target).toggleClass("ui-btn-active");
		powerOn = !powerOn;
		wsClient.send(JSON.stringify({
			topic : "power",
			data : {
				powerState : powerOn
			}
		}));
	});
});
