sap.ui.define([
	"Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function (BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	jQuery.sap.require("jquery.sap.storage");
	return BaseController.extend("Hotline.controller.Home", {
		formatter: formatter,
		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("appHome").attachPatternMatched(this._onObjectMatched, this);
		},
		onOpenDialog: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("update");
		},
		_onObjectMatched: function (oEvent) {
			var that = this;
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/";
			this.getView().byId("__table0").setVisible(false);
			var oEditModel = new sap.ui.model.json.JSONModel({
				HotlineNum: "",
				CalendarWeek: "",
				CalYear: "",
				CommentText: "",
				CommentId: "",
				visible: "No"
			});
			var oBtnModel = new sap.ui.model.json.JSONModel({
				table: "N"
			});

			var oTableShowModel = new sap.ui.model.json.JSONModel({
				selectedKey: "today"
			});
			var oDailyModel = new sap.ui.model.json.JSONModel({
				show: false
			});
			this.getView().setModel(oDailyModel, "cpar");
			this.getView().setModel(oTableShowModel, "selTab");
			this.getView().setModel(oBtnModel, "tableType");
			this.getView().setModel(oEditModel, "editComment");
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.oModel);
			this.oModel.read("/UserDetailsSet", {
				success: function (oData) {
					oHeaderModel.setData(oData.results);
					that.getView().setModel(oHeaderModel, "head");
					that.displayHotlines();
					var role = that.setRoles();
					that._showButtons(role);
				}
			});
			var oSwitch = new sap.ui.model.json.JSONModel();
			this.oModel.read("/ToggleMailSet('')", {
				success: function (oData) {
					if (oData.FLAG === "X") {
						oData.FLAG = true;
					} else {
						oData.FLAG = false;
					}
					oSwitch.setData(oData);
				}
			});
			this.getView().setModel(oSwitch, "mail");
			this._getEndUserEditFlag();
		},
		_getEndUserEditFlag: function () {
			var oHLModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/EndUserEditSet", {
				success: function (oData) {
					oHLModel.setData(oData);
				}
			});
			this.getView().setModel(oHLModel, "userEdit");
		},
		getGroupWeek: function (oGroup) {
			var sTitle = "Calendar Week : " + oGroup.key;
			return new sap.m.GroupHeaderListItem({
				title: sTitle,
				upperCase: false
			});
		},
		changeColorsDaily: function () {
			var oTable = this.getView().byId("__dailyView");
			var i, row;
			var oItems = oTable.getItems();
			for (i = 0; i < oItems.length; i++) {
				try {
					row = oItems[i].sId;
					if (oItems[i].getCells()[9].mBindingInfos.text.binding.oValue === "C") {

						sap.ui.getCore().byId(row).addStyleClass("currentWeekRowDaily");
						sap.ui.getCore().byId(row).focus();
					} else {
						sap.ui.getCore().byId(row).removeStyleClass("currentWeekRowDaily");
					}

				} catch (e) {
					continue;
				}
			}
		},
		displayHotlines: function () {
			var that = this;
			this.oHLModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserHotlinesSet", {
				success: function (oData) {
					that.oHLModel.setData(oData);
					that._showIconFilters();
				}
			});
		},
		_showIconFilters: function () {
			var oIconTab = this.getView().byId("__mainTab");
			var aRes = [];
			oIconTab.destroyItems();
			aRes = this.oHLModel.getData().results;
			var oIconTabFilter = new sap.m.IconTabFilter({
				text: "Today's Hotliners",
				key: "today"
			});
			oIconTab.addItem(oIconTabFilter);
			oIconTab.addItem(new sap.m.IconTabSeparator());

			oIconTabFilter = new sap.m.IconTabFilter({
				text: "My View",
				key: "myView"
			});
			oIconTab.addItem(oIconTabFilter);
			oIconTab.addItem(new sap.m.IconTabSeparator());

			oIconTab.setSelectedKey("today");
			for (var i = 0; i < aRes.length; i++) {
				var sIconKey = aRes[i].HotlineNum + "||" + aRes[i].Priority;
				oIconTabFilter = new sap.m.IconTabFilter({
					text: aRes[i].HotlineTxt,
					key: sIconKey
				});
				oIconTab.addItem(oIconTabFilter);
				if (i < aRes.length - 1) {
					oIconTab.addItem(new sap.m.IconTabSeparator());
				}
			}
			oIconTab.addItem(new sap.m.IconTabSeparator());
			oIconTabFilter = new sap.m.IconTabFilter({
				text: "HFC/Cloud Tasks",
				key: "HFC||1"
			});
			oIconTab.addItem(oIconTabFilter);
			this.onSelectTab();
		},
		_getTodaysHotliners: function () {
			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ARES_TV_DISPLAY_SRV/");
			this.getView().setModel(oModel);
			var oInModel = new sap.ui.model.json.JSONModel();
			var oDeModel = new sap.ui.model.json.JSONModel();
			var oCaModel = new sap.ui.model.json.JSONModel();
			var aInData = [],
				aCaData = [],
				aDeData = [];
			oModel.read("/HotlinerSet", {
				success: function (oData) {
					if (oData.results.length > 0) {
						for (var i = 0; i < oData.results.length; i++) {
							aInData.results = [];
							aDeData.results = [];
							aCaData.results = [];
							if (oData.results[i].InPrimary !== "" || oData.results[i].InBackup !== "") {
								aInData.push(oData.results[i]);
							}
							if (oData.results[i].DePrimary !== "" || oData.results[i].DeBackup !== "") {
								aDeData.push(oData.results[i]);
							}
							if (oData.results[i].CaPrimary !== "" || oData.results[i].CaBackup !== "") {
								aCaData.push(oData.results[i]);
							}
						}
					}
					oInModel.setData(aInData);
					oDeModel.setData(aDeData);
					oCaModel.setData(aCaData);
				}
			});
			this.getView().setModel(oInModel, "IN");
			this.getView().setModel(oDeModel, "DE");
			this.getView().setModel(oCaModel, "CA");
		},
		_setCPARModel: function (bState) {
			var oModel = this.getView().getModel("cpar");
			oModel.getData().show = bState;
			oModel.refresh(true);
		},
		onSelectTab: function (oControlEvent) {
			var oModel = this.getView().getModel("selTab");
			var aData = oModel.getData();
			var sKey = "",
				sPriority = "";
			var that = this;
			var aFilters = [],
				oFilter;
			var aHeadData;
			var oBtnModel = this.getView().getModel("tableType");
			var aBtnData = oBtnModel.getData();
			if (oControlEvent === undefined) {
				sKey = "today";
				sPriority = 0;

			} else {
				var aKey = oControlEvent.mParameters.key;
				aKey = aKey.split("||");
				sKey = aKey[0];
				sPriority = aKey[1];
			}
			this.sKey = sKey;
			if (sKey === "CPAR") {
				this._setCPARModel(false);
			} else {
				this._setCPARModel(true);
			}
			if (sKey === "today") {
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.getView().byId("__dailyView").setVisible(false);
				this._getTodaysHotliners();
			} else if (sKey === "All" || sKey === "myView") { //load my view
				//load myviewset 
				aBtnData.table = "N";
				oBtnModel.setData(aBtnData);
				oBtnModel.refresh(true);
				this.oMyViewModel = new sap.ui.model.json.JSONModel();
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(true);
				this.getView().byId("__dailyView").setVisible(false);
				aHeadData = this.getView().getModel("head").getData();
				oFilter = new sap.ui.model.Filter("CW", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CY", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/MyViewSet", {
					filters: aFilters,
					success: function (oData) {
						that.oMyViewModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("myViewTable").setModel(this.oMyViewModel, "my");
			} else if (sKey === "HFC") {
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.getView().byId("__dailyView").setVisible(false);
			} else if (sKey === "CPAR") { //load cloud table
				aBtnData.table = "N";
				oBtnModel.setData(aBtnData);
				oBtnModel.refresh(true);
				this.getView().byId("__dailyView").setVisible(true);
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.oDTableModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sKey);
				aHeadData = this.getView().getModel("head").getData();
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/DailyHotlinerSet", {
					filters: aFilters,
					success: function (oData) {
						that.oDTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						//call User Value Set
						that._getUsers(sKey);
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}

				});
				this.getView().byId("__dailyView").setModel(this.oDTableModel, "daily");
			} else if (sKey === "BYD" || sKey === "CLOUD") {
				aBtnData.table = "M";
				oBtnModel.setData(aBtnData);
				oBtnModel.refresh(true);
				this.getView().byId("__dailyView").setVisible(true);
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.oDTableModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sKey);
				aHeadData = this.getView().getModel("head").getData();
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Month);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/MonthlyHotlinerSet", {
					filters: aFilters,
					success: function (oData) {
						that.oDTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						//call User Value Set
						that._getUsers(sKey);
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}

				});
				this.getView().byId("__dailyView").setModel(this.oDTableModel, "daily");
			} else { //load based on hotlines
				aBtnData.table = "N";
				oBtnModel.setData(aBtnData);
				oBtnModel.refresh(true);
				this.sKey = sKey;
				this.sPriority = sPriority;
				this.getView().byId("myViewTable").setVisible(false);
				this.getView().byId("__table0").setVisible(true);
				this.getView().byId("__dailyView").setVisible(false);
				this.oTableModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sKey);
				aHeadData = this.getView().getModel("head").getData();
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				this.getView().byId("__column3_de").setVisible(true);
				this.getView().byId("__label4_de").setText("Backup DE");
				if (sPriority === "0") {
					this.getView().byId("__column4").setVisible(false);
					this.getView().byId("__column4_de").setVisible(false);
				} else {
					this.getView().byId("__column4").setVisible(true);
					this.getView().byId("__column4_de").setVisible(true);
				}
				switch (sKey) {
				case 'GS':
					//only IN
					this.getView().byId("__column3_de").setVisible(false);
					break;
				case 'INTINC':
					this.getView().byId("__column3_de").setVisible(false);
					this.getView().byId("__column4_de").setVisible(false);
					break;
				case 'BP':
					//only in primary
					this.getView().byId("__column3_de").setVisible(false);
					break;
				case 'TOOLS':
					//no backup
					break;
				case 'AOF':
					//change backup de to peer
					this.getView().byId("__label4_de").setText("Primary DE Peer");
					break;
				case 'CLOUD':
					//show all
					break;
				case 'BYD':
					//show all
					break;
				}
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/HotlinerSet", {
					filters: aFilters,
					success: function (oData) {
						that.oTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						//call User Value Set
						that._getUsers(sKey);
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}

				});
				this.getView().byId("__table0").setModel(this.oTableModel, "tab");
			}

		},
		onDailyPress: function (oEvent) {
			var aRolesData = sap.ui.getCore().getModel("roles").getData();
			var sKey = this.getView().byId("__mainTab").getSelectedKey();
			var aKey = sKey.split("||");
			var sHotline = aKey[0];
			var flag = false;
			for (var i = 0; i < aRolesData.length; i++) {
				if (aRolesData[i].Role === sHotline) {
					if (aRolesData[i].Admin === "Y") {
						flag = true;
						break;
					}
				}
			}
			if (!flag) {
				var aData = this.getView().getModel("userEdit").getData().results;
				for (i = 0; i < aData.length; i++) {
					if (aData[i].Hotline === sHotline) {
						if (aData[i].Edit == "true") {
							flag = true;
							break;
						}
					}
				}
			}
			if (flag) {
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("Hotline.view.HomeAssignment", this);
				}

				this.oSelectedItem = oEvent.getParameters("listitem");
				var sHotline = this.oSelectedItem.listItem.getBindingContext("daily").getProperty("HotlineNum");
				var sEditFlag = this.oSelectedItem.listItem.getBindingContext("daily").getProperty("Edit");
				if (sEditFlag !== "X") {
					this._oDialog.open();
					var i;
					var aHide = [],
						aShow = [];
					if (sHotline === "CPAR") {
						aHide = ["__hi02", "__h02", "saveBtn", "__hi03_ca", "__h03_ca",
							"__h04_ca", "__hi04_ca", "__hi03", "__h03", "__h04",
							"__hi04",
						];
						aShow = [
							"__hi03_de", "__h03_de", "__h04_de", "__hi04_de", "saveBtn2"
						];

					} else {
						aHide = ["__hi02", "__h02", "saveBtn"];
						aShow = ["__hi03", "__h03", "__h04", "__hi04",
							"__hi03_de", "__h03_de", "__h04_de", "__hi04_de",
							"__hi03_ca", "__h03_ca", "__h04_ca", "__hi04_ca", "saveBtn2"
						];
						//hide to_date, show all 6 regions

					}
					for (i = 0; i < aHide.length; i++) {
						sap.ui.getCore().byId(aHide[i]).setVisible(false);
					}
					for (i = 0; i < aShow.length; i++) {
						sap.ui.getCore().byId(aShow[i]).setVisible(true);
					}
					var oCurrentContext = this.oSelectedItem.listItem.getBindingContext("daily");
					var sCalWeek = oCurrentContext.getProperty("CalendarWeek");
					var sFromDate = oCurrentContext.getProperty("Date");
					var sPrimary = oCurrentContext.getProperty("PrimaryName");
					var sBackup = oCurrentContext.getProperty("BackupName");
					var sPrimaryDe = oCurrentContext.getProperty("PrimaryName_DE");
					var sBackupDe = oCurrentContext.getProperty("BackupName_DE");
					var sPrimaryCa = oCurrentContext.getProperty("PrimaryName_CA");
					var sBackupCa = oCurrentContext.getProperty("BackupName_CA");
					sap.ui.getCore().byId("__hi00").setValue(sCalWeek);
					sap.ui.getCore().byId("__hi01").setValue(sFromDate);
					sap.ui.getCore().byId("__hi03").setValue(sPrimary);
					sap.ui.getCore().byId("__inP1").setValue(oCurrentContext.getProperty("HlPrimary"));
					sap.ui.getCore().byId("__hi04").setValue(sBackup);
					sap.ui.getCore().byId("__inP2").setValue(oCurrentContext.getProperty("HlBackup"));
					sap.ui.getCore().byId("__hi03_de").setValue(sPrimaryDe);
					sap.ui.getCore().byId("__deP1").setValue(oCurrentContext.getProperty("HlPrimary_DE"));
					sap.ui.getCore().byId("__hi04_de").setValue(sBackupDe);
					sap.ui.getCore().byId("__deP2").setValue(oCurrentContext.getProperty("HlBackup_DE"));
					sap.ui.getCore().byId("__hi03_ca").setValue(sPrimaryCa);
					sap.ui.getCore().byId("__caP1").setValue(oCurrentContext.getProperty("HlPrimary_CA"));
					sap.ui.getCore().byId("__hi04_ca").setValue(sBackupCa);
					sap.ui.getCore().byId("__caP2").setValue(oCurrentContext.getProperty("HlBackup_CA"));
				} else {
					sap.m.MessageBox.warning("Oops! You can not edit hotlines of the past");
				}
			} else {
				sap.m.MessageBox.warning("Only Admins are authorized to edit hotlines");
			}
		},
		updateEntry: function () {
			var oItem = this.oSelectedItem.listItem.getBindingContext("daily");
			var sCalWeek = sap.ui.getCore().byId("__hi00").getValue();
			var sPrimary = sap.ui.getCore().byId("__inP1").getValue();
			var sBackup = sap.ui.getCore().byId("__inP2").getValue();
			var sPrimaryDe = sap.ui.getCore().byId("__deP1").getValue();
			var sBackupDe = sap.ui.getCore().byId("__deP2").getValue();
			var sPrimaryCa = sap.ui.getCore().byId("__caP1").getValue();
			var sBackupCa = sap.ui.getCore().byId("__caP2").getValue();
			var sMsg = "";
			if (sMsg.length > 0) { //errors
				sap.m.MessageBox.error(sMsg);
			} else {
				var sPath = "",
					that = this,
					oEntry = {};
				if (sap.ui.getCore().byId("__hi03").getValue() === "") {
					sPrimary = "";
				}
				if (sap.ui.getCore().byId("__hi04").getValue() === "") {
					sBackup = "";
				}
				if (sap.ui.getCore().byId("__hi03_de").getValue() === "") {
					sPrimaryDe = "";
				}
				if (sap.ui.getCore().byId("__hi04_de").getValue() === "") {
					sBackupDe = "";
				}
				if (sap.ui.getCore().byId("__hi03_ca").getValue() === "") {
					sPrimaryCa = "";
				}
				if (sap.ui.getCore().byId("__hi04_ca").getValue() === "") {
					sBackupCa = "";
				}
				oEntry.HotlineNum = oItem.getProperty("HotlineNum");
				oEntry.CalendarWeek = sCalWeek;
				oEntry.CalYear = oItem.getProperty("CalYear");
				oEntry.Date = oItem.getProperty("Date");
				oEntry.HlPrimary = sPrimary;
				oEntry.PrimaryName = "";
				oEntry.HlPrimary_DE = sPrimaryDe;
				oEntry.HlPrimary_CA = sPrimaryCa;
				oEntry.PrimaryName_DE = "";
				oEntry.PrimaryName_CA = "";
				oEntry.HlBackup = sBackup;
				oEntry.BackupName = "";
				oEntry.HlBackup_DE = sBackupDe;
				oEntry.HlBackup_CA = sBackupCa;
				oEntry.BackupName_DE = "";
				oEntry.BackupName_CA = "";
				if (sPrimary !== "" && sBackup !== "" && sPrimary === sBackup && sPrimary !== "holiday") {
					sap.m.MessageToast.show("Primary and Backup cannot be same");
				} else if (sPrimaryDe !== "" && sBackupDe !== "" && sPrimaryDe === sBackupDe && sPrimaryDe !== "holiday") {
					sap.m.MessageToast.show("Primary and Backup cannot be same");
				} else if (sPrimaryCa !== "" && sBackupCa !== "" && sPrimaryCa === sBackupCa && sPrimaryCa !== "holiday") {
					sap.m.MessageToast.show("Primary and Backup cannot be same");
				} else {
					oEntry.Edit = oItem.getProperty("Edit");
					sPath = "/DailyHotlinerSet(HotlineNum='" + oEntry.HotlineNum +
						"',CalendarWeek='" + oEntry.CalendarWeek +
						"',CalYear='" + oEntry.CalYear + "',Date='" + oEntry.Date + "')";
					this.oModel.update(sPath, oEntry, {
						success: function () {
							//refresh table
							that.closeDialog();
							sap.m.MessageBox.success("Update Successful");
							that.refreshAssignments();
						},
						error: function () {
							sap.m.MessageBox.error("Update Failed. Please try again");
						}
					});
				}
			}
		},
		//allow only if the user is admin of the same group
		onItemPress: function (oEvent) {
			var aRolesData = sap.ui.getCore().getModel("roles").getData();
			var sKey = this.getView().byId("__mainTab").getSelectedKey();
			var aKey = sKey.split("||");
			var sHotline = aKey[0];
			var flag = false;
			for (var i = 0; i < aRolesData.length; i++) {
				if (aRolesData[i].Role === sHotline) {
					if (aRolesData[i].Admin === "Y") {
						flag = true;
						break;
					}
				}
			}
			if (!flag) {
				var aData = this.getView().getModel("userEdit").getData().results;
				for (i = 0; i < aData.length; i++) {
					if (aData[i].Hotline === sHotline) {
						if (aData[i].Edit == "true") {
							flag = true;
							break;
						}
					}
				}
			}
			if (flag) {
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("Hotline.view.HomeAssignment", this);
				}
				this.oSelectedItem = oEvent.getParameters("listitem");
				var sEditFlag = this.oSelectedItem.listItem.getBindingContext("tab").getProperty("Edit");
				if (sEditFlag === "") {
					this._oDialog.open();
					var i;
					var aHide = ["__hi03_ca", "__h03_ca", "__h04_ca", "__hi04_ca", "saveBtn2"];
					var aShow = ["__hi02", "__h02", "saveBtn"];

					var oCurrentContext = this.oSelectedItem.listItem.getBindingContext("tab");
					var sCalWeek = oCurrentContext.getProperty("CalendarWeek");
					var sFromDate = oCurrentContext.getProperty("FromDate");
					var sToDate = oCurrentContext.getProperty("ToDate");
					var sPrimary = oCurrentContext.getProperty("PrimaryName");
					var sBackup = oCurrentContext.getProperty("BackupName");
					var sPrimaryDe = oCurrentContext.getProperty("PrimaryName_DE");
					var sBackupDe = oCurrentContext.getProperty("BackupName_DE");
					sap.ui.getCore().byId("__hi00").setValue(sCalWeek);
					sap.ui.getCore().byId("__hi01").setValue(sFromDate);
					sap.ui.getCore().byId("__hi02").setValue(sToDate);
					sap.ui.getCore().byId("__hi03").setValue(sPrimary);
					sap.ui.getCore().byId("__hi03_de").setValue(sPrimaryDe);
					sap.ui.getCore().byId("__inP1").setValue(oCurrentContext.getProperty("HlPrimary"));
					sap.ui.getCore().byId("__deP1").setValue(oCurrentContext.getProperty("HlPrimary_DE"));
					if (this.getView().byId("__column4").getVisible()) { //with backup
						sap.ui.getCore().byId("__hi04").setValue(sBackup);
						sap.ui.getCore().byId("__hi04_de").setValue(sBackupDe);
						sap.ui.getCore().byId("__inP2").setValue(oCurrentContext.getProperty("HlBackup"));
						sap.ui.getCore().byId("__deP2").setValue(oCurrentContext.getProperty("HlBackup_DE"));
						aShow.push("__hi04");
						aShow.push("__h04");
						aShow.push("__hi04_de");
						aShow.push("__h04_de");
						aShow.push("__hi03_de");
						aShow.push("__h03_de");
					} else {
						sap.ui.getCore().byId("__hi04").setValue(""); //in b
						sap.ui.getCore().byId("__inP2").setValue(""); //in b
						sap.ui.getCore().byId("__deP2").setValue(""); // de b
						sap.ui.getCore().byId("__hi04_de").setValue(""); // de b
						aHide.push("__hi04");
						aHide.push("__h04");
						aHide.push("__hi04_de");
						aHide.push("__h04_de");
						if (!this.getView().byId("__column3_de").getVisible()) {
							sap.ui.getCore().byId("__hi04").setValue("");
							sap.ui.getCore().byId("__inP2").setValue("");
							sap.ui.getCore().byId("__deP2").setValue("");
							sap.ui.getCore().byId("__deP1").setValue("");
							sap.ui.getCore().byId("__hi04_de").setValue("");
							sap.ui.getCore().byId("__hi03_de").setValue("");
							aHide.push("__h03_de");
							aHide.push("__hi03_de");
							aHide.push("__h04");
							aHide.push("__hi04");
							aHide.push("__h04_de");
							aHide.push("__hi04_de");
						}
					}
					for (i = 0; i < aHide.length; i++) {
						sap.ui.getCore().byId(aHide[i]).setVisible(false);
					}
					for (i = 0; i < aShow.length; i++) {
						sap.ui.getCore().byId(aShow[i]).setVisible(true);
					}
				} else {
					sap.m.MessageBox.warning("Oops! You can not edit hotlines of the past");
				}
			} else {
				sap.m.MessageBox.warning("Only Admins are authorized to edit hotlines");
			}
		},
		closeDialog: function () {
			this._oDialog.close();
		},
		refreshAssignments: function () {
			var that = this;
			var aFilters = [],
				oFilter;
			this.oTableModel = new sap.ui.model.json.JSONModel();
			var aHeadData = this.getView().getModel("head").getData();
			if (this.sKey === "CPAR") {
				this._setCPARModel(false);
			} else {
				this._setCPARModel(true);
			}
			if (this.sKey === "All" || this.sKey === "myView") { //load my view
				//load myviewset 
				this.oMyViewModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("CW", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CY", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/MyViewSet", {
					filters: aFilters,
					success: function (oData) {
						that.oMyViewModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("myViewTable").setModel(this.oMyViewModel, "my");
			} else if (this.sKey === "CPAR") { //load cloud table
				this.getView().byId("__dailyView").setVisible(true);
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.oDTableModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
				aHeadData = this.getView().getModel("head").getData();
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/DailyHotlinerSet", {
					filters: aFilters,
					success: function (oData) {
						that.oDTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						//call User Value Set
						that._getUsers(that.sKey);
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}

				});
				this.getView().byId("__dailyView").setModel(this.oDTableModel, "daily");
			} else if (this.sKey === "BYD" || this.sKey === "CLOUD") {
				this.getView().byId("__dailyView").setVisible(true);
				this.getView().byId("__table0").setVisible(false);
				this.getView().byId("myViewTable").setVisible(false);
				this.oDTableModel = new sap.ui.model.json.JSONModel();
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
				aHeadData = this.getView().getModel("head").getData();
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Month);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/MonthlyHotlinerSet", {
					filters: aFilters,
					success: function (oData) {
						that.oDTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						//call User Value Set
						that._getUsers(that.sKey);
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}

				});
				this.getView().byId("__dailyView").setModel(this.oDTableModel, "daily");
			} else {
				oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
				aFilters.push(oFilter);
				if (this.sPriority === "0") {
					this.getView().byId("__column4").setVisible(false);
				} else {
					this.getView().byId("__column4").setVisible(true);
				}
				sap.ui.core.BusyIndicator.show();
				this.oModel.read("/HotlinerSet", {
					filters: aFilters,
					success: function (oData, oResponse) {
						that.oTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function () {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("__table0").setModel(this.oTableModel, "tab");
			}
		},
		_showButtons: function (roles) {
			var aStr = roles.split(":");
			var sSuper = aStr[0];
			var sAdmin = aStr[1];
			var sUser = aStr[2];

			if (sSuper === "true") {
				this.getView().byId("_home2").setVisible(true);
				this.getView().byId("_home3").setVisible(true);
				this.getView().byId("_home0").setVisible(true);
				//show editing options
				this.getView().byId("__item0").setType("Navigation");
			} else {
				this.getView().byId("_home2").setVisible(false);
				this.getView().byId("_home3").setVisible(false);
				this.getView().byId("_home0").setVisible(false);
				//hide editing options
				this.getView().byId("__item0").setType("Inactive");
			}
			//admins
			if (sAdmin === "true") {
				this.getView().byId("_home1").setVisible(true);
				this.getView().byId("__item0").setType("Navigation");
			} else {
				this.getView().byId("_home1").setVisible(false);
			}
			//normal user
			if (sUser === "true") {
				this.getView().byId("_home5").setVisible(true);
			} else {
				this.getView().byId("_home5").setVisible(false);
			}
		},
		_getUsers: function (pKey) {
			var aFilters = [],
				that = this;
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, pKey);
			aFilters.push(oFilter);
			this.oUserModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oUserModel.setData(oData);
				}
			});
			this.getView().setModel(this.oUserModel, "user");

			aFilters = [];
			this.oUserModelDe = new sap.ui.model.json.JSONModel();
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, this.sKey + "_GER");
			aFilters.push(oFilter);
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oUserModelDe.setData(oData);
				}
			});
			this.getView().setModel(this.oUserModelDe, "ger");

			aFilters = [];
			this.oUserModelCa = new sap.ui.model.json.JSONModel();
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, this.sKey + "_CAN");
			aFilters.push(oFilter);
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oUserModelCa.setData(oData);
				}
			});
			this.getView().setModel(this.oUserModelCa, "can");
		},
		//India Primary
		handleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"Hotline.view.Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}
			// create a filter for the binding
			this._valueHelpDialog.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},
		_handleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__inP1").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//India Backup
		backupHandleValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialogIN) {
				this._valueHelpDialogIN = sap.ui.xmlfragment(
					"Hotline.view.BackupDialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialogIN);
			}
			// create a filter for the binding
			this._valueHelpDialogIN.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialogIN.open(sInputValue);
		},
		_backupHandleValueHelpSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__inP2").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Germany PRIMARY pop up
		handleDeValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog_DE) {
				this._valueHelpDialog_DE = sap.ui.xmlfragment(
					"Hotline.view.DE_Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog_DE);
			}
			// create a filter for the binding
			this._valueHelpDialog_DE.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog_DE.open(sInputValue);
		},
		_handleValueHelpSearch_DE: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose_DE: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__deP1").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//GERMANY BACKUP POPUP
		backupHandleDeValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueHelpDialog_DE2) {
				this._valueHelpDialog_DE2 = sap.ui.xmlfragment(
					"Hotline.view.DE_BackupDialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog_DE2);
			}
			// create a filter for the binding
			this._valueHelpDialog_DE2.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog_DE2.open(sInputValue);
		},
		_backupHandleValueHelpSearch_DE: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose_DE: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__deP2").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Canada PRIMARY pop up
		handleCaValueHelp: function (oEvent) {
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
			// create a filter for the binding
			this._valueHelpDialog_CA.getBinding("items").filter([new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog_CA.open(sInputValue);
		},
		_handleValueHelpSearch_CA: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose_CA: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__caP1").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//CANADA BACKUP POPUP
		backupHandleCaValueHelp: function (oEvent) {
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
		_backupHandleValueHelpSearch_CA: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose_CA: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sName = oSelectedItem.getTitle();
				userInput.setValue(sName);
				sap.ui.getCore().byId("__caP2").setValue(oSelectedItem.getDescription());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		createEntry: function () {
			var oItem = this.oSelectedItem.listItem.getBindingContext("tab");
			var sCalWeek = sap.ui.getCore().byId("__hi00").getValue();
			var sPrimary = sap.ui.getCore().byId("__inP1").getValue();
			var sBackup = sap.ui.getCore().byId("__inP2").getValue();
			var sPrimaryDe = sap.ui.getCore().byId("__deP1").getValue();
			var sBackupDe = sap.ui.getCore().byId("__deP2").getValue();
			var sMsg = "";
			// if (sPrimary === "" || sPrimaryDe === "") {
			// 	sMsg = "Primary Hotliner cannot be empty";
			// }
			// if (this.getView().byId("__column4").getVisible() === true && sBackup === "") {
			// 	sMsg = sMsg + "\n Backup Hotliner cannot be empty";
			// }
			// if (this.getView().byId("__column4_de").getVisible() === true && sBackupDe === "") {
			// 	sMsg = sMsg + "\n Backup Hotliner cannot be empty";
			// }
			if (sMsg.length > 0) { //errors
				sap.m.MessageBox.error(sMsg);
			} else {
				var sPath = "",
					that = this,
					oEntry = {};
				if (sap.ui.getCore().byId("__hi03").getValue() === "") {
					sPrimary = "";
				}
				if (sap.ui.getCore().byId("__hi04").getValue() === "") {
					sBackup = "";
				}
				if (sap.ui.getCore().byId("__hi03_de").getValue() === "") {
					sPrimaryDe = "";
				}
				if (sap.ui.getCore().byId("__hi04_de").getValue() === "") {
					sBackupDe = "";
				}
				oEntry.HotlineNum = oItem.getProperty("HotlineNum");
				oEntry.CalendarWeek = sCalWeek;
				oEntry.CalYear = oItem.getProperty("CalYear");
				oEntry.FromDate = oItem.getProperty("FromDate");
				oEntry.ToDate = oItem.getProperty("ToDate");
				oEntry.HlPrimary = sPrimary;
				oEntry.PrimaryName = "";
				oEntry.HlPrimary_DE = sPrimaryDe;
				oEntry.PrimaryName_DE = "";
				oEntry.HlBackup = sBackup;
				oEntry.BackupName = "";
				oEntry.HlBackup_DE = sBackupDe;
				oEntry.BackupName_DE = "";
				oEntry.Edit = oItem.getProperty("Edit");
				if (sPrimary !== "" && sBackup !== "" && sPrimary === sBackup) {
					sap.m.MessageToast.show("Primary and Backup cannot be same");
				} else if (sPrimaryDe !== "" && sBackupDe !== "" && sPrimaryDe === sBackupDe) {
					sap.m.MessageToast.show("Primary and Backup cannot be same");
					// } else if (sPrimaryCa !== "" && sBackupCa !== "" && sPrimaryCa === sBackupCa) {
					// 	sap.m.MessageToast.show("Primary and Backup cannot be same");
				} else {
					sPath = "/HotlinerSet(HotlineNum='" + oEntry.HotlineNum +
						"',CalendarWeek='" + oEntry.CalendarWeek +
						"',CalYear='" + oEntry.CalYear + "')";
					this.oModel.update(sPath, oEntry, {
						success: function () {
							//refresh table
							that.closeDialog();
							sap.m.MessageBox.success("Update Successful");
							that.refreshAssignments();
						},
						error: function () {
							sap.m.MessageBox.error("Update Failed. Please try again");
						}
					});
				}
			}
		},
		changeColors: function () {
			var oTable = this.getView().byId("__table0");
			var i, row;
			var oItems = oTable.getItems();
			for (i = 0; i < oItems.length; i++) {
				row = oItems[i].sId;
				if (oItems[i].getCells()[8].mBindingInfos.text.binding.oValue === "C") {
					this.getView().byId(row).addStyleClass("currentWeekRow");
				} else {
					this.getView().byId(row).removeStyleClass("currentWeekRow");
				}
			}
		},
		editDailyComment: function (oControlEvent) {
			if (!this._showCommentDialog) {
				this._showCommentDialog = sap.ui.xmlfragment(
					"Hotline.view.Comment",
					this
				);
				this.getView().addDependent(this._showCommentDialog);
			}
			var sPath = oControlEvent.getSource().getBindingContext("daily").sPath;
			this._getComments(sPath, "load", "__dailyView", "daily");
		},
		showComment: function (oControlEvent) {
			if (!this._showCommentDialog) {
				this._showCommentDialog = sap.ui.xmlfragment(
					"Hotline.view.Comment",
					this
				);
				this.getView().addDependent(this._showCommentDialog);
			}
			var sPath = oControlEvent.getSource().getBindingContext("tab").sPath;
			this._getComments(sPath, "load", "__table0", "tab");
		},
		_getComments: function (sPath, pSource, sTableId, sModelName) {
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
					cw = aData.CalendarWeek;
				}
			} catch (e) {
				//ignore
			}
			oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, cw);
			aFilters.push(oFilter);

			oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aData.CalYear);
			aFilters.push(oFilter);

			oRowModel.setData(sPath);

			var oList = sap.ui.getCore().byId("__commentList");
			var oDeleteBtn = sap.ui.getCore().byId("__deleteComm");
			sap.ui.getCore().setModel(oRowModel, "row");
			this.oModel.read("/CommentSet", {
				filters: aFilters,
				success: function (oData) {
					that.oCommentModel.setData(oData);
					if (pSource === "load") {
						that._showCommentDialog.open();
						var roles = that.setRoles();
						var aStr = roles.split(":");
						var sSuper = aStr[0];
						var sAdmin = aStr[1];
						oList.setMode("None");
						oDeleteBtn.setVisible(false);
						if (sAdmin === "true" || sSuper === "true") {
							oList.setMode("MultiSelect");
							oDeleteBtn.setVisible(true);
						} else if (sAdmin === "false" && sSuper === "false") {
							oList.setMode("None");
							oDeleteBtn.setVisible(false);
						}
					}
					var oItemTemplate = new sap.m.FeedListItem({
						sender: "{Username}",
						text: "{CommentText}",
						// info: "{HotlineNum}, CW {CalendarWeek} /{CalYear}"
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
						oTableModel.refresh();
					} else if (oData.results.length == 0) {
						aData.Comment = "";
						oTableModel.refresh();
					}
				},
				error: function () {}
			});
		},
		saveComment: function () {
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
						cw = aData.CalendarWeek;
					}
				} catch (e) {
					//ignore
				}
				oEntry = {
					HotlineNum: aData.HotlineNum,
					CalendarWeek: cw,
					CalYear: aData.CalYear,
					CommentText: sText
				};
				var batchChanges = [];
				batchChanges.push(this.oModel.createBatchOperation("CommentSet", "POST", oEntry));
				this.oModel.addBatchChangeOperations(batchChanges);
				this.oModel.submitBatch(function () {
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
					sap.ui.getCore().byId("__commentText").setValue("");
					sap.m.MessageToast.show("Comment Added");
					sap.ui.core.BusyIndicator.hide();
				});
			}
		},
		closeComment: function () {
			sap.ui.getCore().byId("__commentText").setValueState("None");
			sap.ui.getCore().byId("__commentText").setValueStateText("");
			sap.ui.getCore().byId("__commentText").setValue("");
			this._showCommentDialog.destroy();
			this._showCommentDialog = undefined;
		},
		deleteComments: function () {
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
				this.oModel.submitBatch(function () {
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
					sap.m.MessageToast.show("Comment(s) Deleted");
					sap.ui.core.BusyIndicator.hide();
				});
			}
		},
		editSelectedComment: function (oEvent) {
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
		onPostComment: function () {
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
				success: function () {
					sap.ui.core.BusyIndicator.hide();
					sap.m.MessageToast.show("Comment Updated");
					that._getComments(oRowPath, "refresh", that.sTableId, that.sModelName);
				},
				error: function () {
					sap.ui.core.BusyIndicator.hide();
				}
			});
		},
		changeFlag: function () {
			var oModel = this.getView().getModel("mail");
			var flag = '';
			var aData = oModel.getData();
			if (aData.FLAG === true) {
				flag = 'X';
			}
			var oEntry = {
				UNAME: aData.UNAME,
				FLAG: flag
			};
			var sPath = "/ToggleMailSet('" + aData.UNAME + "')";
			this.oModel.update(sPath, oEntry, {
				success: function () {
					sap.m.MessageBox.success("Preference Saved");
				},
				error: function () {
					sap.m.MessageBox.error("Failed to Save");
				}
			});
		},
		showHelp: function () {
			if (!this._helpDialog) {
				this._helpDialog = sap.ui.xmlfragment("Hotline.view.HelpHome", this);
			}
			this._helpDialog.open();
		},
		closeHelpHome: function () {
			this._helpDialog.close();
		},
		destroyHomeHelp: function () {
			this._helpDialog = undefined;
			this._helpDialog.destroy();
		}
	});
});