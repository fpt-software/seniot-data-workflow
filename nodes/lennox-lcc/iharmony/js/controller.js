//Node-Red mobi ui - LHG industrialinternet.co.uk
console.log("NR mobi UI 1.0: Controls, Chart");
var schedule = null;
var itemLookup = null;
var statusMsg = false;
var daiableWidgets = false;
var connected = false;
var wsUri = "ws://" + window.location.hostname + ":1880/ws/iharmony";
var ws = null;
function wsConn() {
	ws = new WebSocket(wsUri);
	ws.onmessage = function(m) {
		console.log('< from-node-red:', m.data);
		if ( typeof (m.data) === "string" && m.data !== null) {
			var msg = JSON.parse(m.data);
			var ftc = msg.id.substring(0, 3);
			//console.log("id:"+msg.id+" fct:"+ftc);
			if (ftc == "init") {
				init(msg.v);
			}
			if (ftc == "tsw") {
				setFlip(msg.id, msg.v);
			}
			if (ftc == "sld") {
				setSlider(msg.id, msg.v);
			}
			if (ftc == "val") {
				setValue(msg.id, msg.v);
			}
			//if(ftc=="cha"){showCharts( msg.v.values,msg.v.colors,msg.v.engs,msg.v.tags,msg.v.names,msg.v.nos,msg.v.title,.msg.v.yTitle)};
			if (ftc == "cha") {
				showCharts(msg.v.values, msg.v.colors, msg.v.engs, msg.v.tags, msg.v.names, msg.v.nos, msg.v.title, msg.v.xtitle, msg.v.ytitle)
			};
			if (ftc == "shd") {
				setSchedule(msg.v);
			}
			if (ftc == "sta") {
				setStatus(msg.v.stMsg, msg.v.dur, msg.v.pri);
			}
			if (ftc == "ack") {
				clearReq();
			}
		}
	}
	ws.onopen = function() {
		statusMsg = false;
		if (daiableWidgets == true) {
			enablePage();
		}
		setStatus("Connected", 5, 0);
		connected = true;
		var obj = {
			"id" : "init",
			"v" : 1
		};
		getRequest = JSON.stringify(obj);
		ws.send(getRequest);
		// Request ui status from NR
		console.log("sent init requeset");
	}
	ws.onclose = function() {
		console.log('Node-RED connection closed: ' + new Date().toUTCString());
		connected = false;
		ws = null;
		setStatus("No connection to server!", 0, 1);
		if (daiableWidgets == false) {
			disablePage();
		}
		setTimeout(wsConn, 10000);
	}
	ws.onerror = function() {
		//console.log("connection error");
	}
}

wsConn();
// connect to Node-RED server
function init(values) {// initialise UI controls
	ui = JSON.parse(values);
	for (var item in ui) {
		//console.log("item: "+item);
		var m = ui[item];
		initSetters(m);
	}
}

function initSetters(msg) {// update UI widgets on connect
	console.log("init item id:" + msg.id + " value:" + msg.v);
	if (ftc == "tsw") {
		setFlip(msg.id, msg.v);
	}
	if (ftc == "sld") {
		setSlider(msg.id, msg.v);
	}
	if (ftc == "val") {
		setValue(msg.id, msg.v);
	}
	if (ftc == "cha") {
		showCharts(msg.v.values, msg.v.colors, msg.v.engs, msg.v.tags, msg.v.names, msg.v.nos, msg.v.title, msg.v.xTitle.msg.v.yTitle)
	};
	if (ftc == "shd") {
		setSchedule(msg.v);
	}
	if (ftc == "sta") {
		setStatus(msg.v);
	}
}

function setFlip(_id, _v) {// update flip
	myselect = $("#" + _id);
	//console.log("flip id:"+_id+" value:"+_v+" tyepof:"+ typeof _v +" state:"+myselect.data('state')+" req:"+myselect.data('req'));
	//if(myselect.data('req')==1) return; // request on progress stops flip UI chatter
	if (myselect.data('state') != _v) {
		if (_v == true || _v == 'true') {
			myselect[0].selectedIndex = 1;
			myselect.data('state', 1)
		} else {
			myselect[0].selectedIndex = 0;
			myselect.data('state', 0);
		}
		myselect.flipswitch("refresh");
		//myselect.stopImmediatePropagation();
		//console.log("jq:"+myselect[0].selectedIndex+" flip id:"+_id+" v:"+value+" data-state:"+myselect.data('state'));
	}
}

