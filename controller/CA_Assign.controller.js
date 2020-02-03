sap.ui.define(["Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	return BaseController.extend("Hotline.controller.CA_Assign", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("ca_assign").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/";
			//change before upload
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			var that = this;
			var oEditModel = new sap.ui.model.json.JSONModel({
				HotlineNum: "",
				CalendarWeek: "",
				CalYear: "",
				CommentText: "",
				CommentId: "",
				visible: "No"
			});
			this._setScreenVariables();
			this.getView().setModel(oEditModel, "editComment");
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.oModel);
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, "1");
			aFilters.push(oFilter);
			this.oModel.read("/UserDetailsSet", {
				filters: aFilters,
				success: function(oData) {
					oHeaderModel.setData(oData.results);
					that.getView().setModel(oHeaderModel, "head");
				}
			});
			this.oModel.read("/HotlineAdminSet", {
				success: function(oData) {
					if (oData.results.length > 0) {
						that._showAdminTabs(oData);
					} else {
						var dialog = new sap.m.Dialog({
							title: 'Error',
							type: 'Message',
							content: new sap.m.Text({
								text: 'Oops!! Looks like you are not assigned as Admin for any of the hotlines. Please see Help section to know more.'
							}),
							beginButton: new sap.m.Button({
								text: 'Go Back',
								press: function() {
									dialog.close();
									var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
									oRouter.navTo("");
								}
							}),
							afterClose: function() {
								dialog.destroy();
							}
						});
						dialog.open();
					}
				},
				error: function(oResponse) {
					console.log(oResponse);
				}
			});
		},
		_setScreenVariables: function() {
			var oAdvModel = new sap.ui.model.json.JSONModel({
				state: true,
				monthly: false,
				genBtn: true
			});
			this.getView().setModel(oAdvModel, "adv");
		},
		refreshAssignments: function() {
			this._setScreenVariables();
			var oIconTab = this.getView().byId("__mainTab");
			var sKey = oIconTab.getSelectedKey();
			this._getData(sKey);
		},
		_showAdminTabs: function(oData) {
			var oIconTab = this.getView().byId("__mainTab");
			oIconTab.destroyItems();
			var oAdminModel = new sap.ui.model.json.JSONModel();
			oAdminModel.setData(oData);
			oIconTab.setModel(oAdminModel, "itab");
			oIconTab.bindAggregation("items", "itab>/results", new sap.m.IconTabFilter({
				key: "{itab>HotlineNum}",
				text: "{itab>HotlineTxt}"
			}));
			oIconTab.setSelectedKey(oData.results[0].HotlineNum);
			this._showTable(oData.results[0].HotlineNum, "CA");
		},
		_showTable: function(pHotline, pCountry) {
			var aFilters = [];
			var that = this;
			var oFilter = new sap.ui.model.Filter("Hotline", sap.ui.model.FilterOperator.EQ, pHotline.toString());
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Country", sap.ui.model.FilterOperator.EQ, pCountry.toString());
			aFilters.push(oFilter);
			this.oModel.read("/HotlineTypeSet", {
				filters: aFilters,
				success: function(oData) {
					var oTableShowModel = new sap.ui.model.json.JSONModel({
						table: oData.results[0].Frequency,
						type: oData.results[0].ManageType
					});
					that.getView().setModel(oTableShowModel, "tableType");
					that._getData(pHotline);
				}
			});
		},
		onSelectTab: function(oEvent) {
			this._setScreenVariables();
			this._showTable(oEvent.getSource().getSelectedKey(), "CA");
		},
		_getData: function(pHotline) {
			var aFilters = [],
				sPath,
				that = this;
			var oTabModel = new sap.ui.model.json.JSONModel();
			var aHeadData = this.getView().getModel("head").getData();
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, pHotline);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
			aFilters.push(oFilter);
			//call depending on type of tab selected
			var sTableType = this.getView().getModel("tableType").getData();

			if (sTableType.table === "W") {
				sPath = "/WeeklyAssignmentSet";
				oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Country", sap.ui.model.FilterOperator.EQ, "CA");
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read(sPath, {
					filters: aFilters,
					success: function(oData) {
						oTabModel.setData(oData);
						that.getView().setModel(oTabModel, "week");
					}
				});
			} else if (sTableType.table === "G") {
				var aTentFilter = [],
					sCw;
				oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, pHotline);
				aTentFilter.push(oFilter);
				if (aHeadData[0].Quarter === "01") {
					sCw = "01";
				} else if (aHeadData[0].Quarter === "02") {
					sCw = "14";
				} else if (aHeadData[0].Quarter === "03") {
					sCw = "27";
				} else if (aHeadData[0].Quarter === "04") {
					sCw = "40";
				}
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, sCw);
				aTentFilter.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aTentFilter.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				sPath = "/DE_Assignment_PeerSet";
				this.oModel.read(sPath, {
					filters: aFilters,
					success: function(oData) {
						oTabModel.setData(oData);
						that.oModel.read("/TentativeSet", {
							filters: aTentFilter,
							success: function(oTentativeList) {
								for (var i = 0; i < oData.results.length; i++) {
									oData.results[i].tentative = [];
									for (var j = 0; j < oTentativeList.results.length; j++) {
										if (oData.results[i].CW === oTentativeList.results[j].CalendarWeek) {
											oTentativeList.results[j].selected = false;
											oData.results[i].tentative.push(oTentativeList.results[j]);
										}
									}
								}
								oTabModel.setData(oData);
								that.getView().setModel(oTabModel, "tab");

							},
							error: function() {
								sap.ui.core.BusyIndicator.hide();
							}
						});
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			} else if (sTableType.table === "D") {
				sPath = "/DayAssignmentSet";
				oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, "CA");
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read(sPath, {
					filters: aFilters,
					success: function(oData) {
						oTabModel.setData(oData);
						that.getView().setModel(oTabModel, "daily");
					},
					async: false
				});
			} else if (sTableType.table === "M") {
				sPath = "/MonthAssignmentSet";
				oFilter = new sap.ui.model.Filter("Month", sap.ui.model.FilterOperator.EQ, aHeadData[0].Month);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, "CA");
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read(sPath, {
					filters: aFilters,
					success: function(oData) {
						oTabModel.setData(oData);
						that.getView().setModel(oTabModel, "daily");
					},
					async: false
				});
			}
			//get list of users
			this._getUsers();
			//check the current state of
			this._checkState();
			//check the current state of the hotlines in all countries.
			this._checkSavedStatus();

			sap.ui.core.BusyIndicator.hide();
		},
		checkPressedState: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			var sParentPath = sPath.split("/tentative/")[0];
			var sCurrentIndex = sPath.split("/tentative/")[1];
			var aData = this.getView().getModel("tab").getProperty(sParentPath);
			for (var i = 0; i < aData.tentative.length; i++) {
				if (i == sCurrentIndex) {
					aData.tentative[i].selected = true;
				} else {
					aData.tentative[i].selected = false;
				}
			}
		},
		_getUsers: function() {
			var oIconTab = this.getView().byId("__mainTab");
			var sKey = oIconTab.getSelectedKey();
			var aFilters = [];
			var oUserModelDe = new sap.ui.model.json.JSONModel();
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sKey + "_CAN");
			aFilters.push(oFilter);
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
					oUserModelDe.setData(oData);
				},
				async: false
			});
			this.getView().setModel(oUserModelDe, "can");
		},
		_checkState: function() {
			var that = this;
			var oIconTab = this.getView().byId("__mainTab");
			var sKey = oIconTab.getSelectedKey();
			var aHeadData = this.getView().getModel("head").oData[0];
			var sYear = aHeadData.Year;
			var sTableType = this.getView().getModel("tableType").getData().table;
			if (sTableType === "M") {
				var sMonth = aHeadData.Month;
				var sPath = "/MonthStatusSet(Hotline='" + sKey + "',Month='" + sMonth + "',Year='" + sYear + "')";
				this.oModel.read(sPath, {
					success: function(oData) {
						var state = oData.Status;
						if (state === "OPEN") {
							//dont assign
							that.getView().byId("__msgStrip").setVisible(true);
							that.getView().byId("__msgStrip").setText("Since the preferences are still open, changes cannot be saved yet");
							that.getView().byId("__aBtn1").setVisible(false);
							that.getView().byId("__aBtn2").setVisible(false);
						} else if (state === "SAVE") {
							//can assign
							that.getView().byId("__msgStrip").setVisible(false);
							that.getView().byId("__msgStrip").setText("");
							that.getView().byId("__aBtn1").setVisible(true);
							that.getView().byId("__aBtn2").setVisible(true);
						} else if (state === "FINALIZED" || state === "CLOSED") {
							//cant change 
							that.getView().byId("__msgStrip").setText("Preferences are locked/not yet open.No changes allowed");
							that.getView().byId("__msgStrip").setVisible(true);
							that.getView().byId("__aBtn1").setVisible(false);
							that.getView().byId("__aBtn2").setVisible(false);
						}
					}
				});
			} else {
				var sQtr = aHeadData.Quarter;
				var aFilters = [];
				var oFilter, sLow, sHigh;
				if (sQtr === "01") {
					sLow = "01";
					sHigh = "13";
				} else if (sQtr === "02") {
					sLow = "14";
					sHigh = "26";
				} else if (sQtr === "03") {
					sLow = "27";
					sHigh = "39";
				} else if (sQtr === "04") {
					sLow = "40";
					sHigh = "52";
				}
				this.state = "";
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sKey);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Cw_from", sap.ui.model.FilterOperator.EQ, sLow);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Cw_to", sap.ui.model.FilterOperator.EQ, sHigh);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, sYear);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/FinalizeSet", {
					filters: aFilters,
					success: function(oData) {
						that.state = oData.results[0].Status;
						if (that.state === "OPEN") {
							//dont assign
							that.getView().byId("__msgStrip").setVisible(true);
							that.getView().byId("__msgStrip").setText("Since the preferences are still open, changes cannot be saved yet");
							that.getView().byId("__aBtn1").setVisible(false);
							that.getView().byId("__aBtn2").setVisible(false);
						} else if (that.state === "SAVE") {
							//can assign
							that.getView().byId("__msgStrip").setVisible(false);
							that.getView().byId("__msgStrip").setText("");
							that.getView().byId("__aBtn1").setVisible(true);
							that.getView().byId("__aBtn2").setVisible(true);
						} else if (that.state === "FINALIZED" || that.state === "CLOSED") {
							//cant change 
							that.getView().byId("__msgStrip").setText("Preferences are locked/not yet open.No changes allowed");
							that.getView().byId("__msgStrip").setVisible(true);
							that.getView().byId("__aBtn1").setVisible(false);
							that.getView().byId("__aBtn2").setVisible(false);
						}
						sap.ui.core.BusyIndicator.hide();
					},
					async: false
				});
			}
		},
		_checkSavedStatus: function() {
			var sTableType = this.getView().getModel("tableType").getData().table;
			var sQtr = this.getView().getModel("head").oData[0].Quarter;
			var sYear = this.getView().getModel("head").oData[0].Year;
			var oIconTab = this.getView().byId("__mainTab");
			var sHotline = oIconTab.getSelectedKey();
			if (sTableType === "M") {
				sQtr = this.getView().getModel("head").oData[0].Month;
			}
			var sPath = "/SavedStatusSet(Hotline='" + sHotline + "',Quarter='" + sQtr + "',Year='" + sYear + "')";
			var oStatModel = new sap.ui.model.json.JSONModel();
			this.oModel.read(sPath, {
				success: function(oData) {
					oStatModel.setData(oData);
				}
			});
			this.getView().setModel(oStatModel, "stat");
		},
		//only for daily
		clearDailyInput: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			sap.ui.getCore().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("daily").getPath();
			var oSelectedRow = this.getView().byId("__dailyTable").getModel("daily").getProperty(sPath);
			oSelectedRow.PrimaryUser = "";
			oSelectedRow.PrimaryUserName = "";
			oSelectedRow.P1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeDailyStatus(sPath, oRow);
		},
		clearDailyBackupInput: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			sap.ui.getCore().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("daily").getPath();
			var oSelectedRow = this.getView().byId("__dailyTable").getModel("daily").getProperty(sPath);
			oSelectedRow.BackupUser = "";
			oSelectedRow.BackupUserName = "";
			oSelectedRow.B1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeDailyStatus(sPath, oRow);
		},
		_changeDailyStatus: function(pPath, row) {
			var iCtr = 0;
			var oTable = this.getView().byId("__dailyTable");
			var oTableModel = oTable.getModel("daily");
			var rowData = oTableModel.getProperty(pPath);
			var sTableType = this.getView().getModel("tableType").getData();
			sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignYellow");
			sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignGreen");
			sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignRed");
			if (rowData.PrimaryUserName.length > 0) {
				iCtr = iCtr + 1;
			}
			if (sTableType.type === "PB") {
				if (rowData.BackupUserName.length > 0) {
					iCtr = iCtr + 1;
				}
				if (iCtr === 2) {
					sap.ui.getCore().byId(row[1].sId).addStyleClass("assignGreen");
				} else if (iCtr === 1) {
					sap.ui.getCore().byId(row[1].sId).addStyleClass("assignYellow");
				} else {
					sap.ui.getCore().byId(row[1].sId).addStyleClass("assignRed");
				}
			} else if (sTableType.type === "PO") {
				if (iCtr === 1) {
					sap.ui.getCore().byId(row[1].sId).addStyleClass("assignGreen");
				} else {
					sap.ui.getCore().byId(row[1].sId).addStyleClass("assignRed");
				}
			}
			//change cell colors
			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");

			sap.ui.getCore().byId(row[3].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[3].getItems()[0].sId).removeStyleClass("rColor");

			if (rowData.P1_Color === "P") {
				sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
			} else if (rowData.P1_Color === "R") {
				sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
			}
			if (sTableType.type === "PB") {
				if (rowData.B1_Color === "P") {
					sap.ui.getCore().byId(row[3].getItems()[0].sId).addStyleClass("pColor");
				} else if (rowData.B1_Color === "R") {
					sap.ui.getCore().byId(row[3].getItems()[0].sId).addStyleClass("rColor");
				}
			}
		},
		updateDailyTableColors: function() {
			var oTable = this.getView().byId("__dailyTable");
			var i, row = [],
				sPath, rowData;
			var oTableModel = oTable.getModel("daily");
			var aData = oTableModel.getData();
			if (aData.results.length > 0) {
				var oItems = oTable.getItems();
				for (i = 0; i < oItems.length; i++) {
					var iCtr = 0;
					row = oItems[i].getCells();
					sPath = oItems[i].getBindingContextPath();
					rowData = oTableModel.getProperty(sPath);
					if (rowData.PrimaryUserName.length > 0) {
						iCtr = iCtr + 1;
					}
					if (rowData.BackupUserName.length > 0) {
						iCtr = iCtr + 1;
					}
					sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignYellow");
					sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignGreen");
					sap.ui.getCore().byId(row[1].sId).removeStyleClass("assignRed");
					if (iCtr === 2) {
						sap.ui.getCore().byId(row[1].sId).addStyleClass("assignGreen");
					} else if (iCtr === 1) {
						sap.ui.getCore().byId(row[1].sId).addStyleClass("assignYellow");
					} else {
						sap.ui.getCore().byId(row[1].sId).addStyleClass("assignRed");
					}

					//change cell colors
					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");

					sap.ui.getCore().byId(row[3].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[3].getItems()[0].sId).removeStyleClass("rColor");

					if (rowData.P1_Color === "P") {
						sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
					} else if (rowData.P1_Color === "R") {
						sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
					}

					if (rowData.B1_Color === "P") {
						sap.ui.getCore().byId(row[3].getItems()[0].sId).addStyleClass("pColor");
					} else if (rowData.B1_Color === "R") {
						sap.ui.getCore().byId(row[3].getItems()[0].sId).addStyleClass("rColor");
					}
				}
			}
		},
		//only for daily
		//only for weekly
		clearInput: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			sap.ui.getCore().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("week").getPath();
			var oSelectedRow = this.getView().byId("__table1").getModel("week").getProperty(sPath);
			oSelectedRow.PrimaryUser = "";
			oSelectedRow.PrimaryUserName = "";
			oSelectedRow.P1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeWeekStatus(sPath, oRow);
		},
		clearInputBackup: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			sap.ui.getCore().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("week").getPath();
			var oSelectedRow = this.getView().byId("__table1").getModel("week").getProperty(sPath);
			oSelectedRow.BackupUser = "";
			oSelectedRow.BackupUserName = "";
			oSelectedRow.B1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeWeekStatus(sPath, oRow);
		}, //end of only for weekly
		//only for Peers
		clearWeeklyInputBackup: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			this.getView().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("tab").getPath();
			var oSelectedRow = this.getView().byId("__table0").getModel("tab").getProperty(sPath);
			oSelectedRow.BackupUser = "";
			oSelectedRow.BackupUserName = "";
			oSelectedRow.B1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeRowStatus(sPath, oRow);
		},
		clearWeeklyInput: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			this.getView().byId(sID).setValue("");
			var sPath = oControlEvent.getSource().getParent().getBindingContext("tab").getPath();
			var oSelectedRow = this.getView().byId("__table0").getModel("tab").getProperty(sPath);
			oSelectedRow.PrimaryUser = "";
			oSelectedRow.PrimaryUserName = "";
			oSelectedRow.P1_Color = "";
			var oRow = oControlEvent.getSource().getParent().getParent().getCells();
			this._changeRowStatus(sPath, oRow);
		},
		onUpdateWeeklyTable: function() {
			var oTable = this.getView().byId("__table0");
			var i, row = [],
				sPath, rowData;
			var oTableModel = oTable.getModel("tab");
			var aData = oTableModel.getData();
			if (aData.results.length > 0) {
				var oItems = oTable.getItems();
				for (i = 0; i < oItems.length; i++) {

					row = oItems[i].getCells();
					sPath = oItems[i].getBindingContextPath();
					rowData = oTableModel.getProperty(sPath);

					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignYellow");
					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignGreen");
					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignRed");

					//Green if atleast primary is selected, yellow if only peer, red if primary not selected
					if (rowData.PrimaryUserName.length > 0) {
						sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
					} else { //red
						if (rowData.BackupUserName.length > 0) {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignYellow");
						} else {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
						}
					}

					//change cell colors
					sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("rColor");

					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");

					if (rowData.P1_Color === "P") {
						sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("pColor");
					} else if (rowData.P1_Color === "R") {
						sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("rColor");
					}

					if (rowData.B1_Color === "P") {
						sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
					} else if (rowData.B1_Color === "R") {
						sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
					}
				}
			}
		},
		_changeRowStatus: function(pPath, row) {
			var iCtr = 0;
			var oTable = this.getView().byId("__table0");
			var oTableModel = oTable.getModel("tab");
			var rowData = oTableModel.getProperty(pPath);
			if (rowData.PrimaryUserName.length > 0) {
				iCtr = iCtr + 1;
			}
			if (rowData.BackupUserName.length > 0) {
				iCtr = iCtr + 1;
			}
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignYellow");
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignGreen");
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignRed");
			//Green if atleast primary is selected, yellow if only peer, red if primary not selected
			if (rowData.PrimaryUserName.length > 0) {
				sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
			} else { //red
				if (rowData.BackupUserName.length > 0) {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignYellow");
				} else {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
				}
			}

			//change cell colors
			sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("rColor");

			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");
			if (rowData.P1_Color === "P") {
				sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("pColor");
			} else if (rowData.P1_Color === "R") {
				sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("rColor");
			}

			if (rowData.B1_Color === "P") {
				sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
			} else if (rowData.B1_Color === "R") {
				sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
			}
		},
		swapNames: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			var oModel = this.getView().byId("__table0").getModel("tab");
			var oRow = oModel.getProperty(sPath);
			var sTemp = oRow.PrimaryUser;
			oRow.PrimaryUser = oRow.BackupUser;
			oRow.BackupUser = sTemp;

			sTemp = oRow.PrimaryUserName;
			oRow.PrimaryUserName = oRow.BackupUserName;
			oRow.BackupUserName = sTemp;

			sTemp = oRow.P1_Color;
			oRow.P1_Color = oRow.B1_Color;
			oRow.B1_Color = sTemp;

			oModel.refresh(true);

		},
		// Only push names to peer field, never to primary
		pushNames: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			var oModel = this.getView().byId("__table0").getModel("tab");
			var oRow = oModel.getProperty(sPath);
			var aTentative = oRow.tentative;
			if (aTentative.length >= 1) {
				for (var i = 0; i < aTentative.length; i++) {
					if (aTentative[i].selected === true) {
						var sPrimary = oRow.PrimaryUserName;
						var sBackup = oRow.BackupUserName;
						if (sPrimary.length === 0) {
							if (sBackup !== aTentative[i].Name) {
								oRow.PrimaryUserName = aTentative[i].Name;
								oRow.P1_Color = "M";
								sPrimary = aTentative[i].Name;
								oRow.PrimaryUser = aTentative[i].Id;
							}
						} else if (sBackup.length === 0) {
							if (sPrimary !== aTentative[i].Name) {
								oRow.BackupUserName = aTentative[i].Name;
								oRow.B1_Color = "M";
								sBackup = aTentative[i].Name;
								oRow.BackupUser = aTentative[i].Id;
							} else {
								sap.m.MessageToast.show("Primary and Peer Cannot be same");
							}
						}
					}
				}
				oModel.refresh(true);
			} else {
				sap.m.MessageToast.show("Please select a name");
			}
		},
		//end of only for peers
		//for weekly tables
		onUpdateTable: function() {
			var oTable = this.getView().byId("__table1");
			var i, row = [],
				sPath, rowData;
			var oTableModel = oTable.getModel("week");
			var aData = oTableModel.getData();
			var sTableType = this.getView().getModel("tableType").getData();
			if (aData.results.length > 0) {
				var oItems = oTable.getItems();
				for (i = 0; i < oItems.length; i++) {
					var iCtr = 0;

					row = oItems[i].getCells();
					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignYellow");
					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignGreen");
					sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignRed");
					sPath = oItems[i].getBindingContextPath();
					rowData = oTableModel.getProperty(sPath);
					if (rowData.PrimaryUserName.length > 0) {
						iCtr = iCtr + 1;
					}
					if (sTableType.type === "PB") {
						if (rowData.BackupUserName.length > 0) {
							iCtr = iCtr + 1;
						}
						if (iCtr === 2) {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
						} else if (iCtr === 1) {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignYellow");
						} else {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
						}
					} else if (sTableType.type === "PO") {
						if (iCtr === 1) {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
						} else {
							sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
						}
					}

					//change cell colors
					sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("rColor");

					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");
					if (rowData.P1_Color === "P") {
						sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("pColor");
					} else if (rowData.P1_Color === "R") {
						sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("rColor");
					}
					if (sTableType.type === "PB") {
						if (rowData.B1_Color === "P") {
							sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
						} else if (rowData.B1_Color === "R") {
							sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
						}
					}
				}
			}
		},
		_changeWeekStatus: function(pPath, row) {
			var iCtr = 0;
			var oTable = this.getView().byId("__table1");
			var oTableModel = oTable.getModel("week");
			var rowData = oTableModel.getProperty(pPath);
			var sTableType = this.getView().getModel("tableType").getData();
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignYellow");
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignGreen");
			sap.ui.getCore().byId(row[0].sId).removeStyleClass("assignRed");
			if (rowData.PrimaryUserName.length > 0) {
				iCtr = iCtr + 1;
			}
			if (sTableType.type === "PB") {
				if (rowData.BackupUserName.length > 0) {
					iCtr = iCtr + 1;
				}
				if (iCtr === 2) {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
				} else if (iCtr === 1) {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignYellow");
				} else {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
				}
			} else if (sTableType.type === "PO") {
				if (iCtr === 1) {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignGreen");
				} else {
					sap.ui.getCore().byId(row[0].sId).addStyleClass("assignRed");
				}
			}

			//change cell colors
			sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[1].getItems()[0].sId).removeStyleClass("rColor");

			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("pColor");
			sap.ui.getCore().byId(row[2].getItems()[0].sId).removeStyleClass("rColor");

			if (rowData.P1_Color === "P") {
				sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("pColor");
			} else if (rowData.P1_Color === "R") {
				sap.ui.getCore().byId(row[1].getItems()[0].sId).addStyleClass("rColor");
			}
			if (sTableType.type === "PB") {
				if (rowData.B1_Color === "P") {
					sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("pColor");
				} else if (rowData.B1_Color === "R") {
					sap.ui.getCore().byId(row[2].getItems()[0].sId).addStyleClass("rColor");
				}
			}
		},
		//end of weekly tables
		//generic methods
		saveAll: function(sMessage) {
			var sMsg;
			if (sMessage === "lock") {
				sMsg = "Assignments saved and locked";
			} else {
				sMsg = "Assignments saved";
			}
			var oTable, oTabModel;
			var batchChanges = [];
			var sFirst, sLast;
			var that = this;
			var i;
			var oEntry = {};
			var sWeek, sYear, sHotline, sQtr, sPath, row;
			sap.ui.core.BusyIndicator.show();
			var sTableType = this.getView().getModel("tableType").getData();
			if (sTableType.table === "W") {
				oTable = this.getView().byId("__table1");
				oTabModel = oTable.getModel("week").getData();
				batchChanges = [];
				for (i = 0; i < oTabModel.results.length; i++) {
					sWeek = oTabModel.results[i].CW;
					sYear = oTabModel.results[i].Year;
					sHotline = oTabModel.results[i].HotlineNum;
					sPath = "WeeklyAssignmentSet(Country='DE',CW='" + sWeek + "',HotlineNum='" + sHotline + "',Year='" + sYear + "')";
					if (i === 0) {
						sFirst = sWeek;
					}
					if (i === oTabModel.results.length - 1) {
						sLast = sWeek;
					}
					row = oTabModel.results[i];
					if (row.PrimaryUserName === "") {
						row.PrimaryUser = "";
					}
					if (row.BackupUserName === "") {
						row.BackupUser = "";
					}
					sQtr = row.Quarter;
					oEntry = {};
					oEntry.CW = sWeek;
					oEntry.Country = "CA";
					oEntry.HotlineNum = sHotline;
					oEntry.FromDate = row.FromDate;
					oEntry.ToDate = row.ToDate;
					oEntry.PrimaryUser = row.PrimaryUser;
					oEntry.PrimaryUserName = "";
					oEntry.BackupUser = row.BackupUser;
					oEntry.BackupUserName = "";
					oEntry.Quarter = row.Quarter;
					oEntry.Year = row.Year;
					oEntry.Edit = "";
					oEntry.Comment = "";
					oEntry.P1_Color = "";
					oEntry.B1_Color = "";
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
			} else if (sTableType.table === "G") {
				oTable = this.getView().byId("__table0");
				oTabModel = oTable.getModel("tab").getData();
				batchChanges = [];
				for (i = 0; i < oTabModel.results.length; i++) {

					sWeek = oTabModel.results[i].CW;
					sYear = oTabModel.results[i].Year;
					sHotline = oTabModel.results[i].HotlineNum;
					//spath = DE_Assignment_PeerSet(CW='01',HotlineNum='AOF')
					sPath = "DE_Assignment_PeerSet(CW='" + sWeek + "',HotlineNum='" + sHotline + "')";
					if (i === 0) {
						sFirst = sWeek;
					}
					if (i === oTabModel.results.length - 1) {
						sLast = sWeek;
					}
					row = oTabModel.results[i];
					if (row.PrimaryUserName === "") {
						row.PrimaryUser = "";
					}
					if (row.BackupUserName === "") {
						row.BackupUser = "";
					}
					sQtr = row.Quarter;
					oEntry = {};
					oEntry.CW = sWeek;
					oEntry.HotlineNum = sHotline;
					oEntry.FromDate = row.FromDate;
					oEntry.ToDate = row.ToDate;
					oEntry.PrimaryUser = row.PrimaryUser;
					oEntry.PrimaryUserName = "";
					oEntry.BackupUser = row.BackupUser;
					oEntry.BackupUserName = "";
					oEntry.Quarter = row.Quarter;
					oEntry.Year = row.Year;
					oEntry.Edit = "";
					oEntry.Comment = "";
					oEntry.P1_Color = "";
					oEntry.B1_Color = "";

					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
			} else if (sTableType.table === "D" || sTableType.table === "M") {
				oTable = this.getView().byId("__dailyTable");
				oTabModel = oTable.getModel("daily").getData();
				for (i = 0; i < oTabModel.results.length; i++) {
					sWeek = oTabModel.results[i].CW;
					sYear = oTabModel.results[i].Year;
					sHotline = oTabModel.results[i].HotlineNum;
					if (i === 0) {
						sFirst = sWeek;
					}
					if (i === oTabModel.results.length - 1) {
						sLast = sWeek;
					}
					row = oTabModel.results[i];
					if (row.PrimaryUserName === "") {
						row.PrimaryUser = "";
					}
					if (row.BackupUserName === "") {
						row.BackupUser = "";
					}
					sQtr = row.Quarter;
					if (sTableType.table === "M") {
						sQtr = row.Month;
					}
					oEntry = {};
					oEntry.CW = sWeek;
					oEntry.HotlineNum = sHotline;
					oEntry.Date = row.Date;
					oEntry.Region = "CA";
					oEntry.PrimaryUser = row.PrimaryUser;
					oEntry.PrimaryUserName = "";
					oEntry.BackupUser = row.BackupUser;
					oEntry.BackupUserName = "";
					//oEntry.Quarter = row.Quarter;
					oEntry.Year = row.Year;
					oEntry.Edit = "";
					oEntry.Comment = "";
					oEntry.P1_Color = "";
					oEntry.B1_Color = "";
					if (sTableType.table === "D") {
						oEntry.Quarter = row.Quarter;
						sPath = "DayAssignmentSet(CW='" + sWeek + "',HotlineNum='" + sHotline + "',Date='" + oTabModel.results[i].Date +
							"',Region='IN')";
					} else if (sTableType.table === "M") {
						oEntry.Month = row.Month;
						sPath = "MonthAssignmentSet(CW='" + sWeek + "',HotlineNum='" + sHotline + "',Date='" + oTabModel.results[i].Date +
							"',Region='IN')";
					}
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
					if (batchChanges.length === 15 && i !== oTabModel.results.length - 1) {
						// sap.ui.core.BusyIndicator.show();
						this.oModel.submitBatch(
							function(data) {},
							function(err) {
								sap.m.MessageBox.information("Failed to Save. Please Try Again");
							},
							false
						);
						batchChanges = [];
					} else if (i === oTabModel.results.length - 1) {
						this.oModel.submitBatch(
							function(data) {
								sap.m.MessageBox.information(sMsg);
								if (sMessage === "lock") {
									that._lockHotline(sHotline, sQtr, sYear);
								}
								that._getData(sHotline);
							},
							function(err) {
								sap.m.MessageBox.information("Failed to Save. Please Try Again");
							},
							false
						);
						batchChanges = [];
					}
				}
			}
			if (batchChanges.length > 0) {
				this.oModel.submitBatch(function(data) {
					sap.ui.core.BusyIndicator.hide();
					if (sMessage === "lock") {
						//lock my region only
						// call lock
						that._lockHotline(sHotline, sQtr, sYear);
					} else { //no lock
						sap.m.MessageBox.information(sMsg);
					}
					that._getData(sHotline);
				}, function(err) {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.information("Failed to Save. Please Try Again");
				});
			}
		},
		saveAndInform: function() {
			this.saveAll("lock");
		},
		_lockHotline: function(sHotline, sQtr, sYear) {
			var oEntry = {};
			var that = this;
			oEntry.HotlineNum = sHotline;
			sQtr = +sQtr;
			sQtr = sQtr.toString();
			oEntry.Quarter = sQtr;
			oEntry.Year = sYear;
			oEntry.Region = "CA";
			var aFltr = [];
			var oFltr = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sHotline);
			aFltr.push(oFltr);
			oFltr = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, sQtr);
			aFltr.push(oFltr);
			oFltr = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, sYear);
			aFltr.push(oFltr);
			oFltr = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, "CA");
			aFltr.push(oFltr);
			var sUpdPath = "/LockAssignmentSet(HotlineNum='" + sHotline + "',Quarter='" + sQtr + "')";
			this.oModel.update(sUpdPath, oEntry, {
				success: function() {
					that.oModel.read("/LockAssignmentSet", {
						filters: aFltr,
						success: function(oData) {
							if (oData.results[0].SendMail === "X") {
								that.informMail(sHotline);
							} else {
								sap.m.MessageBox.information(
									"The Admins of Region(s) (" + oData.results[0].PendingRegion.trim() +
									") has not saved the assignments yet. This action will be only possible if all assignments are saved."
								);
							}
						},
						async: false
					});
				},
				async: false
			});
		},
		informMail: function(pHotline) {
			var sSuperAdmins = "",
				sAdmins = "";
			var sQtr = this.getView().getModel("head").oData[0].Quarter;
			var sYear = this.getView().getModel("head").oData[0].Year;
			this.oModel.read("/SuperAdminSet", {
				async: false,
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						sSuperAdmins += oData.results[i].Email + ";";
					}
				}
			});
			var sHotline = this.getView().byId("__mainTab").getSelectedKey();
			var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.EQ, sHotline);
			var aFilter = [];
			aFilter.push(oFilter);
			this.oModel.read("/AdminsSet", {
				filters: aFilter,
				async: false,
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						sAdmins += oData.results[i].Email + ";";
					}

					var sBody = "Dear Hotline Super admin,\n\n" +
						"This is to notify you that the hotline assignments for " + pHotline +
						"for the quarter " + sQtr + "/" + sYear +
						" is finalized. Please go ahead and communicate the same to the team.\n" +
						"\nDeadline: Before start of " + sQtr + "/" + sYear +
						"\n\nBest Regards,\nARES Hotline Coordination";

					sap.m.URLHelper.triggerEmail(sSuperAdmins,
						"Hotline assignments finalized for the quarter  " + sQtr + "/" + sYear,
						sBody,
						sAdmins
					);
				}
			});

			//get info about super admins and local admin from backend
		},
		//Canada PRIMARY pop up
		handleDeValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog_CA) {
				this._valueHelpDialog_CA = sap.ui.xmlfragment(
					"Hotline.view.CA_Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog_CA);
			}
			//create a filter for the binding
			this._valueHelpDialog_CA.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog_CA.open(sInputValue);
		},
		_handleValueHelpSearch_CA: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose_CA: function(evt) {
			var sTableType = this.getView().getModel("tableType").getData();
			var sId, sModelName;
			if (sTableType.table === "G") {
				sId = "__table0";
				sModelName = "tab";
			} else if (sTableType.table === "D" || sTableType.table === "M") {
				sId = "__dailyTable";
				sModelName = "daily";
			} else if (sTableType.table === "W") {
				sId = "__table1";
				sModelName = "week";
			}
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var oModel = this.getView().byId(sId).getModel(sModelName);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var oData = oModel.getProperty(sPath);
				var sUserId = oSelectedItem.getDescription();
				//check if primary and backup are not same, if same dont paste
				if (oData.BackupUser !== sUserId) {
					var sNamePath = sPath + "" + "/PrimaryUser";
					var sName = oSelectedItem.getTitle();
					oModel.setProperty(sNamePath, sUserId);
					sNamePath = sPath + "" + "/PrimaryUserName";
					oModel.setProperty(sNamePath, sName);
					sNamePath = sPath + "" + "/P1_Color";
					oModel.setProperty(sNamePath, "");
					userInput.setValue(sName);
					oModel.refresh(true);
				} else {
					sap.m.MessageToast.show("Primary and Secondary are same");
				}
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Canada BACKUP POPUP
		backupHandleDeValueHelp: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog_CA2) {
				this._valueHelpDialog_CA2 = sap.ui.xmlfragment(
					"Hotline.view.CA_BackupDialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog_CA2);
			}
			// create a filter for the binding
			this._valueHelpDialog_CA2.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog_CA2.open(sInputValue);
		},
		_backupHandleValueHelpSearch_CA: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose_CA: function(evt) {
			var sTableType = this.getView().getModel("tableType").getData();
			var sId, sModelName;
			if (sTableType.table === "G") {
				sId = "__table0";
				sModelName = "tab";
			} else if (sTableType.table === "D" || sTableType.table === "M") {
				sId = "__dailyTable";
				sModelName = "daily";
			} else if (sTableType.table === "W") {
				sId = "__table1";
				sModelName = "week";
			}
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var oModel = this.getView().byId(sId).getModel(sModelName);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sUserId = oSelectedItem.getDescription();
				var oData = oModel.getProperty(sPath);
				//check if primary and backup are not same, if same dont paste
				if (oData.PrimaryUser !== sUserId) {
					var sNamePath = sPath + "" + "/BackupUser";
					var sName = oSelectedItem.getTitle();
					oModel.setProperty(sNamePath, sUserId);
					sNamePath = sPath + "" + "/BackupUserName";
					oModel.setProperty(sNamePath, sName);
					sNamePath = sPath + "" + "/B1_Color";
					oModel.setProperty(sNamePath, "");
					userInput.setValue(sName);
					oModel.refresh(true);
				} else {
					sap.m.MessageToast.show("Primary and Secondary are same");
				}
			}
			evt.getSource().getBinding("items").filter([]);
		},

		//peer table
		copyPrimaryName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			this._doPrimaryCopy(sPath, "__table0", "tab");
		},
		copyBackupName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			this._doBackupCopy(sPath, "__table0", "tab");
		},
		//weekly table
		copyPName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("week").getPath();
			this._doPrimaryCopy(sPath, "__table1", "week");
		},
		copyBName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("week").getPath();
			this._doBackupCopy(sPath, "__table1", "week");
		},
		//daily table
		copyDailyPrimaryName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("daily").getPath();
			this._doPrimaryCopy(sPath, "__dailyTable", "daily");
		},
		copyDailyBackupName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("daily").getPath();
			this._doBackupCopy(sPath, "__dailyTable", "daily");
		},
		_doBackupCopy: function(sPath, sId, sModelName) {
			var oModel = this.getView().byId(sId).getModel(sModelName);
			var oRow = oModel.getProperty(sPath);
			if (oRow.BackupUserName.length > 0) {
				var oRowSelectModel = new sap.ui.model.json.JSONModel({
					name: oRow.BackupUserName,
					id: oRow.BackupUser
				});
				this.getView().setModel(oRowSelectModel, "copy");
				sap.m.MessageToast.show(oRow.BackupUserName + "is copied");
			}
		},
		_doPrimaryCopy: function(sPath, sId, sModelName) {
			var oModel = this.getView().byId(sId).getModel(sModelName);
			var oRow = oModel.getProperty(sPath);
			if (oRow.PrimaryUserName.length > 0) {
				var oRowSelectModel = new sap.ui.model.json.JSONModel({
					name: oRow.PrimaryUserName,
					id: oRow.PrimaryUser
				});
				this.getView().setModel(oRowSelectModel, "copy");
				sap.m.MessageToast.show(oRow.PrimaryUserName + "is copied");
			}
		},
		//weekly  paste
		pastePName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("week").getPath();
			this._pastePrimary(sPath, "__table1", "week");
		},
		pasteBName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("week").getPath();
			this._pasteBackup(sPath, "__table1", "week");
		},
		//peer table paste
		pastePrimaryName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			this._pastePrimary(sPath, "__table0", "tab");
		},
		pasteBackupName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("tab").getPath();
			this._pasteBackup(sPath, "__table0", "tab");
		},
		//daily table paste
		pasteDailyPrimaryName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("daily").getPath();
			this._pastePrimary(sPath, "__dailyTable", "daily");
		},
		pasteDailyBackupName: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("daily").getPath();
			this._pasteBackup(sPath, "__dailyTable", "daily");
		},
		_pasteBackup: function(sPath, sId, sModelName) {
			var aData = this.getView().getModel("copy").getData();
			var oModel = this.getView().byId(sId).getModel(sModelName);
			var oRow = oModel.getProperty(sPath);
			if (aData.name.length > 0) {
				if (aData.name !== oRow.PrimaryUserName) {
					oRow.BackupUserName = aData.name;
					oRow.BackupUser = aData.id;
					oRow.B1_Color = "";
					oModel.refresh(true);
				} else {
					sap.m.MessageToast.show("Primary and Secondary are same");
				}

			}
		},
		_pastePrimary: function(sPath, sId, sModelName) {
			var aData = this.getView().getModel("copy").getData();
			var oModel = this.getView().byId(sId).getModel(sModelName);
			var oRow = oModel.getProperty(sPath);
			if (aData.name.length > 0) {
				if (aData.name !== oRow.BackupUserName) {
					oRow.PrimaryUserName = aData.name;
					oRow.PrimaryUser = aData.id;
					oRow.P1_Color = "";
					oModel.refresh(true);
				} else {
					sap.m.MessageToast.show("Primary and Secondary are same");
				}
			}
		},
		editCommentWeekly: function(oControlEvent) {
			//get comments first
			if (!this._commentDialog) {
				this._commentDialog = sap.ui.xmlfragment(
					"Hotline.view.Comment",
					this
				);
				this.getView().addDependent(this._commentDialog);
			}
			var sPath = oControlEvent.getSource().getBindingContext("week").sPath;
			this._getComments(sPath, "load", "__table1", "week");
		},
		editComment: function(oControlEvent) {
			//get comments first
			if (!this._commentDialog) {
				this._commentDialog = sap.ui.xmlfragment(
					"Hotline.view.Comment",
					this
				);
				this.getView().addDependent(this._commentDialog);
			}
			var sPath = oControlEvent.getSource().getBindingContext("tab").sPath;
			this._getComments(sPath, "load", "__table0", "tab");

		},
		editDailyComment: function(oControlEvent) {
			if (!this._commentDialog) {
				this._commentDialog = sap.ui.xmlfragment(
					"Hotline.view.Comment",
					this
				);
				this.getView().addDependent(this._commentDialog);
			}
			var sPath = oControlEvent.getSource().getBindingContext("daily").sPath;
			this._getComments(sPath, "load", "__dailyTable", "daily");
		},
		_getComments: function(sPath, pSource, sTableId, sModelName) {
			var that = this;
			this.oCommentModel = new sap.ui.model.json.JSONModel();
			var oRowModel = new sap.ui.model.json.JSONModel();
			var aFilters = [];
			this.sTableId = sTableId;
			this.sModelName = sModelName;
			var oTableModel = this.getView().byId(sTableId).getModel(sModelName);
			var aData = oTableModel.getProperty(sPath);
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, aData.HotlineNum);
			aFilters.push(oFilter);
			try {
				var cw;
				if (aData.Date !== "" && aData.Date !== undefined) {
					cw = aData.Date;
				} else {
					cw = aData.CW;
				}
			} catch (e) {
				//ignore
			}
			oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, cw);
			aFilters.push(oFilter);

			oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aData.Year);
			aFilters.push(oFilter);

			oRowModel.setData(sPath);

			var oList = sap.ui.getCore().byId("__commentList");
			sap.ui.getCore().setModel(oRowModel, "row");
			this.oModel.read("/CommentSet", {
				filters: aFilters,
				success: function(oData) {
					that.oCommentModel.setData(oData);
					if (pSource === "load") {
						that._commentDialog.open();
					}
					var oItemTemplate = new sap.m.FeedListItem({
						sender: "{Username}",
						text: "{CommentText}",
						showIcon: false,
						info: {
							path: "Timestamp",
							type: 'sap.ui.model.type.DateTime',
							formatOptions: {
								pattern: "MMM dd,yyyy hh:mm:ss C'ET",
								source: 'yyyy-MM-dd\'T\'HH:mm:ss'
							}
						}
					});
					oList.bindAggregation("items", "/results/", oItemTemplate);
					oList.setModel(that.oCommentModel);
					if (oData.results.length > 0) {
						aData.Comment = oData.results.length;
						oTableModel.refresh(true);
					} else if (oData.results.length == 0) {
						aData.Comment = "";
						oTableModel.refresh(true);
					}
				},
				error: function() {}
			});

		},
		saveComment: function() {
			var oRowPath = sap.ui.getCore().getModel("row").getData();
			var that = this;
			//check if not empty
			var sText = sap.ui.getCore().byId("__commentText").getValue();
			if (sText.length === 0) {
				sap.ui.getCore().byId("__commentText").setValueState("Error");
				sap.ui.getCore().byId("__commentText").setValueStateText("Please enter comment/note");
			} else {
				sap.ui.getCore().byId("__commentText").setValueState("None");
				sap.ui.getCore().byId("__commentText").setValueStateText("");
				sap.ui.core.BusyIndicator.show();
				var oTableModel = this.getView().byId(this.sTableId).getModel(this.sModelName);
				var aData = oTableModel.getProperty(oRowPath);
				var oEntry = {};
				try {
					var cw;
					if (aData.Date !== "" && aData.Date !== undefined) {
						cw = aData.Date;
					} else {
						cw = aData.CW;
					}
				} catch (e) {
					//ignore
				}
				oEntry = {
					HotlineNum: aData.HotlineNum,
					CalendarWeek: cw,
					CalYear: aData.Year,
					CommentText: sText
				};
				var batchChanges = [];
				batchChanges.push(this.oModel.createBatchOperation("CommentSet", "POST", oEntry));
				this.oModel.addBatchChangeOperations(batchChanges);
				this.oModel.submitBatch(function() {
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
					sap.ui.getCore().byId("__commentText").setValue("");
					sap.m.MessageToast.show("Comment Added");
					sap.ui.core.BusyIndicator.hide();
				});
			}
		},
		closeComment: function() {
			sap.ui.getCore().byId("__commentText").setValueState("None");
			sap.ui.getCore().byId("__commentText").setValueStateText("");
			sap.ui.getCore().byId("__commentText").setValue("");
			this._commentDialog.destroy();
			this._commentDialog = undefined;
		},
		deleteComments: function() {
			var oRowPath = sap.ui.getCore().getModel("row").getData();
			var oList = sap.ui.getCore().byId("__commentList");
			var oModel = oList.getModel();
			var oRows = oList.getSelectedItems();
			var sPath, row, oEntry, that = this;
			var batchChanges = [];
			var sUserId = this.getView().getModel("head").getData()[0].UserId;
			for (var i = 0; i < oRows.length; i++) {
				sPath = oRows[i].getBindingContext().sPath;
				row = oModel.getProperty(sPath);
				if (row.Uname === sUserId) {
					oEntry = {};
					oEntry = {
						HotlineNum: row.HotlineNum,
						CalendarWeek: row.CalendarWeek,
						CalYear: row.CalYear,
						CommentId: row.CommentId.trim()
					};
					var sTarget = "/CommentSet(HotlineNum='" + row.HotlineNum + "',CalendarWeek='" + row.CalendarWeek + "',CalYear='" + row.CalYear +
						"',CommentId='" + oEntry.CommentId + "')";
					batchChanges.push(this.oModel.createBatchOperation(sTarget, "DELETE", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				} else {
					sap.m.MessageToast.show("You can delete your own comments only");
				}
			}
			if (batchChanges.length >= 1) {
				sap.ui.core.BusyIndicator.show();
				this.oModel.submitBatch(function() {
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
					sap.m.MessageToast.show("Comment(s) Deleted");
					sap.ui.core.BusyIndicator.hide();
				});
			}
		},
		editSelectedComment: function(oEvent) {
			// debugger;
			var sPath, row;
			var oList = sap.ui.getCore().byId("__commentList");
			var oModel = oList.getModel();
			var oRows = oList.getSelectedItems();
			var sUserId = this.getView().getModel("head").getData()[0].UserId;
			if (oRows.length === 1) {
				sPath = oRows[0].getBindingContext().sPath;
				row = oModel.getProperty(sPath);
				if (row.Uname === sUserId) {
					var oEditModel = new sap.ui.model.json.JSONModel({
						HotlineNum: row.HotlineNum,
						CalendarWeek: row.CalendarWeek,
						CalYear: row.CalYear,
						CommentText: row.CommentText,
						CommentId: row.CommentId.trim(),
						visible: "Yes"
					});
					this.getView().setModel(oEditModel, "editComment");
				} else {
					sap.m.MessageToast.show("You can edit your own comments only");
				}
			} else {
				sap.m.MessageToast.show("Please select only comment to edit.");
			}
		},
		onPostComment: function() {
			var that = this;
			var oRowPath = sap.ui.getCore().getModel("row").getData();
			var oModel = this.getView().getModel("editComment");
			var row = oModel.getData();
			row.visible = "No";
			var oEntry = {};
			oEntry = {
				HotlineNum: row.HotlineNum,
				CalendarWeek: row.CalendarWeek,
				CalYear: row.CalYear,
				CommentId: row.CommentId.trim(),
				CommentText: row.CommentText
			};
			var sTarget = "/CommentSet(HotlineNum='" + row.HotlineNum + "',CalendarWeek='" + row.CalendarWeek + "',CalYear='" + row.CalYear +
				"',CommentId='" + oEntry.CommentId + "')";
			oModel.refresh(true);
			sap.ui.core.BusyIndicator.show();
			this.oModel.update(sTarget, oEntry, {
				success: function() {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageToast.show("Comment Updated");
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		openScheduler: function(oEvent) {
			var sHotline = this.getView().byId("__mainTab").getSelectedKey();
			var sPath = "/MonthSchedulesSet('" + sHotline + "')";
			if (!this._oScheduler) {
				this._oScheduler = sap.ui.xmlfragment(
					"Hotline.view.MonthlySchedules",
					this
				);
				this.getView().addDependent(this._oScheduler);
				var oMonthModel = new sap.ui.model.json.JSONModel();
				this.oModel.read(sPath, {
					success: function(oData) {
						oMonthModel.setData(oData);
					},
					async: false
				});
				this._oScheduler.setModel(oMonthModel);
				this._oScheduler.open();
			}
		},
		updateSchedules: function() {
			var that = this;
			var aData = this._oScheduler.getModel().getData();
			var oEntry = {
				HOTLINE: aData.HOTLINE,
				CAL_MONTH: aData.CAL_MONTH,
				DEADLINE: aData.DEADLINE,
				CAL_YEAR: aData.CAL_YEAR
			};
			var sUpdPath = "/MonthSchedulesSet(HOTLINE='" + aData.HOTLINE + "')";
			this.oModel.update(sUpdPath, oEntry, {
				success: function() {
					sap.m.MessageToast.show("Updated");
					that.closeSchedules();
				},
				error: function() {
					sap.m.MessageToast.show("Failed to save, please try again");
				}
			});
		},
		closeSchedules: function() {
			this._oScheduler.destroy();
			this._oScheduler = undefined;
		},
		onChangeGeneration: function(oControlEvent) {
			var bState = oControlEvent.getParameter("state");
			if (!bState) {
				var sModelName = "",
					aData = [];
				var sTableType = this.getView().getModel("tableType").getData().table;
				switch (sTableType) {
					case "M":
						sModelName = "daily";
						break;
					case "D":
						sModelName = "daily";
						break;
					case "W":
						sModelName = "week";
						break;
				}
				var oModel = this.getView().getModel(sModelName);
				var aData = oModel.getData();
				for (var i = 0; i < aData.results.length; i++) {
					if (aData.results[i].P1_Color === "R" && aData.results[i].P1_Edit === "Y") {
						aData.results[i].P1_Color = "";
						aData.results[i].PrimaryUser = "";
						aData.results[i].PrimaryUserName = "";
					}
					if (aData.results[i].B1_Color === "R" && aData.results[i].P2_Edit === "Y") {
						aData.results[i].B1_Color = "";
						aData.results[i].BackupUser = "";
						aData.results[i].BackupUserName = "";
					}
				}
				oModel.setData(aData);
				oModel.refresh(true);
			}
		},
		generateNames: function() {
			var aFilters = [],
				oFilter;
			var sModelName = "",
				sPath = "";
			var oIconTab = this.getView().byId("__mainTab");
			var sHotline = oIconTab.getSelectedKey();
			var sTableType = this.getView().getModel("tableType").getData().table;
			var aHeadData = this.getView().getModel("head").getData();
			oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sHotline);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
			aFilters.push(oFilter);

			switch (sTableType) {
				case "M":
					sModelName = "daily";
					sPath = "/MonthAssignmentSet";
					oFilter = new sap.ui.model.Filter("Month", sap.ui.model.FilterOperator.EQ, aHeadData[0].Month);
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, "CA");
					aFilters.push(oFilter);
					break;
				case "D":
					sModelName = "daily";
					sPath = "/DayAssignmentSet";
					oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, "CA");
					aFilters.push(oFilter);
					break;
				case "W":
					sModelName = "week";
					sPath = "/WeeklyAssignmentSet";
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
					aFilters.push(oFilter);
					oFilter = new sap.ui.model.Filter("Country", sap.ui.model.FilterOperator.EQ, "CA");
					aFilters.push(oFilter);
					break;
			}
			var that = this;
			sap.ui.core.BusyIndicator.show();
			this.oModel.read(sPath, {
				filters: aFilters,
				success: function(oData) {
					if (oData.results.length > 0) {
						var oModel = that.getView().getModel(sModelName);
						var aData = oModel.getData();
						for (var i = 0; i < aData.results.length; i++) {
							for (var j = 0; j < oData.results.length; j++) {
								if (sTableType === "W") {
									if (aData.results[i].CW == oData.results[j].CW) {
										if (aData.results[i].PrimaryUser === "" && aData.results[i].PrimaryUserName === "") {
											aData.results[i].P1_Color = "R";
											aData.results[i].PrimaryUser = oData.results[j].PrimaryUser;
											aData.results[i].PrimaryUserName = oData.results[j].PrimaryUserName;
										}
										if (aData.results[i].BackupUser === "" && aData.results[i].BackupUserName === "") {
											aData.results[i].B1_Color = "R";
											aData.results[i].BackupUser = oData.results[j].BackupUser;
											aData.results[i].BackupUserName = oData.results[j].BackupUserName;
										}
									}
								} else if (sTableType === "D" || sTableType === "M") {
									if (aData.results[i].Date == oData.results[j].Date) {
										if (aData.results[i].PrimaryUser === "" && aData.results[i].PrimaryUserName === "") {
											aData.results[i].P1_Color = "R";
											aData.results[i].PrimaryUser = oData.results[j].PrimaryUser;
											aData.results[i].PrimaryUserName = oData.results[j].PrimaryUserName;
										}
										if (aData.results[i].BackupUser === "" && aData.results[i].BackupUserName === "") {
											aData.results[i].B1_Color = "R";
											aData.results[i].BackupUser = oData.results[j].BackupUser;
											aData.results[i].BackupUserName = oData.results[j].BackupUserName;
										}
									}
								}
							}

						}
						oModel.setData(aData);
						oModel.refresh(true);
						sap.ui.core.BusyIndicator.hide();
					} else {
						sap.ui.core.BusyIndicator.hide();
					}
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		}
	});
});