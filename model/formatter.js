sap.ui.define([], function() {
	"use strict";
	return {
		adminVisible: function(admin) {
			if (admin === "0") {
				return true;
			}
			return false;
		},
		priorityText: function(Priority) {
			if (Priority === "1") {
				return false;
			}
			return true;
		},
		isValid: function(val) {
			if (val === undefined) {
				return false;
			}
			return true;
		},
		frequencyText: function(Frequency) {
			if (Frequency === "0") {
				return "Not Applicable";
			} else if (Frequency === "1") {
				return "Weekly/Quarter";
			} else if (Frequency === "5") {
				return "Daily/Month";
			} else if (Frequency === "4") {
				return "Daily/Quarter";
			} else {
				return "Weekly/Quarter";
			}
		},
		showInput: function(HotlineNum) {
			if (HotlineNum !== "") {
				return false;
			}
			return true;
		},
		ratingValue: function(Preference) {
			if (Preference !== null) {
				return parseFloat(Preference);
			}
		},
		maxValue: function(MaxValue) {
			if (MaxValue !== null) {
				return parseFloat(MaxValue);
			}
		},
		FinalizeAssign: function(Status) {
			if (Status === "Unassigned") {
				return true;
			}
			return false;
		},
		Finalize: function(Status) {
			if (Status === "Assigned") {
				return true;
			}
			return false;
		},
		saveStatus: function(state) {
			if (state === "Y") { //finished
				return "/images/Green.png";
			} else if (state === "N") { //error
				return "/images/Red.png";
			} else { //in process
				return "/images/Yellow.png";
			}
		},
		State: function(value) {
			if (value == "0") {
				return false;
			}
			return true;
		},
		enableSwitch: function(value) {
			if (value == "1") {
				return false;
			}
			return true;
		},
		HotlineTarget: function(val1, val2) {
			val1 = parseInt(val1);
			val2 = parseInt(val2);
			if (val2 >= val1) {
				return "Success";
			} else if (val2 >= 0 && val2 <= (val1 * 0.8)) {
				return "Error";
			} else {
				return "Warning";
			}
		},
		HotlineTargetIcon: function(val1, val2) {
			val1 = parseInt(val1);
			val2 = parseInt(val2);
			if (val2 >= val1) {
				return "sap-icon://message-success";
			} else if (val2 >= 0 && val2 <= (val1 * 0.8)) {
				return "sap-icon://alert";
			} else {
				return "sap-icon://drill-up";
			}
		},
		userEditState : function(value){
			if(value == "false"){
				return false;
			}
			return true;
		}
	};

});