function setSlider(_id, _v) {// update slider
	myselect = $("#" + _id);
	myselect.val(_v);
	myselect.slider('refresh');
}

function setValue(_id, _v) {// update value display
	myselect = $("#" + _id);
	myselect.val(_v);
}

function showCharts(_data, colors, engs, tags, names, nos, cTitle, xTitle, yTitle) {// render chart
	var seriesNo = [];
	for ( i = 0; i < nos; i++) {
		seriesNo.push({});
	}
	console.log("seriesNo:" + seriesNo);
	var options = {
		chart : {
			marginRight : 30,
			renderTo : 'container',
			type : 'spline',
		},
		title : {
			text : cTitle
		},
		xAxis : {
			type : 'datetime',
			dateTimeLabelFormats : {
				hour : '%H',
				day : '%H <br/>%a %d %b'
			},
			gridLineColor : '#C0C0C0',
			tickInterval : 1 * 3600 * 1000,
			title : {
				text : xTitle
			},
		},
		yAxis : {
			title : {
				text : yTitle
			},
			min : 0,
			gridLineWidth : 0.5
		},
		tooltip : {
			formatter : function() {
				eng = engs[this.series.options.id];
				tag = tags[this.series.options.id];
				return "<strong>" + Highcharts.numberFormat(this.y, 1) + "</strong>" + eng + " " + tag + "<br/>" + Highcharts.dateFormat('%a %d %b %H:%M:%S', this.x) + '<br/>';
			}
		},
		series : seriesNo
	};
	for ( i = 0; i < nos; i++) {
		options.series[i].id = i;
		options.series[i].color = colors[i];
		options.series[i].lineWidth = 1;
		options.series[i].name = names[i];
		options.series[i].data = JSON.parse(_data[i]);
	}
	var chart = new Highcharts.Chart(options);
}

function setSchedule(_v) {// update schedule
	//console.log("shed:"+_v);
	schedule = JSON.parse(_v);
	console.log("shed:" + schedule.items[0].id);
}

function setStatus(msg, dur, pri) {// show msg on status bar
	if (statusMsg == true) {
		return
	};
	statusMsg = true;
	if (pri > 0) {
		//msg = "<span class='alert'>"+msg+"</span>";
		$("#statusView").toggleClass("statusViewAlert");
	} else {
		$("#statusView").toggleClass("statusView");
	}
	$("#statusView").show();
	$("#statusView").html(msg);
	dur = dur * 1000;
	if (dur > 0) {
		setTimeout(function() {
			$("#statusView").hide(200);
			$("#statusView").html("");
			statusMsg = false
		}, dur)
	}
}

function disablePage() {
	$("[data-role=flipswitch]").flipswitch("disable");
	//$("[data-role=range]").disabled = true;
	$("[data-role=range]").slider("option", "disabled", true);
	$("[data-rel=popup]").toggleClass("ui-disabled");
	daiableWidgets = true;
}

function enablePage() {
	$("[data-role=flipswitch]").flipswitch("enable");
	$("[data-role=range]").slider("option", "enabled", true);
	$("[data-role=range]").slider("enable");
	$("[data-rel=popup]").toggleClass("ui-disabled");
	daiableWidgets = false;
}

