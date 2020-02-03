sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function (controller, History) {
	"use strict";
	this.sSuper = false;
	this.sAdmin = false;
	this.sUser = false;
	return controller.extend("Hotline.controller.NotFound", {
		onPressCopyAssignments: function () {
			var sRegion, aData = [];
			if (!this._checkCopy) {
				this.oModel.read("/CheckCountrySet", {
					success: function (oData) {
						sRegion = oData.results[0].Country;
					},
					async: false
				});
				this.oModel.read("/HotlinesSet", {
					success: function (oData) {
						for (var i = 0; i < oData.results.length; i++) {
							if (oData.results[i].Frequency >= "4") {
								aData.push(oData.results[i]);
							}
						}
					},
					async: false
				});

				this._checkCopy = sap.ui.xmlfragment(
					"Hotline.fragment.CheckCopy",
					this
				);
				this.getView().addDependent(this._checkCopy);
				var d = new Date();
				var yy = d.getFullYear();
				var oCopyModel = new sap.ui.model.json.JSONModel({
					region: sRegion,
					source: "",
					target: "",
					s_week: "",
					s_endweek: "",
					s_year: yy,
					s_quarter: "1",
					t_week: "",
					t_endweek: "",
					t_year: yy,
					t_quarter: "2",
					enableCopy: false,
					enableCheck: true,
					enableMsg : false,
					hotlines: aData
				});
				this._checkCopy.setModel(oCopyModel, "copy");
			}
			this._checkCopy.open();
		},
		clearMsg : function(){
			this._resetCopyFields();
		},
		checkCopy: function () {
			var oMsgStrip;
			var aData = this._checkCopy.getModel("copy").getData();
			var bResult = this._validateCopy(aData);
			var oVC = sap.ui.getCore().byId("oMessageContent");
			oVC.destroyContent();
			if (!bResult) {
				oMsgStrip = new sap.m.MessageStrip({
					text: "Source and Target Cannot be same!!",
					showCloseButton: false,
					showIcon: true,
					type: "Error"
				});
				oVC.addContent(oMsgStrip);
			} else {
				var aResult = this._triggerCopy(aData, false);
				var iError;
				for (var i = 0; i < aResult.length; i++) {
					var sType;
					switch (aResult[i].MessageType) {
					case "S":
						sType = "Success";
						break;
					case "E":
						sType = "Error";
						iError = 1;
						break;
					case "I":
						sType = "Information";
						break;
					case "W":
						sType = "Warning";
						break;
					}
					oMsgStrip = new sap.m.MessageStrip({
						text: aResult[i].Message,
						showCloseButton: false,
						showIcon: true,
						type: sType
					});
					oVC.addContent(oMsgStrip);
				}
				if (iError === 1) {
					oMsgStrip = new sap.m.MessageStrip({
						text: "Copy is not possible, please refer above messages",
						showCloseButton: false,
						showIcon: true,
						type: "Error"
					});
					oVC.addContent(oMsgStrip);
				} else {
					oMsgStrip = new sap.m.MessageStrip({
						text: "Copy is possible. Please click on 'Start Copy' to proceed",
						showCloseButton: false,
						showIcon: true,
						type: "Success"
					});
					oVC.addContent(oMsgStrip);
					this._checkCopy.getModel("copy").getData().enableCopy = true;
					this._checkCopy.getModel("copy").getData().enableCheck = false;
					this._checkCopy.getModel("copy").refresh(true);

				}
			}
		},
		checkCondition: function () {
			this._resetCopyFields();
		},
		_resetCopyFields: function () {
			this._checkCopy.getModel("copy").getData().enableCopy = false;
			this._checkCopy.getModel("copy").getData().enableCheck = true;
			this._checkCopy.getModel("copy").refresh(true);
			sap.ui.getCore().byId("oMessageContent").destroyContent();
		},
		startCopy: function () {
			var aData = this._checkCopy.getModel("copy").getData();
			var aResult = this._triggerCopy(aData, true);
			sap.m.MessageBox.information(aResult[0].Message);
		},
		_triggerCopy: function (aData, bMode) {
			var aFilters = [],
				sWeekLow, sWeekHigh;
			var oFilter = new sap.ui.model.Filter("Source", sap.ui.model.FilterOperator.EQ, aData.source);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Target", sap.ui.model.FilterOperator.EQ, aData.target);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, aData.region);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("TestRun", sap.ui.model.FilterOperator.EQ, bMode);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("SourceYear", sap.ui.model.FilterOperator.EQ, aData.s_year);
			aFilters.push(oFilter);
			switch (aData.s_quarter) {
			case "1":
				sWeekHigh = "13";
				sWeekLow = "01";
				break;
			case "2":
				sWeekHigh = "26";
				sWeekLow = "14";
				break;
			case "3":
				sWeekHigh = "39";
				sWeekLow = "27";
				break;
			case "4":
				sWeekHigh = "52";
				sWeekLow = "40";
				break;
			}
			oFilter = new sap.ui.model.Filter("SourceWeek", sap.ui.model.FilterOperator.EQ, sWeekLow);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("SourceEndWeek", sap.ui.model.FilterOperator.EQ, sWeekHigh);
			aFilters.push(oFilter);
			if (bMode) {
				switch (aData.t_quarter) {
				case "1":
					sWeekHigh = "13";
					sWeekLow = "01";
					break;
				case "2":
					sWeekHigh = "26";
					sWeekLow = "14";
					break;
				case "3":
					sWeekHigh = "39";
					sWeekLow = "27";
					break;
				case "4":
					sWeekHigh = "52";
					sWeekLow = "40";
					break;
				}
				oFilter = new sap.ui.model.Filter("TargetYear", sap.ui.model.FilterOperator.EQ, aData.t_year);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("TargetWeek", sap.ui.model.FilterOperator.EQ, sWeekLow);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("TargetEndWeek", sap.ui.model.FilterOperator.EQ, sWeekHigh);
				aFilters.push(oFilter);
			}
			var aData = [];
			this.oModel.read("/CopyRowsSet", {
				filters: aFilters,
				success: function (oData) {
					aData = oData.results;
				},
				async: false
			});
			return aData;
		},
		_validateCopy: function (aData) {
			if (aData.source === aData.target && aData.t_year === aData.s_year && aData.s_quarter === aData.t_quarter) {
				return false;
			}
			return true;
		},
		closeCheck: function () {
			this._checkCopy.close();
		},
		onInit: function () {
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/";
			//change before upload
			var oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			var oGlobalModel = new sap.ui.model.json.JSONModel();
			oModel.read("/UserRolesSet", {
				success: function (oData) {
					oGlobalModel.setData(oData.results);
				}
			});
			sap.ui.getCore().setModel(oGlobalModel, "roles");
		},
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		onNavBack: function (oEvent) {
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("appHome", {}, true /*no history*/ );
			}
		},
		navToHome: function () {
			this.getRouter().navTo("appHome", {}, true /*no history*/ );
		},
		navToAdmin: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("admin");
		},
		navToAssign: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oModel.read("/CheckCountrySet", {
				success: function (oData) {
					if (oData.results[0].Country === "IN") {
						oRouter.navTo("in_assign");
					} else if (oData.results[0].Country === "DE") {
						oRouter.navTo("de_assign");
					} else {
						oRouter.navTo("ca_assign");
					}
				}
			});

		},
		navToMain: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oModel.read("/CheckCountrySet", {
				success: function (oData) {
					if (oData.results[0].Country === "IN") {
						oRouter.navTo("main");
					} else if (oData.results[0].Country === "DE") {
						oRouter.navTo("main_DE");
					} else {
						oRouter.navTo("main_CA");
					}
				}
			});
		},
		setRoles: function () {
			var aRoles = sap.ui.getCore().getModel("roles").oData;
			this.sSuper = false;
			for (var i = 0; i < aRoles.length; i++) {
				if (aRoles[i].Role === "SUPER" && aRoles[i].Admin === "Y") {
					this.sSuper = true;
				} else if (aRoles[i].Role !== "SUPER") {
					if (aRoles[i].Admin === "Y") {
						this.sAdmin = true;
					}
					if (aRoles[i].EndUser === "Y") {
						this.sUser = true;
					}
				}
			}
			var sFinal = this.sSuper + ":" + this.sAdmin + ":" + this.sUser;
			return sFinal;
		},
		openFinalizeDialog: function () {
			var that = this;
			this.oHLModel = new sap.ui.model.json.JSONModel();
			//	if (!this._oFinalDialog) {
			this._oFinalDialog = sap.ui.xmlfragment("Hotline.view.Finalize", this);
			this.oModel.read("/HotlineAdminSet", {
				success: function (oData) {
					that.oHLModel.setData(oData);
				}
			});
			sap.ui.getCore().setModel(this.oHLModel, "final");

			//	}
			this._oFinalDialog.open();
		},
		closeFinalDialog: function () {
			this._oFinalDialog.close();
			sap.ui.getCore().byId("__dialogSelect").setSelectedKey("");
			var oDialogModel = new sap.ui.model.json.JSONModel();
			sap.ui.getCore().setModel(oDialogModel, "finalDialog");
		},
		onChangeFinalHotline: function (oControlEvent) {
			var oDialogModel = new sap.ui.model.json.JSONModel();
			var sKey = oControlEvent.mParameters.selectedItem.mProperties.key;
			var aStr = sKey.split("||");
			sKey = aStr[0];
			this.oModel.read("/FinalizeSet('" + sKey + "')", {
				success: function (oData) {
					oDialogModel.setData(oData);
				}
			});
			sap.ui.getCore().setModel(oDialogModel, "finalDialog");
		},
		navToAssignV: function () {
			this._oFinalDialog.destroy();
			this.navToAssign();
		},
		destroyDialog: function () {
			this._oFinalDialog.destroy();
		},
		sendFinalAssign: function () {
			this.oModel.read("/VariantSet('')", {
				success: function (oData) {
					var aRes = oData;
					aRes.FromDate = aRes.FromDate.substring(4, 6) + "." + aRes.FromDate.substring(6, 8) + "." + aRes.FromDate.substring(0, 4);
					aRes.ToDate = aRes.ToDate.substring(4, 6) + "." + aRes.ToDate.substring(6, 8) + "." + aRes.ToDate.substring(0, 4);
					var sQtr = aRes.Quarter + " of " + aRes.Cal_Year;
					var sLink = "https://flpnwc-a95972b99.dispatcher.hana.ondemand.com/sites/aresflp#Hotline-Display";
					var sBody = "Dear Team,\n\nThanks for submitting your hotline preferences for the Quarter " + sQtr + ".\n" +
						"The finalized assignments are published in the Hotline Dashboard : " + sLink + ".\n\nBest Regards,\n" +
						"ARES Hotline Coordination";

					sap.m.URLHelper.triggerEmail(
						"dl_aof-bangalore@exchange.sap.corp;dl_aof-germany@exchange.sap.corp;DL_AOF_VAN@EXCHANGE.SAP.CORP",
						"Hotline assignments finalized and published for the Quarter " + sQtr,
						sBody,
						"ashwini.naik@sap.com;martin.wienkoop@sap.com;thom.wiedmann@sap.com"
					);
				}
			});

		},
		showAssgnHelp: function () {
			if (!this._helpDialog) {
				this._helpDialog = sap.ui.xmlfragment("Hotline.view.AssignHelp", this);
			}
			this._helpDialog.open();
		},
		closeHelpAssgn: function () {
			this._helpDialog.close();
		},
		destroyAssgn: function () {
			this._helpDialog = undefined;
			this._helpDialog.destroy();
		},
		closeBug: function () {
			this.reportBugSheet.close();
		},
		submitBug: function (oEvent) {
			var aData = this.reportBugSheet.getModel("bug").getData();
			var bState = this._validateFields(aData);
			if (bState) {
				var oEntry = {
					Tool: aData.Tool,
					Priority: aData.Priority,
					Summary: aData.Summary,
					Description: aData.Description,
					IssueType: aData.IssueType,
					Component: aData.Component
				};
				var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV");
				oModel.create("/ReportBugSet", oEntry);
				sap.m.MessageToast.show("Developer will be informed via Mail");
				this.closeBug();
			} else {
				sap.m.MessageToast.show("All Fields are mandatory");
			}
		},
		_validateFields: function (aData) {
			if (aData.Summary.length === 0) {
				return false;
			}
			if (aData.Description.length === 0) {
				return false;
			}
			return true;
		},
		openReportBug: function () {
			if (!this.reportBugSheet) {
				this.reportBugSheet = sap.ui.xmlfragment(
					"Hotline.view.ReportBug",
					this
				);
				this.getView().addDependent(this.reportBugSheet);
				var oCompModel = new sap.ui.model.json.JSONModel();
				var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV");
				oModel.read("/ComponentSet", {
					success: function (oData) {
						oCompModel.setData(oData);
					},
					error: function () {
						var oData = {};
						oData.results = [];
						oData.results[0] = {
							ComponentId: "72963",
							Text: "TOOLS - DASHBOARDS"
						};
						oCompModel.setData(oData);
					}
				});
				this.reportBugSheet.setModel(oCompModel, "comp");
			}
			var oBugModel = new sap.ui.model.json.JSONModel({
				Tool: "HLDB", //Insert your app id 
				Priority: "3",
				Summary: "",
				Description: "",
				IssueType: "1",
				Component: "72963"
			});
			this.reportBugSheet.setModel(oBugModel, "bug");
			this.reportBugSheet.open();
		}
	});

});