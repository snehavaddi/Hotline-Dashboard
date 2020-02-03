sap.ui.define(["Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	jQuery.sap.require("sap.ui.core.format.DateFormat");
	return BaseController.extend("Hotline.controller.Admin", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("admin").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(oEvent) {
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/"; //change before upload
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			this.getView().setModel(this.oModel);
			this.onPageLoad();
			//check authorization
			try {
				var aRoles = sap.ui.getCore().getModel("roles").oData;
			} catch (e) {
				//ignore error
			}
			if (aRoles !== undefined) {
				for (var i = 0; i < aRoles.length; i++) {
					if (aRoles[i].Role === "SUPER" && aRoles[i].Admin === "N") {
						//ok
						sap.m.MessageBox.warning("Sorry! You do not have authorization to view this page.");
						var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
						oRouter.navTo("");
					}
				}
			}
			//this.calculateWeeks();
			this.getWeeks();
			//	var role = this.setRoles();
			//	this._showButtons(role);
		},
		onOpenDialog: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("update");
		},
		//
		onPageLoad: function() {
			var that = this;
			var oMgrModel = new sap.ui.model.json.JSONModel();
			sap.ui.core.BusyIndicator.show();
			this.getView().byId("__remDate").setValueState("None");
			// this.getView().byId("__fromDate").setValueState("None");
			this.getView().byId("__deadlineDate").setValueState("None");
			//read Model
			this.oModel.read("/VariantSet('')",
				null,
				null,
				false,
				function(oData) {
					oMgrModel.setData(oData);
				});
			this.getView().byId("manageForm").setModel(oMgrModel, "mgr");
			sap.ui.core.BusyIndicator.hide();
		},
		update: function() {
			var validationResult = this._validate();
			if (validationResult === true) {
				this._update();
			}
		},
		updateNotify: function() {
			var validationResult = this._validate();
			if (validationResult === true) {
				this._update();
				var aRes = [];
				aRes = this.getView().byId("manageForm").getModel("mgr").getData();
				var sQtr, sDate, sLink;
				aRes.FromDate = aRes.FromDate.substring(4, 6) + "." + aRes.FromDate.substring(6, 8) + "." + aRes.FromDate.substring(0, 4);
				aRes.ToDate = aRes.ToDate.substring(4, 6) + "." + aRes.ToDate.substring(6, 8) + "." + aRes.ToDate.substring(0, 4);
				sQtr = aRes.Quarter + " of " + aRes.Cal_Year;
				sDate = aRes.DeadlineDate;
				var sMM = sDate.substring(4, 6);
				var sMonth = this._getMonthName(sMM);
				sLink = "https://flpnwc-a95972b99.dispatcher.hana.ondemand.com/sites/aresflp#Hotline-Display";
				sDate = sDate.substring(6, 8) + " " + sMonth + "," + sDate.substring(0, 4);
				var sBody = "Dear Team,\n\n" +
					"Kindly request you to submit your Hotline preferences for the Quarter " + sQtr +
					" for all the hotlines you are responsible for in the Hotline Dashboard : " + sLink +
					"\nDeadline:  " + sDate +
					"\n\nBest Regards,\nARES Hotline Coordination";

				sap.m.URLHelper.triggerEmail("dl_aof-bangalore@exchange.sap.corp;dl_aof-germany@exchange.sap.corp;DL_AOF_VAN@EXCHANGE.SAP.CORP",
					"Enter hotline preferences for the Quarter " + sQtr,
					sBody,
					"ashwini.naik@sap.com;martin.wienkoop@sap.com;thom.wiedmann@sap.com"
				);
			}
		},
		_getMonthName: function(mm) {
			switch (mm) {
				case '01':
					return 'January';
				case '02':
					return 'February';
				case '03':
					return 'March';
				case '04':
					return 'April';
				case '05':
					return 'May';
				case '06':
					return 'June';
				case '07':
					return 'July';
				case '08':
					return 'August';
				case '09':
					return 'September';
				case '10':
					return 'October';
				case '11':
					return 'November';
				case '12':
					return 'December';
			}
		},
		sendReminders: function() {
			var validationResult = this._validate();
			if (validationResult === true) {
				this._update();
				var aRes = [];
				aRes = this.getView().byId("manageForm").getModel("mgr").getData();
				var sQtr, sDate, sLink;
				aRes.FromDate = aRes.FromDate.substring(4, 6) + "." + aRes.FromDate.substring(6, 8) + "." + aRes.FromDate.substring(0, 4);
				aRes.ToDate = aRes.ToDate.substring(4, 6) + "." + aRes.ToDate.substring(6, 8) + "." + aRes.ToDate.substring(0, 4);
				sQtr = aRes.Quarter + " of " + aRes.Cal_Year;
				sDate = aRes.DeadlineDate;
				var sMM = sDate.substring(4, 6);
				var sMonth = this._getMonthName(sMM);
				sLink = "https://flpnwc-a95972b99.dispatcher.hana.ondemand.com/sites/aresflp#Hotline-Display";
				sDate = sDate.substring(6, 8) + " " + sMonth + "," + sDate.substring(0, 4);
				var sBody = "Dear Team,\n\n" +
					"Gentle Reminder for entering preferences for all the hotlines you are responsible for in the Hotline Dashboard : " + sLink +
					"\nDeadline:  " + sDate +
					"\nIn case there is no preference made by you, it would be left to the Hotline admin to decide your hotline weeks." +
					"\n\nBest Regards,\nARES Hotline Coordination";

				sap.m.URLHelper.triggerEmail("dl_aof-bangalore@exchange.sap.corp;dl_aof-germany@exchange.sap.corp;DL_AOF_VAN@EXCHANGE.SAP.CORP",
					"Enter hotline preferences for the Quarter " + sQtr + " [Reminder]",
					sBody,
					"ashwini.naik@sap.com;martin.wienkoop@sap.com;thom.wiedmann@sap.com"
				);
			}
		},
		_update: function() { //private method
			var oModel = this.getView().byId("manageForm").getModel("mgr");
			var aRes = oModel.getData();
			var oEntry = {};
			var sQtr = aRes.Quarter;
			var sYear = aRes.Cal_Year;
			var dFrom = this.getView().byId("__fromDate").getDateValue();
			var dTo = this.getView().byId("__toDate").getDateValue();
			var oWeekFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "w"
			});

			var sWeek = oWeekFormat.format(dFrom);
			oEntry.CwFrom = sWeek;
			sWeek = oWeekFormat.format(dTo);
			oEntry.CwTo = sWeek;
			sap.ui.core.BusyIndicator.show();
			oEntry.Quarter = aRes.Quarter;
			oEntry.Cal_Year = sYear.toString();
			oEntry.Quarter = sQtr;
			oEntry.HotlineNum = aRes.HotlineNum;
			oEntry.FromDate = aRes.FromDate;
			oEntry.ToDate = aRes.ToDate;
			oEntry.DeadlineDate = aRes.DeadlineDate;
			oEntry.ReminderDate = aRes.ReminderDate;
			sap.ui.core.BusyIndicator.show();
			var that = this;
			OData.request({
					requestUri: "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/VariantSet",
					method: "GET",
					headers: {
						"X-Requested-With": "XMLHttpRequest",
						"Content-Type": "application/atom+xml",
						"DataServiceVersion": "2.0",
						"X-CSRF-Token": "Fetch"
					}
				},
				function(data, response) {
					var header_xcsrf_token = response.headers['x-csrf-token'];
					var oHeaders = {
						"x-csrf-token": header_xcsrf_token,
						'Accept': 'application/json',
					};
					OData.request({
							requestUri: "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/VariantSet('" + oEntry.HotlineNum +
								"')",
							method: "PUT",
							headers: oHeaders,
							data: oEntry
						},
						function(data, request) {
							sap.ui.core.BusyIndicator.hide();
							// sap.m.MessageBox.success("Operation Successful");
							//that.setTableModel();
							// that.closeDialog();
						},
						function(err) {
							sap.ui.core.BusyIndicator.hide();
							// sap.m.MessageBox.Error("Operation Failed");
						});
				},
				function(err) {
					var request = err.request;
					var response = err.response;
					sap.ui.core.BusyIndicator.hide();

				});

		},
		_sendMail: function(mailType) { //send mail based on the type : general or reminders
			//to do
		},
		_validate: function() {
			var oModel = this.getView().byId("manageForm").getModel("mgr");
			var aRes = oModel.getData();
			var fromDate, toDate, remDate, dlDate;
			fromDate = aRes.FromDate;
			toDate = aRes.ToDate;
			dlDate = aRes.DeadlineDate;
			remDate = aRes.ReminderDate;
			var dDate, rDate, fDate, tDate;
			var iValFails = 0;
			fDate = new Date(fromDate.substring(0, 4) + "-" + fromDate.substring(4, 6) + "-" + fromDate.substring(6, 8));
			tDate = new Date(toDate.substring(0, 4) + "-" + toDate.substring(4, 6) + "-" + toDate.substring(6, 8));
			dDate = new Date(dlDate.substring(0, 4) + "-" + dlDate.substring(4, 6) + "-" + dlDate.substring(6, 8));
			rDate = new Date(remDate.substring(0, 4) + "-" + remDate.substring(4, 6) + "-" + remDate.substring(6, 8));
			if (fDate > tDate) {
				this.getView().byId("__fromDate").setValueState("Error");
				this.getView().byId("__fromDate").setValueStateText("It should be before Calendar Week (To)");
				iValFails = iValFails + 1;
			} else {
				this.getView().byId("__fromDate").setValueState("None");
				this.getView().byId("__fromDate").setValueStateText("");
			}
			if (dDate > fDate || dDate > tDate) {
				iValFails = iValFails + 1;
				this.getView().byId("__deadlineDate").setValueState("Error");
				this.getView().byId("__deadlineDate").setValueStateText("Deadline Date should be between Calendar Week (From) and Reminder Date");
			} else {
				this.getView().byId("__deadlineDate").setValueState("None");
				this.getView().byId("__deadlineDate").setValueStateText("");
			}
			if (rDate > dDate) {
				// || rDate > dDate || rDate > tDate) {
				iValFails = iValFails + 1;
				this.getView().byId("__remDate").setValueState("Error");
				this.getView().byId("__remDate").setValueStateText("Reminder Date should be before Deadline Date");
			} else {
				this.getView().byId("__remDate").setValueState("None");
				this.getView().byId("__remDate").setValueStateText("");
			}
			if (iValFails === 0) {
				return true;
			}
			return false;
		},
		_showButtons: function(roles) {
			var aStr = roles.split(":");
			var sSuper = aStr[0];
			var sAdmin = aStr[1];
			var sUser = aStr[2];

			if (sSuper === "true") {
				this.getView().byId("__admin2").setVisible(true);
			} else {
				this.getView().byId("__admin2").setVisible(false);
			}
			//admins
			if (sAdmin === "true") {
				this.getView().byId("__admin1").setVisible(true);
				this.getView().byId("__admin3").setVisible(true);
			} else {
				this.getView().byId("__admin3").setVisible(false);
				this.getView().byId("__admin1").setVisible(false);
			}
			//normal user
			if (sUser === "true") {
				this.getView().byId("__admin4").setVisible(true);
			} else {
				this.getView().byId("__admin4").setVisible(false);
			}
		},
		calculateWeeks: function() {
			var dFrom = this.getView().byId("__fromDate").getDateValue();
			var dTo = this.getView().byId("__toDate").getDateValue();
			//calculate Monday of the respective weeks
			var dFromMonday = this._getFirstDayOfWeek(dFrom);
			var dToMonday = this._getFirstDayOfWeek(dTo);

			//find no of weeks between dates
			var iPerWeek = 24 * 60 * 60 * 1000 * 7;
			var totalWeeks = Math.round((dToMonday - dFromMonday) / iPerWeek) + 1;
			if (totalWeeks > 0) {
				this.getView().byId("__totalCW").setText(totalWeeks);
			} else {
				this.getView().byId("__totalCW").setText("CW From Is After CW To ");
			}
			//set Starting Dates of Week
			var sFullDate = this._getFullDate(dFromMonday);
			this.getView().byId("__extraFrom").setText("Week Starting From : " + sFullDate);
			sFullDate = this._getFullDate(dToMonday);
			this.getView().byId("__extraTo").setText("Week Starting From : " + sFullDate);

		},
		_getFullDate: function(pDate) {
			var sDate;
			sDate = pDate.getDate();
			switch (pDate.getMonth()) {
				case 0:
					sDate = sDate + " January";
					break;
				case 1:
					sDate = sDate + " February";
					break;
				case 2:
					sDate = sDate + " March";
					break;
				case 3:
					sDate = sDate + " April";
					break;
				case 4:
					sDate = sDate + " May";
					break;
				case 5:
					sDate = sDate + " June";
					break;
				case 6:
					sDate = sDate + " July";
					break;
				case 7:
					sDate = sDate + " August";
					break;
				case 8:
					sDate = sDate + " September";
					break;
				case 9:
					sDate = sDate + " October";
					break;
				case 10:
					sDate = sDate + " November";
					break;
				case 11:
					sDate = sDate + " December";
					break;
			}
			sDate = sDate + ", " + pDate.getFullYear();
			return sDate;
		},
		_getFirstDayOfWeek: function(pDate) {
			var oWeekFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "w"
			});
			var oYearFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "y"
			});
			var sWeek = oWeekFormat.format(pDate);
			var sYear = oYearFormat.format(pDate);
			var simple = new Date(sYear, 0, 1 + (sWeek - 1) * 7);
			var dow = simple.getDay();
			var ISOweekStart = simple;
			if (dow <= 4) {
				ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
			} else {
				ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
			}
			return ISOweekStart;
		},
		getWeeks: function() {
			var iCalFrom, iCalTo;
			var aData = this.getView().byId("manageForm").getModel("mgr").getData();
			var sQtr = aData.Quarter;
			var sYear = aData.Cal_Year;
			switch (sQtr) {
				case "1":
					iCalFrom = 1;
					iCalTo = 13;
					break;
				case "2":
					iCalFrom = 14;
					iCalTo = 26;
					break;
				case "3":
					iCalFrom = 27;
					iCalTo = 39;
					break;
				case "4":
					iCalFrom = 40;
					iCalTo = 52;
					break;
			}
			var firstDate = new Date(sYear, 0, 1 + (iCalFrom - 1) * 7);
			var firstDay = firstDate.getDay();
			var ISOweekStart = firstDate;
			if (firstDay <= 4) {
				ISOweekStart.setDate(firstDate.getDate() - firstDate.getDay() + 1);
			} else {
				ISOweekStart.setDate(firstDate.getDate() + 8 - firstDate.getDay());
			}
			//add to "from date"
			var endDate = new Date(sYear, 0, 1 + (iCalTo - 1) * 7);
			var lastDay = endDate.getDay();
			var ISOweekEnd = endDate;
			if (lastDay <= 4) {
				ISOweekEnd.setDate(endDate.getDate() - endDate.getDay() + 1);
			} else {
				ISOweekEnd.setDate(endDate.getDate() + 8 - endDate.getDay());
			}
			//add to "end date"
		
			aData.FromDate = this.convertDate(ISOweekStart);
			aData.ToDate = this.convertDate(ISOweekEnd);

			var sFullDate = this._getFullDate(ISOweekStart);
			this.getView().byId("__extraFrom").setText("Week Starting From : " + sFullDate);
			sFullDate = this._getFullDate(ISOweekEnd);
			this.getView().byId("__extraTo").setText("Week Starting From : " + sFullDate);

			//find no of weeks between dates
			var iPerWeek = 24 * 60 * 60 * 1000 * 7;
			var totalWeeks = Math.round((ISOweekEnd - ISOweekStart) / iPerWeek) + 1;
			if (totalWeeks > 0) {
				this.getView().byId("__totalCW").setText(totalWeeks);
			} else {
				this.getView().byId("__totalCW").setText("CW From Is After CW To ");
			}

			//deadline date 
			var tempDate = new Date(ISOweekStart);
			tempDate.setDate(tempDate.getDate() - 7);
			aData.DeadlineDate = this.convertDate(tempDate);
			
			tempDate.setDate(tempDate.getDate() - 7);
			aData.ReminderDate = this.convertDate(tempDate);
			//reminder date
		},
		convertDate: function(pDate) {
			var dd = pDate.getDate().toString();
			dd = ("00" + dd).slice(-2);
			var mm = pDate.getMonth() + 1;
			mm = ("00" + mm.toString()).slice(-2);
			var yyyy = pDate.getFullYear().toString();
			var fDate = yyyy + mm + dd;
			return fDate;
		}
	});
});