$(function() {// UI event handlers
	// Flip-switch change
	$("[data-role=flipswitch]").bind("change", function(event, ui) {
		//console.log("id:"+this.id+" val:"+$(this).flipswitch().val()+" state:"+$(this).data('state')+" req:"+$(this).data('reqstate'));
		var _value = $(this).flipswitch().val();
		if ($(this).data('state') != _value) {
			$(this).data('state', _value);
			var obj = {
				"id" : "" + this.id + "",
				"v" : _value
			};
			setActions = JSON.stringify(obj);
			ws.send(setActions);
		}
	});
	// Slider end
	$(".ui-slider").bind("slidestop", function(event, ui) {
		var obj = {
			"id" : "" + event.target.id + "",
			"v" : event.target.value
		};
		setActions = JSON.stringify(obj);
		ws.send(setActions);
	});
	// Popup send
	$("[data-ui-type=pop-save]").bind("click", function(event, ui) {
		bid = this.id.split("_");
		wid = "#" + bid[0] + "-pop";
		$(wid).popup("close");
		tid = "#" + bid[0];
		var obj = {
			"id" : "" + bid[0] + "",
			"v" : $(tid).val()
		};
		setActions = JSON.stringify(obj);
		ws.send(setActions);
	});
	// Grouped Radio buttons click
	$("[data-ui-type=shd-sel]").bind("click", function(event, ui) {
		$("[data-ui-type=shd-sel]").prop("checked", false).checkboxradio("refresh");
		$(this).prop("checked", true).checkboxradio("refresh");
		var item = this.id.split("-");
		if (itemLookup == null) {
			itemLookup = item[1] - 1;
		} else {// Copy item edits back obj
			schedule.items[itemLookup].tag = $('#shd-tag').val();
			schedule.items[itemLookup].startTime = $('#shd-st').val();
			schedule.items[itemLookup].startValue = $('#shd-st-v').val();
			schedule.items[itemLookup].endTime = $('#shd-et').val();
			schedule.items[itemLookup].endValue = $('#shd-et-v').val();
			for ( dow = 0; dow < 7; dow++) {
				var dowUI = '#shd-dow-' + dow;
				if ($(dowUI).prop("checked")) {
					schedule.items[itemLookup].dofWeek[dow] = 1;
				} else {
					schedule.items[itemLookup].dofWeek[dow] = 0;
				}
			}
			itemLookup = item[1] - 1;
		}
		console.log("shed item" + item[1] + " lookup tag:" + schedule.items[itemLookup].tag);
		$('#shd-tag').val(schedule.items[itemLookup].tag);
		$('#shd-st').val(schedule.items[itemLookup].startTime);
		$('#shd-st-v').val(schedule.items[itemLookup].startValue);
		$('#shd-et').val(schedule.items[itemLookup].endTime);
		$('#shd-et-v').val(schedule.items[itemLookup].endValue);
		//console.log("group radio - id:"+ this.id+" val:"+$(this).val());
		for ( dow = 0; dow < 7; dow++) {
			var dowUI = '#shd-dow-' + dow;
			if (schedule.items[itemLookup].dofWeek[dow] == 1) {
				$(dowUI).prop("checked", true).checkboxradio("refresh")
			} else {
				$(dowUI).prop("checked", false).checkboxradio("refresh")
			}
		}
	});
	// Schedule save
	$("#shd-save").bind("click", function(event, ui) {
		console.log("shd-save");
		if (itemLookup != null) {
			schedule.items[itemLookup].tag = $('#shd-tag').val();
			schedule.items[itemLookup].startTime = $('#shd-st').val();
			schedule.items[itemLookup].startValue = $('#shd-st-v').val();
			schedule.items[itemLookup].endTime = $('#shd-et').val();
			schedule.items[itemLookup].endValue = $('#shd-et-v').val();
			for ( dow = 0; dow < 7; dow++) {
				var dowUI = '#shd-dow-' + dow;
				if ($(dowUI).prop("checked")) {
					schedule.items[itemLookup].dofWeek[dow] = 1;
				} else {
					schedule.items[itemLookup].dofWeek[dow] = 0;
				}
			}
			var obj = {
				"id" : "shd-save",
				"v" : schedule
			};
			getRequest = JSON.stringify(obj);
			ws.send(getRequest);
		}
	});
	// Utills
	var showHide = 0;
	$(window).keydown(function(event) {
		if (event.shiftKey && event.keyCode == 68) {
			//console.log(event.keyCode);
			if (showHide == 0) {
				$("#foo").show('slow');
				showHide = 1;
			} else {
				$("#foo").hide();
				showHide = 0;
			}
			event.preventDefault();
		}
	});
	$(document).on("vclick", "#b1", function() {
		location.reload();
		console.log("reload button");
	});
}); 