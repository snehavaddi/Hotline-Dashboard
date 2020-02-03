sap.ui.define(["Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	return BaseController.extend("Hotline.controller.Assign", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("assign").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/";
			//change before upload
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			var that = this;
			var oHeaderModel = new sap.ui.model.json.JSONModel();
			this.getView().setModel(this.oModel);
			this.oModel.read("/UserDetailsSet", {
				success: function(oData) {
					oHeaderModel.setData(oData.results);
					that.getView().setModel(oHeaderModel, "head");
					that.onPageLoad();
				}
			});
		},
		onChangeQuarter: function() {
			this.refreshAssignments();
		},
		onOpenDialog: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("update");
		},
		onPageLoad: function() {
			var that = this;
			this.oHLModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/HotlineAdminSet", {
				success: function(oData) {
					if (oData.results.length > 0) {
						that.oHLModel.setData(oData);
						that._showIconFilters();
					} else {
						//add message 
						var dialog = new sap.m.Dialog({
							title: 'Warning',
							type: 'Message',
							state: 'Warning',
							content: new sap.m.Text({
								text: 'Sorry! You do not have authorization to view this page.'
							}),
							beginButton: new sap.m.Button({
								text: 'Go to Home',
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
				}
			});

		},
		_showIconFilters: function() {
			var oIconTab = this.getView().byId("__mainTab");
			oIconTab.destroyItems();
			var aRes = [];
			aRes = this.oHLModel.getData().results;
			for (var i = 0; i < aRes.length; i++) {
				var sIconKey = aRes[i].HotlineNum + "||" + aRes[i].Priority;
				var oIconTabFilter = new sap.m.IconTabFilter({
					text: aRes[i].HotlineTxt,
					key: sIconKey
				});
				oIconTab.addItem(oIconTabFilter);
				oIconTab.addItem(new sap.m.IconTabSeparator());
			}
			this.onSelectTab();
		},
		onSelectTab: function(oControlEvent) {
			var aFilters = [];
			var sKey = "",
				sPriority = "";
			if (oControlEvent === undefined) {
				sKey = this.oHLModel.getData().results[0].HotlineNum;
				sPriority = this.oHLModel.getData().results[0].Priority;
			} else {
				var aKey = oControlEvent.mParameters.key;
				aKey = aKey.split("||");
				sKey = aKey[0];
				sPriority = aKey[1];
			}
			this.sKey = sKey;
			this.sPriority = sPriority;
			var aHeadData = this.getView().getModel("head").getData();
			this.oTableModel = new sap.ui.model.json.JSONModel();
			this.oDailyTableModel = new sap.ui.model.json.JSONModel();
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
			aFilters.push(oFilter);
			//call table set based on the key selected
			var that = this;
			this.oTableModel = new sap.ui.model.json.JSONModel();
			this.getView().byId("__column2_text").setVisible(true);
			this.getView().byId("__label3_t").setText("Backup Hotliner (DE)");
			if (sPriority === "0") {
				this.getView().byId("__column3").setVisible(false);
				this.getView().byId("__column3_text").setVisible(false);
			} else {
				this.getView().byId("__column3").setVisible(true);
				this.getView().byId("__column3_text").setVisible(true);
			}
			//hide backup for de 
			this.getView().byId("__dailyTable").setVisible(false);
			this.getView().byId("__table0").setVisible(true);
			//hide tentative column --mod 1 
			this.getView().byId("__tentativeCol").setVisible(false);
			switch (sKey) {
				case 'GS':
					//only IN
					this.getView().byId("__column2_text").setVisible(false); //primary de
					break;
				case 'FATI':
					//no backup
					break;
				case 'BP':
					//only in primary
					this.getView().byId("__column2_text").setVisible(false);
					break;
				case 'TOOLS':
					//no backup
					break;
				case 'AOF':
					//change backup de to peer
					this.getView().byId("__label3_t").setText("Primary DE Peer");
					//show tentative column --mod 1
					this.getView().byId("__tentativeCol").setVisible(true);
					break;
				case 'CLOUD': //daily
					this.getView().byId("__dailyTable").setVisible(true);
					this.getView().byId("__table0").setVisible(false);
					break;
			}
			sap.ui.core.BusyIndicator.show();
			this.checkState();
			if (sKey === "CLOUD") {
				this.oModel.read("/DailyAssignmentSet", {
					filters: aFilters,
					success: function(oData) {
						that.oDailyTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("__dailyTable").setModel(this.oDailyTableModel, "daily");
			} else {
				this.oModel.read("/AssignmentSet", {
					filters: aFilters,
					success: function(oData) {
						that.oTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("__table0").setModel(this.oTableModel, "tab");
			}

			this.oUserModel = new sap.ui.model.json.JSONModel();
			aFilters = [];
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, this.sKey);
			aFilters.push(oFilter);
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
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
				success: function(oData) {
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
				success: function(oData) {
					that.oUserModelCa.setData(oData);
				}
			});
			this.getView().setModel(this.oUserModelCa, "can");

		},
		refreshAssignments: function() {
			var that = this;
			var aFilters = [];
			this.oTableModel = new sap.ui.model.json.JSONModel();
			this.oDailyTableModel = new sap.ui.model.json.JSONModel();
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
			var aHeadData = this.getView().getModel("head").getData();
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Quarter", sap.ui.model.FilterOperator.EQ, aHeadData[0].Quarter);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aHeadData[0].Year);
			aFilters.push(oFilter);
			sap.ui.core.BusyIndicator.show();

			if (this.sKey === "CLOUD") {
				// var aSorters = [];
				// var oSorter = new sap.ui.model.Sorter("CW", null,null);
				// aSorters.push(oSorter);
				// oSorter = new sap.ui.model.Sorter("Date", null, null);
				// aSorters.push(oSorter);
				this.oModel.read("/DailyAssignmentSet", {
					filters: aFilters,
					// sorters: aSorters,
					success: function(oData) {
						that.oDailyTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("__dailyTable").setModel(this.oDailyTableModel, "daily");
			} else {
				this.oModel.read("/AssignmentSet", {
					filters: aFilters,
					success: function(oData) {
						that.oTableModel.setData(oData);
						sap.ui.core.BusyIndicator.hide();
						that.checkState();
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
				this.getView().byId("__table0").setModel(this.oTableModel, "tab");
			}
		},
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
			if (this.sKey === "CLOUD") {
				oTable = this.getView().byId("__dailyTable");
				oTabModel = oTable.getModel("daily").getData();

				sap.ui.core.BusyIndicator.show();

				for (i = 0; i < oTabModel.results.length; i++) {
					var sWeek, sYear, sHotline;
					sWeek = oTabModel.results[i].CW;
					sYear = oTabModel.results[i].Year;
					sHotline = oTabModel.results[i].HotlineNum;
					var sPath = "DailyAssignmentSet(CW='" + sWeek + "',HotlineNum='" + sHotline + "',Date='" + oTabModel.results[i].Date + "')";
					if (i === 0) {
						sFirst = sWeek;
					}
					if (i === oTabModel.results.length - 1) {
						sLast = sWeek;
					}
					var row = oTabModel.results[i];
					if (row.PrimaryUserName === "") {
						row.PrimaryUser = "";
					}
					if (row.PrimaryUser_DEName === "") {
						row.PrimaryUser_DE = "";
					}
					if (row.PrimaryUser_CAName === "") {
						row.PrimaryUser_CA = "";
					}
					if (row.BackupUserName === "") {
						row.BackupUser = "";
					}
					if (row.BackupUser_DEName === "") {
						row.BackupUser_DE = "";
					}
					if (row.BackupUser_CAName === "") {
						row.BackupUser_CA = "";
					}
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oTabModel.results[i]));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
			} else {
				oTable = this.getView().byId("__table0");
				oTabModel = oTable.getModel("tab").getData();
				batchChanges = [];
				sap.ui.core.BusyIndicator.show();
				for (i = 0; i < oTabModel.results.length; i++) {
					var sWeek, sYear, sHotline;
					sWeek = oTabModel.results[i].CW;
					sYear = oTabModel.results[i].Year;
					sHotline = oTabModel.results[i].HotlineNum;
					var sPath = "AssignmentSet(HotlineNum='" + sHotline + "',CW='" + sWeek + "',Year='" + sYear + "')";
					if (i === 0) {
						sFirst = sWeek;
					}
					if (i === oTabModel.results.length - 1) {
						sLast = sWeek;
					}
					var row = oTabModel.results[i];
					if (row.PrimaryUserName === "") {
						row.PrimaryUser = "";
					}
					if (row.PrimaryUser_DEName === "") {
						row.PrimaryUser_DE = "";
					}
					if (row.BackupUserName === "") {
						row.BackupUser = "";
					}
					if (row.BackupUser_DEName === "") {
						row.BackupUser_DE = "";
					}

					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oTabModel.results[i]));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
			}

			this.oModel.submitBatch(function(data) {
				sap.ui.core.BusyIndicator.hide();

				if (sMessage === "lock") {
					var oEntry = {};
					oEntry.HotlineNum = sHotline;
					oEntry.Cw_from = sFirst;
					oEntry.Cw_to = sLast;
					oEntry.Year = sYear;
					oEntry.Status = "FINALIZED";
					var sUpdPath = "/FinalizeSet('" + sHotline + "')";
					that.oModel.update(sUpdPath, oEntry, {
						success: function() {
							sap.m.MessageBox.information(sMsg);
						}
					});
					that.informMail(sHotline);
				} else {
					sap.m.MessageBox.information(sMsg);
				}
				that.checkState();
				that.refreshAssignments();
			}, function(err) {
				sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.information("Failed to Save. Please Try Again");
			});
		},
		informMail: function(pHotline) {
			var sQtr = this.getView().getModel("head").oData[0].Quarter;
			var sYear = this.getView().getModel("head").oData[0].Year;
			var sBody = "Dear Hotline Super admin,\n\n" +
				"This is to notify you that the hotline assignments for " + pHotline +
				"for the quarter " + sQtr + "/" + sYear +
				"is finalized. Please go ahead and communicate the same to the team.\n" +
				"\nDeadline: Before start of " + sQtr + "/" + sYear +
				"\n\nBest Regards,\nARES Hotline Coordination";

			sap.m.URLHelper.triggerEmail("ashwini.naik@sap.com;martin.wienkoop@sap.com;thom.wiedmann@sap.com",
				"Hotline assignments finalized for the quarter  " + sQtr + "/" + sYear,
				sBody,
				"ashwini.naik@sap.com;martin.wienkoop@sap.com;thom.wiedmann@sap.com"
			);
			// to list, subject, body, cc
		},
		//INDIA Primary  POPUP
		handleValueHelp: function(oEvent) {
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
		_handleValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/PrimaryUser";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text2") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}

				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//INDIA backup pop up
		backupHandleValueHelp: function(oEvent) {
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
		_backupHandleValueHelpSearch: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/BackupUser";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text4") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}
				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Germany PRIMARY pop up
		handleDeValueHelp: function(oEvent) {
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
		_handleValueHelpSearch_DE: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose_DE: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/PrimaryUser_DE";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text3") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}
				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//GERMANY BACKUP POPUP
		backupHandleDeValueHelp: function(oEvent) {
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
		_backupHandleValueHelpSearch_DE: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_backupHandleValueHelpClose_DE: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/BackupUser_DE";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text5") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}
				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//CANADA PRIMARY POPUP
		handleCaValueHelp: function(oEvent) {
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
		_handleValueHelpSearch_CA: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleValueHelpClose_CA: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/PrimaryUser_CA";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text3") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}
				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//CANADA BACKUP POPUP
		backupHandleCaValueHelp: function(oEvent) {
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
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var userInput = sap.ui.getCore().byId(this.inputId);
				var sPath = sap.ui.getCore().byId(this.inputId).mBindingInfos.value.binding.oContext.sPath;
				var sNamePath = sPath + "" + "/BackupUser_CA";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				if (this.inputId.search("__text5") === -1) {
					this.getView().byId("__dailyTable").getModel("daily").setProperty(sNamePath, sUserId);
				} else {
					this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sUserId);
				}
				userInput.setValue(sName);
			}
			evt.getSource().getBinding("items").filter([]);
		},
		saveAndInform: function() {
			this.saveAll("lock");
		},
		checkState: function() {
			var that = this;
			var sQtr = this.getView().getModel("head").oData[0].Quarter;
			var sYear = this.getView().getModel("head").oData[0].Year;
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
			oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, this.sKey);
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
					debugger;
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
				}
			});
		},
		changeColors: function() {
			var oTable = this.getView().byId("__table0");
			var i, row = [],
				sPath, rowData;
			var oTableModel = oTable.getModel("tab");
			var oItems = oTable.getItems();
			for (i = 0; i < oItems.length; i++) {
				row = oItems[i].getCells();
				sPath = oItems[i].getBindingContextPath();
				rowData = oTableModel.getProperty(sPath);
				//india primary
				if (rowData.P1_Color === "P") {
					this.getView().byId(row[3].sId).addStyleClass("pColor");
					this.getView().byId(row[3].sId).removeStyleClass("rColor");
					this.getView().byId(row[3].sId).removeStyleClass("rColor");
				} else if (rowData.P1_Color === "R") {
					this.getView().byId(row[3].sId).addStyleClass("rColor");
					this.getView().byId(row[3].sId).removeStyleClass("pColor");
					this.getView().byId(row[3].sId).removeStyleClass("aColor");
				} else if (rowData.P1_Color === "A") {
					this.getView().byId(row[3].sId).addStyleClass("aColor");
					this.getView().byId(row[3].sId).removeStyleClass("rColor");
					this.getView().byId(row[3].sId).removeStyleClass("pColor");
				} else {
					this.getView().byId(row[3].sId).removeStyleClass("pColor");
					this.getView().byId(row[3].sId).removeStyleClass("rColor");
					this.getView().byId(row[3].sId).removeStyleClass("aColor");
				}
				//germany primary
				if (rowData.P2_Color === "P") {
					this.getView().byId(row[5].sId).addStyleClass("pColor");
					this.getView().byId(row[5].sId).removeStyleClass("rColor");
					this.getView().byId(row[5].sId).removeStyleClass("aColor");
				} else if (rowData.P2_Color === "R") {
					this.getView().byId(row[5].sId).addStyleClass("rColor");
					this.getView().byId(row[5].sId).removeStyleClass("pColor");
					this.getView().byId(row[5].sId).removeStyleClass("aColor");
				} else if (rowData.P2_Color === "A") {
					this.getView().byId(row[5].sId).addStyleClass("aColor");
					this.getView().byId(row[5].sId).removeStyleClass("rColor");
					this.getView().byId(row[5].sId).removeStyleClass("pColor");
				} else {
					this.getView().byId(row[5].sId).removeStyleClass("pColor");
					this.getView().byId(row[5].sId).removeStyleClass("rColor");
					this.getView().byId(row[5].sId).removeStyleClass("aColor");
				}
				//india backup
				if (rowData.B1_Color === "P") {
					this.getView().byId(row[4].sId).addStyleClass("pColor");
					this.getView().byId(row[4].sId).removeStyleClass("aColor");
					this.getView().byId(row[4].sId).removeStyleClass("rColor");
				} else if (rowData.B1_Color === "R") {
					this.getView().byId(row[4].sId).addStyleClass("rColor");
					this.getView().byId(row[4].sId).removeStyleClass("pColor");
					this.getView().byId(row[4].sId).removeStyleClass("aColor");
				} else if (rowData.B1_Color === "A") {
					this.getView().byId(row[4].sId).addStyleClass("aColor");
					this.getView().byId(row[4].sId).removeStyleClass("pColor");
					this.getView().byId(row[4].sId).removeStyleClass("rColor");
				} else {
					this.getView().byId(row[4].sId).removeStyleClass("pColor");
					this.getView().byId(row[4].sId).removeStyleClass("rColor");
					this.getView().byId(row[4].sId).removeStyleClass("aColor");
				}
				//germany backup
				if (rowData.B2_Color === "P") {
					this.getView().byId(row[6].sId).addStyleClass("pColor");
					this.getView().byId(row[6].sId).removeStyleClass("rColor");
					this.getView().byId(row[6].sId).removeStyleClass("aColor");
				} else if (rowData.B2_Color === "R") {
					this.getView().byId(row[6].sId).addStyleClass("rColor");
					this.getView().byId(row[6].sId).removeStyleClass("pColor");
					this.getView().byId(row[6].sId).removeStyleClass("aColor");
				} else if (rowData.B2_Color === "A") {
					this.getView().byId(row[6].sId).addStyleClass("aColor");
					this.getView().byId(row[6].sId).removeStyleClass("pColor");
					this.getView().byId(row[6].sId).removeStyleClass("rColor");
				} else {
					this.getView().byId(row[6].sId).removeStyleClass("pColor");
					this.getView().byId(row[6].sId).removeStyleClass("rColor");
					this.getView().byId(row[6].sId).removeStyleClass("aColor");
				}
			}
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
			var oDeleteBtn = sap.ui.getCore().byId("__deleteComm");
			sap.ui.getCore().setModel(oRowModel, "row");
			this.oModel.read("/CommentSet", {
				filters: aFilters,
				success: function(oData) {
					that.oCommentModel.setData(oData);
					if (pSource === "load") {
						that._commentDialog.open();
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
						info: {
							path: "Timestamp",
							type: 'sap.ui.model.type.Date',
							formatOptions: {
								pattern: 'MMM dd,yyyy',
								source: 'yyyymmdd'
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
		getGroupWeek: function(oGroup) {
			var sTitle = "Calendar Week : " + oGroup.key;
			return new sap.m.GroupHeaderListItem({
				title: sTitle,
				upperCase: false
			});
		},
		deleteComments: function() {
			var oRowPath = sap.ui.getCore().getModel("row").getData();
			var oList = sap.ui.getCore().byId("__commentList");
			var oModel = oList.getModel();
			var oRows = oList.getSelectedItems();
			var sPath, row, oEntry, that = this;
			var batchChanges = [];
			for (var i = 0; i < oRows.length; i++) {
				sPath = oRows[i].getBindingContext().sPath;
				row = oModel.getProperty(sPath);
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
		changeColorsDaily: function() {
			var oTable = this.getView().byId("__dailyTable");
			var i, row = [],
				sPath, rowData;
			var oTableModel = oTable.getModel("daily");
			var oItems = oTable.getItems();
			for (i = 0; i < oItems.length; i++) {
				row = oItems[i].getCells();
				sPath = oItems[i].getBindingContextPath();
				rowData = oTableModel.getProperty(sPath);
				//india primary
				if (rowData.P1_Color === "P") {
					sap.ui.getCore().byId(row[2].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("rColor");
				} else if (rowData.P1_Color === "R") {
					sap.ui.getCore().byId(row[2].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("aColor");
				} else if (rowData.P1_Color === "A") {
					sap.ui.getCore().byId(row[2].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("pColor");
				} else {
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[2].sId).removeStyleClass("aColor");
				}
				//germany primary
				if (rowData.P2_Color === "P") {
					sap.ui.getCore().byId(row[4].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("aColor");
				} else if (rowData.P2_Color === "R") {
					sap.ui.getCore().byId(row[4].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("aColor");
				} else if (rowData.P2_Color === "A") {
					sap.ui.getCore().byId(row[4].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("pColor");
				} else {
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[4].sId).removeStyleClass("aColor");
				}
				//canada primary
				if (rowData.P3_Color === "P") {
					sap.ui.getCore().byId(row[6].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("aColor");
				} else if (rowData.P3_Color === "R") {
					sap.ui.getCore().byId(row[6].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("aColor");
				} else if (rowData.P3_Color === "A") {
					sap.ui.getCore().byId(row[6].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("pColor");
				} else {
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[6].sId).removeStyleClass("aColor");
				}
				//india backup
				if (rowData.B1_Color === "P") {
					sap.ui.getCore().byId(row[3].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("aColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("rColor");
				} else if (rowData.B1_Color === "R") {
					sap.ui.getCore().byId(row[3].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("aColor");
				} else if (rowData.B1_Color === "A") {
					sap.ui.getCore().byId(row[3].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("rColor");
				} else {
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[3].sId).removeStyleClass("aColor");
				}
				//germany backup
				if (rowData.B2_Color === "P") {
					sap.ui.getCore().byId(row[5].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("aColor");
				} else if (rowData.B2_Color === "R") {
					sap.ui.getCore().byId(row[5].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("aColor");
				} else if (rowData.B2_Color === "A") {
					sap.ui.getCore().byId(row[5].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("rColor");
				} else {
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[5].sId).removeStyleClass("aColor");
				}
				//canada backup
				if (rowData.B3_Color === "P") {
					sap.ui.getCore().byId(row[7].sId).addStyleClass("pColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("aColor");
				} else if (rowData.B3_Color === "R") {
					sap.ui.getCore().byId(row[7].sId).addStyleClass("rColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("aColor");
				} else if (rowData.B3_Color === "A") {
					sap.ui.getCore().byId(row[7].sId).addStyleClass("aColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("rColor");
				} else {
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("pColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("rColor");
					sap.ui.getCore().byId(row[7].sId).removeStyleClass("aColor");
				}
			}
		},
		clearInput: function(oControlEvent) {
			var sID = oControlEvent.getSource().getParent().getItems()[0].getId();
			this.getView().byId(sID).setValue("");
		},
		showTentative: function(oControlEvent) {
			if (!this._userList) {
				this._userList = sap.ui.xmlfragment(
					"Hotline.view.Tentative",
					this
				);
				this.getView().addDependent(this._userList);
			}
			var sPath = oControlEvent.getSource().getBindingContext("tab").sPath;
			this._getTentativeUsers(sPath);
		},
		_getTentativeUsers: function(sPath) {
			var that = this;
			this.oUsersModel = new sap.ui.model.json.JSONModel();
			var aFilters = [];
			this.selectedPath = sPath;
			var oTableModel = this.getView().byId("__table0").getModel("tab");
			var aData = oTableModel.getProperty(sPath);
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, aData.HotlineNum);
			aFilters.push(oFilter);
			var cw = aData.CW;
			oFilter = new sap.ui.model.Filter("CalendarWeek", sap.ui.model.FilterOperator.EQ, cw);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, aData.Year);
			aFilters.push(oFilter);
			var oList = sap.ui.getCore().byId("__userLists");
			this.oModel.read("/TentativeSet", {
				filters: aFilters,
				success: function(oData) {
					that.oUsersModel.setData(oData);
					oList.setModel(that.oUsersModel, "users");
					that._userList.open();
				}
			});
		},
		handleSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		handleClose: function(evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var sPath = this.selectedPath;
				var sIdPath = sPath + "" + "/PrimaryUser_DE";
				var sNamePath = sPath + "" + "/PrimaryUser_DEName";
				var sUserId = oSelectedItem.getDescription();
				var sName = oSelectedItem.getTitle();
				this.getView().byId("__table0").getModel("tab").setProperty(sNamePath, sName);
				this.getView().byId("__table0").getModel("tab").setProperty(sIdPath, sUserId);
			}
			evt.getSource().getBinding("items").filter([]);
		}
	});
});