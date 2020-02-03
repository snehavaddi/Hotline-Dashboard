sap.ui.define(["Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	return BaseController.extend("Hotline.controller.Main_CA", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("main_CA").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(oEvent) {
			var that = this;
			this.oInitModel = new sap.ui.model.json.JSONModel();
			this.oInitWeekModel = new sap.ui.model.json.JSONModel(); //new
			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV");
			this.oListModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/ListSet", {
				success: function(oData) {
					that.oListModel.setData(oData);
					that.getView().byId("hCaList").setModel(that.oListModel);
					that.createTable(that.oListModel, that);
				}
			});
			//new
			this.oWModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/Choice_weekSet", {
				success: function(oData) {
					that.oWModel.setData(oData);
				},
				async: false
			});
			var oMonModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/Choice_monthSet", {
				success: function(oData) {
					oMonModel.setData(oData);
				},
				async: false
			});
			this.getView().setModel(oMonModel, "month");
			// new entityset to get dates
			this.oDModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/DatesSet", {
				success: function(oData) {
					that.oDModel.setData(oData);
				},
				async: false
			});
			//get status of hotlines
			var oDeadlineModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/CheckDeadlineSet", {
				success: function(oData) {
					var iTotal = 0,
						iLocked = 0;
					oDeadlineModel.setData(oData);
					iTotal = oData.results.length;
					for (var i = 0; i < iTotal; i++) {
						if (oData.results[i].Status === "OPEN") {
							continue;
						} else {
							iLocked += 1;
						}
					}
					if (iLocked < iTotal) {
						that.getView().byId("saveBtnM").setVisible(true);
					} else {
						sap.m.MessageBox.warning("Deadlines for submitting choices has passed, please contact respective admins for update");
						that.getView().byId("saveBtnM").setVisible(false);
					}
				},
				async: false
			});
			this.getView().setModel(oDeadlineModel, "deadline");
		},
		navToAdmin: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("admin");
		},
		createTable: function(oListModel, that) {
			var jData = {};
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var oTable = this.getView().byId("caTable");
			oTable.destroyColumns();
			var aData = oListModel.getData().results;
			var oText = new sap.m.Text();
			oText.setProperty("text", "Calendar Week");
			var oColumn = new sap.m.Column();
			oColumn.setHeader(oText);
			oColumn.setDemandPopin(true);
			oColumn.setMinScreenWidth("Desktop");
			oTable.addColumn(oColumn);
			jData.CW = "";
			var oColList = new sap.m.ColumnListItem();
			var oObjIdf = new sap.m.ObjectIdentifier({
				title: "{CW} of {Cal_year}",
				text: {
					parts: [{
						path: "FromDate",
						type: 'sap.ui.model.type.Date',
						formatOptions: {
							pattern: 'MMM dd',
							source: 'yyyymmdd'

						}
					}, {
						path: "ToDate",
						type: 'sap.ui.model.type.Date',
						formatOptions: {
							pattern: 'MMM dd',
							source: 'yyyymmdd'
						}
					}],
					formatter: function(FromDate, ToDate) {
						return FromDate + " To " + ToDate;
					}
				}
			});
			oColList.addCell(oObjIdf);
			for (var i = 0; i < aData.length; i++) {
				jData[aData[i].HotlineNum] = "";
				oText = new sap.m.Label(aData[i].HotlineNum);
				oText.setProperty("text", aData[i].HotlineTxt);
				oColumn = new sap.m.Column();
				oColumn.setHeader(oText);
				oTable.addColumn(oColumn);
				var that = this;
				var sPath = aData[i].HotlineNum;
				var sPathE = sPath + "_E";
				var sTooltipPath = sPath + "_T";
				if (aData[i].Overlapping <= 1) {
					var oCell = new sap.m.Switch({
						state: {
							path: sPath
								// ,formatter: formatter.State
						},
						enabled: {
							path: sPathE
								// ,formatter: formatter.enableSwitch     
						},
						tooltip: {
							path: sTooltipPath
						},
						customTextOff: "NO",
						customTextOn: "YES",
						change: function(oControlEvent) {
							that.compareResults(oControlEvent);
						}
					});
					oCell.addStyleClass("switch");
					oColList.addCell(oCell);
				} else {
					var oHBox = new sap.m.HBox();
					var sPath = aData[i].HotlineNum;
					for (var ctr = 1; ctr <= 5; ctr++) {
						var sPathDate = sPath + "_" + ctr;
						var sPathEditable = sPath + "_" + ctr + "E";
						var sPathTooltip = sPath + "_" + ctr + "T";
						var sPathSelected = sPath + "_" + ctr + "D";
						var oBtn = new sap.m.ToggleButton({
							text: {
								path: sPathDate
							},
							enabled: {
								path: sPathEditable
							},
							tooltip: {
								path: sPathTooltip
							},
							pressed: {
								path: sPathSelected
							},
							visible: {
								path: sPathDate,
								formatter: formatter.isValid
							},
							press: function(oControlEvent) {
								that.compareDailyResults(oControlEvent);
							}
						});
						oHBox.addItem(oBtn);
					}
					oColList.addCell(oHBox);
				}
			}
			var temp3 = this.getView().getModel("month").getData().results;
			var oDeadlineData = this.getView().getModel("deadline").getData().results;
			var oTabModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/Choice_CASet", {
				success: function(oData) {
					var arrayFinal = [],
						cal_low, cal_high;
					var qtr;
					var temp1 = oData.results;
					var temp2 = that.oWModel.getData().results;
					var aDates = that.oDModel.getData().results;
					var iHotlines = that.oListModel.getData().results;
					if (iHotlines.length > 0) {
						if (temp1.length > 0) {
							qtr = oData.results[0].Quarter;
						} else if (temp2.length > 0) {
							qtr = temp2[0].Quarter;
						} else if(temp3.length > 0){
							var m = temp3[0].Month;
							m = parseInt(m);
							if(m>=1 && m<=3){
								qtr = "1";
							} else if(m>=4 && m<=6){
								qtr = "2";
							} else if(m>=7 && m<=9){
								qtr = "3";
							} else if(m>=10 && m<=12){
								qtr = "4";
							} 
						}
						if (qtr == "1") {
							cal_low = 1;
							cal_high = 13;
						} else if (qtr == "2") {
							cal_low = 14;
							cal_high = 26;
						} else if (qtr == "3") {
							cal_low = 27;
							cal_high = 39;
						} else {
							cal_low = 40;
							cal_high = 52;
						}

						for (var i = cal_low; i <= cal_high; i++) {
							var mData = {};
							for (var j = 0; j < aDates.length; j++) {
								if (i == aDates[j].CW) {
									mData["CW"] = i;
									mData["FromDate"] = aDates[j].FromDate;
									mData["ToDate"] = aDates[j].ToDate;
									mData["Cal_year"] = aDates[j].CalYear;
								}
							}
							for (var j = 0; j < temp1.length; j++) {
								if (i == temp1[j].CW) {
									var stat = "";
									for (var ctr = 0; ctr < oDeadlineData.length; ctr++) {
										if (oDeadlineData[ctr].Status === "LOCKED" && oDeadlineData[ctr].Hotline.length === 0) {
											stat = 'LOCKED';
											break;
										}
									}
									if (temp1[j].Value == "0") { //not selected
										mData[temp1[j].HotlineKey] = false;
										mData[temp1[j].HotlineKey + "_E"] = true;
									} else if (temp1[j].Value == "2") { //selected by someone else
										mData[temp1[j].HotlineKey] = true;
										mData[temp1[j].HotlineKey + "_E"] = false;
									} else if (temp1[j].Value == "1") { //selected by same user<2>
										mData[temp1[j].HotlineKey] = true;
										mData[temp1[j].HotlineKey + "_E"] = true;
									}
									if (stat === "LOCKED") {
										mData[temp1[j].HotlineKey + "_E"] = false;
									}
									mData[temp1[j].HotlineKey + "_T"] = temp1[j].Owner;
									// console.log(mData);
								}
							}
							for (var j = 0; j < temp2.length; j++) {
								if (i == temp2[j].CalWeek) {
									//text and owner
									stat = "";
									for (var ctr = 0; ctr < oDeadlineData.length; ctr++) {
										if (oDeadlineData[ctr].Status === "LOCKED" && oDeadlineData[ctr].Hotline.length === 0) {
											stat = 'LOCKED';
											break;
										}
									}
									var date = temp2[j].CalDate.substring(6, 8);
									switch (temp2[j].Day) {
										case '1':
											mData[temp2[j].HotlineNum + "_1"] = date; //fill date
											mData[temp2[j].HotlineNum + "_1T"] = temp2[j].Owner;
											mData[temp2[j].HotlineNum + "_1Date"] = temp2[j].CalDate;
											if (temp2[j].Choice == "0") { //not selected
												mData[temp2[j].HotlineNum + "_1D"] = false;
												mData[temp2[j].HotlineNum + "_1E"] = true;
											} else if (temp2[j].Choice == "2") { //selected by someone else
												mData[temp2[j].HotlineNum + "_1D"] = true;
												mData[temp2[j].HotlineNum + "_1E"] = false;
											} else if (temp2[j].Choice == "1") { //selected by same user<2>
												mData[temp2[j].HotlineNum + "_1D"] = true;
												mData[temp2[j].HotlineNum + "_1E"] = true;
											} else if (temp2[j].Choice == "9") { //public holiday
												mData[temp2[j].HotlineNum + "_1D"] = true;
												mData[temp2[j].HotlineNum + "_1E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp2[j].HotlineNum + "_1E"] = false;
											}
											break;
										case '2':
											mData[temp2[j].HotlineNum + "_2"] = date; //fill date
											mData[temp2[j].HotlineNum + "_2T"] = temp2[j].Owner;
											mData[temp2[j].HotlineNum + "_2Date"] = temp2[j].CalDate;
											if (temp2[j].Choice == "0") { //not selected
												mData[temp2[j].HotlineNum + "_2D"] = false;
												mData[temp2[j].HotlineNum + "_2E"] = true;
											} else if (temp2[j].Choice == "2") { //selected by someone else
												mData[temp2[j].HotlineNum + "_2D"] = true;
												mData[temp2[j].HotlineNum + "_2E"] = false;
											} else if (temp2[j].Choice == "1") { //selected by same user<2>
												mData[temp2[j].HotlineNum + "_2D"] = true;
												mData[temp2[j].HotlineNum + "_2E"] = true;
											} else if (temp2[j].Choice == "9") { //public holiday
												mData[temp2[j].HotlineNum + "_2D"] = true;
												mData[temp2[j].HotlineNum + "_2E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp2[j].HotlineNum + "_2E"] = false;
											}
											break;
										case '3':
											mData[temp2[j].HotlineNum + "_3"] = date; //fill date
											mData[temp2[j].HotlineNum + "_3T"] = temp2[j].Owner;
											mData[temp2[j].HotlineNum + "_3Date"] = temp2[j].CalDate;
											if (temp2[j].Choice == "0") { //not selected
												mData[temp2[j].HotlineNum + "_3D"] = false;
												mData[temp2[j].HotlineNum + "_3E"] = true;
											} else if (temp2[j].Choice == "2") { //selected by someone else
												mData[temp2[j].HotlineNum + "_3D"] = true;
												mData[temp2[j].HotlineNum + "_3E"] = false;
											} else if (temp2[j].Choice == "1") { //selected by same user<2>
												mData[temp2[j].HotlineNum + "_3D"] = true;
												mData[temp2[j].HotlineNum + "_3E"] = true;
											} else if (temp2[j].Choice == "9") { //public holiday
												mData[temp2[j].HotlineNum + "_3D"] = true;
												mData[temp2[j].HotlineNum + "_3E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp2[j].HotlineNum + "_3E"] = false;
											}
											break;
										case '4':
											mData[temp2[j].HotlineNum + "_4"] = date; //fill date
											mData[temp2[j].HotlineNum + "_4T"] = temp2[j].Owner;
											mData[temp2[j].HotlineNum + "_4Date"] = temp2[j].CalDate;
											if (temp2[j].Choice == "0") { //not selected
												mData[temp2[j].HotlineNum + "_4D"] = false;
												mData[temp2[j].HotlineNum + "_4E"] = true;
											} else if (temp2[j].Choice == "2") { //selected by someone else
												mData[temp2[j].HotlineNum + "_4D"] = true;
												mData[temp2[j].HotlineNum + "_4E"] = false;
											} else if (temp2[j].Choice == "1") { //selected by same user<2>
												mData[temp2[j].HotlineNum + "_4D"] = true;
												mData[temp2[j].HotlineNum + "_4E"] = true;
											} else if (temp2[j].Choice == "9") { //public holiday
												mData[temp2[j].HotlineNum + "_4D"] = true;
												mData[temp2[j].HotlineNum + "_4E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp2[j].HotlineNum + "_4E"] = false;
											}
											break;
										case '5':
											mData[temp2[j].HotlineNum + "_5"] = date; //fill date
											mData[temp2[j].HotlineNum + "_5T"] = temp2[j].Owner;
											mData[temp2[j].HotlineNum + "_5Date"] = temp2[j].CalDate;
											if (temp2[j].Choice == "0") { //not selected
												mData[temp2[j].HotlineNum + "_5D"] = false;
												mData[temp2[j].HotlineNum + "_5E"] = true;
											} else if (temp2[j].Choice == "2") { //selected by someone else
												mData[temp2[j].HotlineNum + "_5D"] = true;
												mData[temp2[j].HotlineNum + "_5E"] = false;
											} else if (temp2[j].Choice == "1") { //selected by same user<2>
												mData[temp2[j].HotlineNum + "_5D"] = true;
												mData[temp2[j].HotlineNum + "_5E"] = true;
											} else if (temp2[j].Choice == "9") { //public holiday
												mData[temp2[j].HotlineNum + "_5D"] = true;
												mData[temp2[j].HotlineNum + "_5E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp2[j].HotlineNum + "_5E"] = false;
											}
											break;
									}
								}
							}
							for (j = 0; j < temp3.length; j++) {
								if (i == temp3[j].CalWeek) {
									//text and owner
									stat = "";
									for (var ctr = 0; ctr < oDeadlineData.length; ctr++) {
										if (oDeadlineData[ctr].Status === "LOCKED" && (oDeadlineData[ctr].Hotline === temp3[j].HotlineNum || oDeadlineData[ctr].Hotline +
												"B" === temp3[j].HotlineNum)) {
											stat = 'LOCKED';
											break;
										}
									}
									var date = temp3[j].CalDate.substring(6, 8);
									switch (temp3[j].Day) {
										case '1':
											mData[temp3[j].HotlineNum + "_1"] = date; //fill date
											mData[temp3[j].HotlineNum + "_1T"] = temp3[j].Owner;
											mData[temp3[j].HotlineNum + "_1Date"] = temp3[j].CalDate;
											if (temp3[j].Choice == "0") { //not selected
												mData[temp3[j].HotlineNum + "_1D"] = false;
												mData[temp3[j].HotlineNum + "_1E"] = true;
											} else if (temp3[j].Choice == "2") { //selected by someone else
												mData[temp3[j].HotlineNum + "_1D"] = true;
												mData[temp3[j].HotlineNum + "_1E"] = false;
											} else if (temp3[j].Choice == "1") { //selected by same user<2>
												mData[temp3[j].HotlineNum + "_1D"] = true;
												mData[temp3[j].HotlineNum + "_1E"] = true;
											} else if (temp3[j].Choice == "9") { //public holiday
												mData[temp3[j].HotlineNum + "_1D"] = true;
												mData[temp3[j].HotlineNum + "_1E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp3[j].HotlineNum + "_1E"] = false;
											}
											break;
										case '2':
											mData[temp3[j].HotlineNum + "_2"] = date; //fill date
											mData[temp3[j].HotlineNum + "_2T"] = temp3[j].Owner;
											mData[temp3[j].HotlineNum + "_2Date"] = temp3[j].CalDate;
											if (temp3[j].Choice == "0") { //not selected
												mData[temp3[j].HotlineNum + "_2D"] = false;
												mData[temp3[j].HotlineNum + "_2E"] = true;
											} else if (temp3[j].Choice == "2") { //selected by someone else
												mData[temp3[j].HotlineNum + "_2D"] = true;
												mData[temp3[j].HotlineNum + "_2E"] = false;
											} else if (temp3[j].Choice == "1") { //selected by same user<2>
												mData[temp3[j].HotlineNum + "_2D"] = true;
												mData[temp3[j].HotlineNum + "_2E"] = true;
											} else if (temp3[j].Choice == "9") { //public holiday
												mData[temp3[j].HotlineNum + "_2D"] = true;
												mData[temp3[j].HotlineNum + "_2E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp3[j].HotlineNum + "_2E"] = false;
											}
											break;
										case '3':
											mData[temp3[j].HotlineNum + "_3"] = date; //fill date
											mData[temp3[j].HotlineNum + "_3T"] = temp3[j].Owner;
											mData[temp3[j].HotlineNum + "_3Date"] = temp3[j].CalDate;
											if (temp3[j].Choice == "0") { //not selected
												mData[temp3[j].HotlineNum + "_3D"] = false;
												mData[temp3[j].HotlineNum + "_3E"] = true;
											} else if (temp3[j].Choice == "2") { //selected by someone else
												mData[temp3[j].HotlineNum + "_3D"] = true;
												mData[temp3[j].HotlineNum + "_3E"] = false;
											} else if (temp3[j].Choice == "1") { //selected by same user<2>
												mData[temp3[j].HotlineNum + "_3D"] = true;
												mData[temp3[j].HotlineNum + "_3E"] = true;
											} else if (temp3[j].Choice == "9") { //public holiday
												mData[temp3[j].HotlineNum + "_3D"] = true;
												mData[temp3[j].HotlineNum + "_3E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp3[j].HotlineNum + "_3E"] = false;
											}
											break;
										case '4':
											mData[temp3[j].HotlineNum + "_4"] = date; //fill date
											mData[temp3[j].HotlineNum + "_4T"] = temp3[j].Owner;
											mData[temp3[j].HotlineNum + "_4Date"] = temp3[j].CalDate;
											if (temp3[j].Choice == "0") { //not selected
												mData[temp3[j].HotlineNum + "_4D"] = false;
												mData[temp3[j].HotlineNum + "_4E"] = true;
											} else if (temp3[j].Choice == "2") { //selected by someone else
												mData[temp3[j].HotlineNum + "_4D"] = true;
												mData[temp3[j].HotlineNum + "_4E"] = false;
											} else if (temp3[j].Choice == "1") { //selected by same user<2>
												mData[temp3[j].HotlineNum + "_4D"] = true;
												mData[temp3[j].HotlineNum + "_4E"] = true;
											} else if (temp3[j].Choice == "9") { //public holiday
												mData[temp3[j].HotlineNum + "_4D"] = true;
												mData[temp3[j].HotlineNum + "_4E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp3[j].HotlineNum + "_4E"] = false;
											}
											break;
										case '5':
											mData[temp3[j].HotlineNum + "_5"] = date; //fill date
											mData[temp3[j].HotlineNum + "_5T"] = temp3[j].Owner;
											mData[temp3[j].HotlineNum + "_5Date"] = temp3[j].CalDate;
											if (temp3[j].Choice == "0") { //not selected
												mData[temp3[j].HotlineNum + "_5D"] = false;
												mData[temp3[j].HotlineNum + "_5E"] = true;
											} else if (temp3[j].Choice == "2") { //selected by someone else
												mData[temp3[j].HotlineNum + "_5D"] = true;
												mData[temp3[j].HotlineNum + "_5E"] = false;
											} else if (temp3[j].Choice == "1") { //selected by same user<2>
												mData[temp3[j].HotlineNum + "_5D"] = true;
												mData[temp3[j].HotlineNum + "_5E"] = true;
											} else if (temp3[j].Choice == "9") { //public holiday
												mData[temp3[j].HotlineNum + "_5D"] = true;
												mData[temp3[j].HotlineNum + "_5E"] = false;
											}
											if (stat === "LOCKED") {
												mData[temp3[j].HotlineNum + "_5E"] = false;
											}
											break;
									}
								}
							}
							arrayFinal.push(mData);
						}
						oTabModel.setData(arrayFinal);
						var aDataCopy = JSON.parse(JSON.stringify(arrayFinal));
						that.oInitModel.setData(aDataCopy);
						oTable.setModel(oTabModel);
						oTable.bindAggregation("items", "/", oColList);
						sap.ui.core.BusyIndicator.hide();
					} else {
						sap.ui.core.BusyIndicator.hide();
						var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
						var dialog = new sap.m.Dialog({
							title: 'Confirm',
							type: 'Message',
							content: new sap.m.Text({
								text: 'Sorry! You do not have any hotline to give preference for'
							}),
							beginButton: new sap.m.Button({
								text: 'Go to Home',
								press: function() {

									dialog.close();
									oRouter.navTo("home");
								}
							}),
							afterClose: function() {
								dialog.destroy();
							}
						});
						dialog.open();
					}
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageBox.error("Error in Getting Data from Backend, Please contact developer.");
				}
			}); //end reading choice set
			//start reading choice week set
			//end reading choice week set
		},
		compareDailyResults: function(oControlEvent) {
			//same hotline check, same date entry not allowed
			var sPath = oControlEvent.getSource().getBindingContext().sPath;
			var oRow = this.getView().byId("caTable").getModel().getProperty(sPath);
			var state = oControlEvent.getSource().getBindingInfo("pressed").parts[0].path;
			var sHotline, index, selected;
			var n = state.search("B_");
			if (n > -1) { //backup
				sHotline = state.substring(0, n);
				index = state.substring(n + 2, n + 3);
				selected = "BACKUP";
			} else { //primary
				n = state.search("_");
				sHotline = state.substring(0, n);
				index = state.substring(n + 1, n + 2);
				selected = "PRIMARY";
			}
			if (oRow[state] === true) { //item is selected
				var firstState, secondState, firstEnable, secondEnable;
				firstState = oRow[state];

				if (selected === "BACKUP") {
					secondState = oRow[sHotline + "_" + index + "D"];
					firstEnable = oRow[sHotline + "B_" + index + "E"];
					secondEnable = oRow[sHotline + "_" + index + "E"];
				} else {
					secondState = oRow[sHotline + "B_" + index + "D"];
					firstEnable = oRow[sHotline + "_" + index + "E"];
					secondEnable = oRow[sHotline + "B_" + index + "E"];
				}
				if (firstState !== undefined && secondState !== undefined) {
					if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
						sap.m.MessageToast.show("Oops, you cannot apply for primary and backup for same calendar day");
						oRow[state] = false;
					}
				}
			}

			//cross hotline, get whether it is overlapping or not
			var oListModel = this.getView().byId("hCaList").getModel();
			var aData = oListModel.getData().results;
			var i, sCurrentPrio = "0";
			for (i = 0; i < aData.length; i++) {
				if (sHotline === aData[i].HotlineNum) {
					sCurrentPrio = aData[i].Overlapping;
					break;
				}
			}
			//cross hotline, cross frequency (daily vs weekly)
			for (i = 0; i < aData.length; i++) {
				try {
					if (aData[i].HotlineNum !== sHotline && aData[i].HotlineNum !== (sHotline + "B")) {
						firstState = oRow[state];
						secondState = oRow[aData[i].HotlineNum];
						if (selected === "BACKUP") {
							firstEnable = oRow[sHotline + "B_" + index + "E"];
						} else {
							firstEnable = oRow[sHotline + "_" + index + "E"];
						}
						secondEnable = oRow[aData[i].HotlineNum + "_E"];
						if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
							if (sCurrentPrio === "0" && aData[i].Overlapping === "0") {
								//no locks for this case
							} else if (sCurrentPrio >= "4" && aData[i].Overlapping === "1") {
								sap.m.MessageToast.show("Oops,this is an overlapping hotline, selections are not allowed");
								oRow[state] = false;
							}
						}
					}
				} catch (e) {
					//ignore exception
				}
			}
			//cross hotline, same frequency (daily vs daily)
			//check same date only (in backup or primary)
			for (i = 0; i < aData.length; i++) {
				try {
					if (aData[i].HotlineNum !== sHotline && aData[i].HotlineNum !== (sHotline + "B")) {
						firstState = oRow[state];
						if (selected === "BACKUP") {
							firstEnable = oRow[sHotline + "B_" + index + "E"];
						} else {
							firstEnable = oRow[sHotline + "_" + index + "E"];
						}
						secondState = oRow[aData[i].HotlineNum + "_" + index + "D"];
						secondEnable = oRow[aData[i].HotlineNum + "_" + index + "E"];
						if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
							if (sCurrentPrio === "0" && aData[i].Overlapping === "0") {
								//no locks for this case
							} else if (sCurrentPrio >= "4" && aData[i].Overlapping >= "4") {
								sap.m.MessageToast.show("Oops,this is an overlapping hotline, selections are not allowed");
								oRow[state] = false;
							}
						}
					}
				} catch (e) {
					//ignore exception
				}
			}
			this.getView().byId("caTable").getModel().refresh(true);
		},
		compareResults: function(oControlEvent) {
			//same hotline check
			var sPath = oControlEvent.getSource().getBindingContext().sPath;
			var stateText = oControlEvent.getSource().getBindingInfo("state").parts[0].path;
			var firstState, secondState, strTemp, firstEnable, secondEnable;
			var s1;
			var oRow = this.getView().byId("caTable").getModel().getProperty(sPath);
			if (stateText.slice(-1) === "B") { //backup is newly selected, so revert backup if both are true
				strTemp = stateText.slice(0, -1);
				firstState = oRow[stateText];
				secondState = oRow[strTemp];
				s1 = stateText + "_E";
				firstEnable = oRow[s1];
				s1 = strTemp + "_E";
				secondEnable = oRow[s1];
				//if both are true , then revert else ignore
				if (firstState !== undefined && secondState !== undefined) {
					if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
						sap.m.MessageToast.show("Oops, you cannot apply for primary and backup for same calendar week");
						oRow[stateText] = false;
					}
				}
			} else {
				strTemp = stateText + "B";
				firstState = oRow[stateText];
				secondState = oRow[strTemp];
				s1 = stateText + "_E";
				firstEnable = oRow[s1];
				s1 = strTemp + "_E";
				secondEnable = oRow[s1];
				if (firstState !== undefined && secondState !== undefined) {
					if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
						sap.m.MessageToast.show("Oops, you cannot apply for primary and backup for same calendar week");
						oRow[stateText] = false;
					}
				}
			}
			//cross hotline check
			var oListModel = this.getView().byId("hCaList").getModel();
			var aData = oListModel.getData().results;
			var i, sCurrentPrio = "0";
			for (i = 0; i < aData.length; i++) {
				if (stateText === aData[i].HotlineNum) {
					sCurrentPrio = aData[i].Overlapping;
					break;
				}
			}

			for (i = 0; i < aData.length; i++) {
				try {
					if (aData[i].HotlineNum !== stateText && aData[i].HotlineNum !== strTemp) {
						firstState = oRow[stateText]; //state of currently changed btn
						secondState = oRow[aData[i].HotlineNum]; //state of all other btn
						s1 = stateText + "_E";
						firstEnable = oRow[s1];
						s1 = aData[i].HotlineNum + "_E";
						secondEnable = oRow[s1];
						if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
							if (sCurrentPrio === "0" && aData[i].Overlapping === "0") {
								//no locks for this case
							} else {
								sap.m.MessageToast.show("Oops,this is an overlapping hotline, selections are not allowed");
								oRow[stateText] = false;
							}
						}
					}
				} catch (e) {
					//ignore exception
				}
			}
			//cross hotline, cross frequency
			for (i = 0; i < aData.length; i++) {
				try {
					firstState = oRow[stateText]; //state of currently changed btn
					s1 = stateText + "_E";
					firstEnable = oRow[s1];
					for (var j = 1; j <= 5; j++) {
						secondState = oRow[aData[i].HotlineNum + "_" + j + "D"];
						secondEnable = oRow[aData[i].HotlineNum + "_" + j + "E"];
						if (firstState === true && secondState === true && firstEnable === true && secondEnable === true) {
							if (sCurrentPrio === "0" && aData[i].Overlapping === "0") {
								//no locks for this case
							} else {
								sap.m.MessageToast.show("Oops,this is an overlapping hotline, selections are not allowed");
								oRow[stateText] = false;
								break;
							}
						}
					}
				} catch (e) {
					//ignore
				}
			}
			this.getView().byId("caTable").getModel().refresh(true);
		}, //end check method
		saveAll: function() {
			var aTableData = this.getView().byId("caTable").getModel().getData();
			var oListModel = this.getView().byId("hCaList").getModel();
			var aData = oListModel.getData().results;
			var batchChanges = [];
			var iCtr = 0;
			var sPath = "";
			var sCW, sHotlineKey, sValue;
			var oEntry = {};
			// sap.ui.core.BusyIndicator.show();
			/*
			Create Batch only iff
			1.	it is changed by the user ( new state does not match with old state)
			*/
			var aInitData = this.oInitModel.getData();
			var sOldValue = "",
				temp, temp1, changedBy;
			for (var i = 0; i < aData.length; i++) {
				if (aData[i].Overlapping <= "1") {
					for (var j = 0; j < aTableData.length; j++) {
						sCW = aTableData[j].CW;
						sHotlineKey = aData[i].HotlineNum;
						temp = aTableData[j];
						temp1 = aInitData[j];
						sValue = temp[sHotlineKey];
						sOldValue = temp1[sHotlineKey];
						changedBy = sHotlineKey + "_E";
						changedBy = temp[changedBy];
						if (changedBy === true && sValue !== sOldValue) {
							//create batch
							if (sValue === true) {
								sValue = "1";
							} else {
								sValue = "0";
							}
							oEntry = {};
							oEntry.CW = sCW;
							oEntry.HotlineKey = sHotlineKey;
							oEntry.Value = sValue;
							oEntry.Cal_year = temp["Cal_year"];
							oEntry.Quarter = "";
							sPath = "Choice_CASet(CW='" + sCW + "',HotlineKey='" + sHotlineKey + "')";
							batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
							this.oModel.addBatchChangeOperations(batchChanges);
							if (batchChanges.length === 5) {
								this.oModel.submitBatch(function() {},
									function(err) {
										sap.m.MessageBox.error("Failed to Save. Please Try Again");
									},
									false);
								batchChanges = [];
							}
							iCtr = iCtr + 1;
						}
					}
				}
			}
			if (batchChanges.length > 0) {
				this.oModel.submitBatch(function() {},
					function(err) {
						sap.m.MessageBox.error("Failed to Save. Please Try Again");
					},
					false);
				batchChanges = [];
			}
			var sDate;
			for (i = 0; i < aData.length; i++) {
				if (aData[i].Overlapping >= "4") {
					for (j = 0; j < aTableData.length; j++) {
						sCW = aTableData[j].CW;
						sHotlineKey = aData[i].HotlineNum;
						temp = aTableData[j];
						temp1 = aInitData[j];
						for (var k = 1; k <= 5; k++) {
							sValue = temp[sHotlineKey + "_" + k + "D"];
							sOldValue = temp1[sHotlineKey + "_" + k + "D"];
							changedBy = temp[sHotlineKey + "_" + k + "E"];
							sDate = temp[sHotlineKey + "_" + k + "Date"];
							if (changedBy === true && sValue !== sOldValue) {
								//create batch
								if (sValue === true) {
									sValue = "1";
								} else {
									sValue = "0";
								}
								oEntry = {};
								oEntry.CalWeek = sCW.toString();
								oEntry.CalDate = sDate;
								oEntry.HotlineNum = sHotlineKey;
								oEntry.Choice = sValue;
								oEntry.CalYear = temp["Cal_year"];
								oEntry.Quarter = "";
								oEntry.Country = "CA"; //india from this page
								sPath = "Choice_weekSet(CalDate='" + sDate + "',HotlineNum='" + sHotlineKey + "')";
								batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
								this.oModel.addBatchChangeOperations(batchChanges);
								if (batchChanges.length === 5) {
									this.oModel.submitBatch(function() {},
										function(err) {
											sap.m.MessageBox.error("Failed to Save. Please Try Again");
										},
										false);
									batchChanges = [];
								}
								iCtr = iCtr + 1;
							}
						}
					}
				}
			}
			if (batchChanges.length > 0) {
				this.oModel.submitBatch(function() {},
					function(err) {
						sap.m.MessageBox.error("Failed to Save. Please Try Again");
					},
					false);
				batchChanges = [];
			}
			if (iCtr === 0) {
				// sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.information("There were no changes to be saved", {
					icon: sap.m.MessageBox.Icon.INFORMATION,
					title: "Info"
				});
			} else {
				sap.m.MessageBox.success("Data saved succesfully");
			}
		}
	});
});