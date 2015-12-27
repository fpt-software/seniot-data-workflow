var powerOn = false;
var connected = false;
var nextStep = "UNKNOWN";
var wsUri = "wss://" + window.location.hostname + ":1880/ws/gateway";
var wsClient = null;
function wsGateway() {
	wsClient = new WebSocket(wsUri);
	$("#power").attr("disabled", true).addClass("ui-state-disabled");
	wsClient.onmessage = function(m) {
		console.log('< from-node-red:', m.data);
		msg = JSON.parse(m.data);
		if (msg.type == "setStatus") {
			$("#statusView").html("<span>" + msg.data + "</span>");
			nextStep = msg.next;
		}
	};
	wsClient.onopen = function() {
		connected = true;
		$("#power").attr("disabled", false).removeClass("ui-state-disabled");
		if (powerOn) {
			wsClient.send(JSON.stringify({
				type : "powerUp",
				data : {
					powerState : powerOn
				}
			}));
		}
		setPowerState(powerOn);
	};

	wsClient.onclose = function() {
		$("#power").attr("disabled", true).addClass("ui-state-disabled");
		$("#statusView").empty();
		console.log('Node-RED connection closed: ' + new Date().toUTCString());
		connected = false;
		wsClient = null;
		setTimeout(wsGateway, 10000);
	};
	wsClient.onerror = function() {
		$("#power").attr("disabled", true).addClass("ui-state-disabled");
		$("#statusView").empty();
		console.log("connection error");
	};
}

wsGateway();

function setPowerState(powerState) {
	powerOn = powerState;
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
		if (powerOn) {
			wsClient.send(JSON.stringify({
				type : "powerUp",
				data : {
					powerState : powerOn
				}
			}));
		}
		setPowerState(powerOn);
	});
});
