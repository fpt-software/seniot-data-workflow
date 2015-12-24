var powerOn = false;
var fanIsOn = false;
var heatOrCool = false;
var connected = false;
var wsUri = "ws://" + window.location.hostname + ":1880/ws/thermostat";
var wsClient = null;
function wsGateway() {
	wsClient = new WebSocket(wsUri);
	$("#power").attr("disabled", true).addClass("ui-state-disabled");
	wsClient.onmessage = function(m) {
		console.log('< from-node-red:', m.data);
		msg = JSON.parse(m.data);
		if (msg.type == "power") {
			setPowerState(msg.data.powerState);
		} else if (msg.type == "status") {
			$("#statusView").html("<span>" + msg.data + "</span>");
		}
	};
	wsClient.onopen = function() {
		connected = true;
		$("#power").attr("disabled", false).removeClass("ui-state-disabled");
		console.log("sent init requeset");
		$("#heat-cool-switch").on("click", function(event) {
			$(".set-updown-container-wrapper").toggleClass("set-updown-container-wrapper-next");
			heatOrCool = !heatOrCool;
		});
		$("#fan-switch").on("click", function(event) {
			fanIsOn = !fanIsOn;
			$("#fan-value").html(fanIsOn?"ON":"OFF");
		});
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
	console.log(powerOn);
	if (powerOn) {
		$("#power").addClass("ui-btn-active");
		$("#container").removeClass("power-off");
	} else {
		$("#power").removeClass("ui-btn-active");
		$("#container").addClass("power-off");
	}
}

$(function() {
	$(document).on("vclick", "#power", function(event) {
		$(event.target).toggleClass("ui-btn-active");
		powerOn = !powerOn;
		wsClient.send(JSON.stringify({
			type : "power",
			data : {
				powerState : powerOn
			}
		}));
	});
});
