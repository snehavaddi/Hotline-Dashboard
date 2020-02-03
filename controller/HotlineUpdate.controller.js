sap.ui.define(["Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	return BaseController.extend("Hotline.controller.HotlineUpdate", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("update").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/"; //change before upload
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			this.setTableModel();
			this.setPairModel();
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
		},
		setTableModel: function() {
			var oTableModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/HotlinesSet", null, null, false, function(oData) {
				oTableModel.setData(oData);
			});
			this.getView().byId("maintTable").setModel(oTableModel, "tab");
			sap.ui.getCore().setModel(oTableModel, "hl");
			this._getUsers();
		},
		setPairModel: function() {
			var oPairModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/PairSet", null, null, false, function(oData) {
				oPairModel.setData(oData);
			});
			this.getView().byId("__pairTable").setModel(oPairModel, "pair");
		},
		onPairPress: function(oEvent) {
			if (!this._oDialogPair) {
				this._oDialogPair = sap.ui.xmlfragment("Hotline.view.EditPair", this);
			}

			sap.ui.getCore().byId("pUpdate").setVisible(true);
			sap.ui.getCore().byId("pDelete").setVisible(true);
			sap.ui.getCore().byId("pSave").setVisible(false);

			var oSelectedItem = oEvent.getParameters("listitem");
			var seqNo = oSelectedItem.listItem.getBindingContext("pair").getProperty("Seqno");
			var hKey = oSelectedItem.listItem.getBindingContext("pair").getProperty("HotlineNum");
			// var sQtr = oSelectedItem.listItem.getBindingContext("pair").getProperty("Quarter");
			// var sYear = oSelectedItem.listItem.getBindingContext("pair").getProperty("Year");

			var p1 = oSelectedItem.listItem.getBindingContext("pair").getProperty("Person1");
			var p2 = oSelectedItem.listItem.getBindingContext("pair").getProperty("Person2");
			var p1Name = oSelectedItem.listItem.getBindingContext("pair").getProperty("P1Name");
			var p2Name = oSelectedItem.listItem.getBindingContext("pair").getProperty("P2Name");

			//set Data from table to dialog
			sap.ui.getCore().byId("__hName").setSelectedKey(hKey);
			// sap.ui.getCore().byId("__hQtr").setSelectedKey(sQtr);
			// sap.ui.getCore().byId("__hYearPair").setValue(sYear);
			sap.ui.getCore().byId("__p1Name").setValue(p1Name);
			sap.ui.getCore().byId("__p1ID").setValue(p1);
			sap.ui.getCore().byId("__p2Name").setValue(p2Name);
			sap.ui.getCore().byId("__p2ID").setValue(p2);
			sap.ui.getCore().byId("__seqno").setValue(seqNo);

			this._oDialogPair.open();
		},
		onAddPairs: function() {
			if (!this._oDialogPair) {
				this._oDialogPair = sap.ui.xmlfragment("Hotline.view.EditPair", this);
			}
			this._oDialogPair.open();
			//hide other buttons
			sap.ui.getCore().byId("pUpdate").setVisible(false);
			sap.ui.getCore().byId("pDelete").setVisible(false);
			sap.ui.getCore().byId("pSave").setVisible(true);

			// sap.ui.getCore().byId("__hQtr").setSelectedKey("");
			// sap.ui.getCore().byId("__hYearPair").setValue("");
			sap.ui.getCore().byId("__p1Name").setValue("");
			sap.ui.getCore().byId("__p1ID").setValue("");
			sap.ui.getCore().byId("__p2Name").setValue("");
			sap.ui.getCore().byId("__p2ID").setValue("");
			sap.ui.getCore().byId("__seqno").setValue("");
		},
		createPair: function() {
			var hKey = sap.ui.getCore().byId("__hName").getSelectedKey();
			var p1 = sap.ui.getCore().byId("__p1ID").getValue();
			var p2 = sap.ui.getCore().byId("__p2ID").getValue();
			// var qtr = sap.ui.getCore().byId("__hQtr").getSelectedKey();
			// var year = sap.ui.getCore().byId("__hYearPair").getValue();
			var batchChanges = [];
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var oEntry = {};
			oEntry = {
				Seqno: '',
				HotlineNum: hKey,
				Person1: p1,
				Person2: p2
					// ,Quarter: qtr,
					// Year: year
			};
			// var sPath = "PairSet(HotlineNum='" + hKey + "',Person1='" + p1 + "',Person2='" + p2 + "')";
			batchChanges.push(this.oModel.createBatchOperation("PairSet", "POST", oEntry));
			this.oModel.addBatchChangeOperations(batchChanges);
			this.oModel.submitBatch(function() {
				sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.information("Saved Successfully");
				that.setPairModel();
				that.closeDialogPair();
			});
		},
		updatePair: function() {
			var hKey = sap.ui.getCore().byId("__hName").getSelectedKey();
			var p1 = sap.ui.getCore().byId("__p1ID").getValue();
			var p2 = sap.ui.getCore().byId("__p2ID").getValue();
			var seqNo = sap.ui.getCore().byId("__seqno").getValue();
			// var qtr = sap.ui.getCore().byId("__hQtr").getSelectedKey();
			// var year = sap.ui.getCore().byId("__hYearPair").getValue();
			seqNo = seqNo.trim();
			var batchChanges = [];
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var oEntry = {};
			oEntry = {
				Seqno: seqNo,
				HotlineNum: hKey,
				Person1: p1,
				Person2: p2
					// ,Quarter: qtr,
					// Year: year
			};
			var sPath = "PairSet(HotlineNum='" + hKey + "',Seqno='" + seqNo + "')";
			batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
			this.oModel.addBatchChangeOperations(batchChanges);
			this.oModel.submitBatch(function() {
				sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.information("Changed Successfully");
				that.setPairModel();
				that.closeDialogPair();
			});

		},
		deletePair: function() {
			var hKey = sap.ui.getCore().byId("__hName").getSelectedKey();
			var p1 = sap.ui.getCore().byId("__p1ID").getValue();
			var p2 = sap.ui.getCore().byId("__p2ID").getValue();
			var seqNo = sap.ui.getCore().byId("__seqno").getValue();
			// var qtr = sap.ui.getCore().byId("__hQtr").getSelectedKey();
			// var year = sap.ui.getCore().byId("__hYearPair").getValue();
			var batchChanges = [];
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var oEntry = {};
			seqNo = parseInt(seqNo);
			oEntry = {
				Seqno: seqNo,
				HotlineNum: hKey,
				Person1: p1,
				Person2: p2
					// ,Quarter: qtr,
					// Year: year
			};
			var sPath = "PairSet(HotlineNum='" + hKey + "',Seqno='" + seqNo + "')";
			batchChanges.push(this.oModel.createBatchOperation(sPath, "DELETE", oEntry));
			this.oModel.addBatchChangeOperations(batchChanges);
			this.oModel.submitBatch(function() {
				sap.ui.core.BusyIndicator.hide();
				sap.m.MessageBox.information("Deleted Successfully");
				that.setPairModel();
				that.closeDialogPair();
			});

		},
		closeDialogPair: function() {
			this._oDialogPair.destroy();
			this._oDialogPair = undefined;
		},
		handleValuePair: function(oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._valueGermany) {
				this._valueGermany = sap.ui.xmlfragment(
					"Hotline.view.DE_Dialog",
					this
				);
				this.getView().addDependent(this._valueGermany);
			}
			// create a filter for the binding
			this._valueGermany.getBinding("items").filter([new sap.ui.model.Filter(
				"UserId",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			// open value help dialog filtered by the input value
			this._valueGermany.open(sInputValue);
		},
		handleValueHelp_DE: function(oEvent) {
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
				"UserId",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			// open value help dialog filtered by the input value
			this._valueHelpDialog_DE.open(sInputValue);
		},
		_handleValueHelpClose_DE: function(evt) {
			if (this.inputId === "__p1Name" || this.inputId === "__p2Name") {
				var oSelectedItem = evt.getParameter("selectedItem");
				if (oSelectedItem) {
					var userInput = sap.ui.getCore().byId(this.inputId);
					var sUserId = oSelectedItem.getDescription();
					var sUserName = oSelectedItem.getTitle();
					userInput.setValue(sUserName);
					if (this.inputId === "__p1Name") {
						sap.ui.getCore().byId("__p1ID").setValue(sUserId);
					} else if (this.inputId === "__p2Name") {
						sap.ui.getCore().byId("__p2ID").setValue(sUserId);
					} else if (this.inputId === "__i05_de") {
						userInput.setValue(sUserId);
					}
				}
			} else {
				var oSelectedItems = evt.getParameter("selectedItems");
				if (this._oDialog !== undefined) {
					var aData = this._oDialog.getModel("DE").getData();
					var aTempData = [],
						sHl, sRegion;
					if (oSelectedItems !== undefined) {
						for (var i = 0; i < oSelectedItems.length; i++) {
							if (aData.results.length === 0) {
								sHl = "";
								sRegion = "";
							} else {
								sHl = aData.results[0].HotlineNum;
								sRegion = aData.results[0].Region;
							}
							aTempData = {
								"HotlineNum": sHl,
								"Region": sRegion,
								"Name": oSelectedItems[i].getTitle(),
								"AdminUname": oSelectedItems[i].getDescription()
							};
							aData.results.push(aTempData);
							this._oDialog.getModel("DE").setData(aData);
						}
					}
				}
			}
			evt.getSource().getBinding("items").filter([]);
		},
		_handleValueHelpSearch_DE: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_getUsers: function() {
			var aFilters = [],
				that = this;
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, "ALL");
			aFilters.push(oFilter);
			this.oUserModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
					that.oUserModel.setData(oData);
				}
			});
			this.getView().setModel(this.oUserModel, "user");
			aFilters = [];
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, "ALL_DE");
			aFilters.push(oFilter);
			this.oGerModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
					that.oGerModel.setData(oData);
				}
			});
			this.getView().setModel(this.oGerModel, "ger");
			aFilters = [];
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, "ALL_CA");
			aFilters.push(oFilter);
			this.oCanModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
					that.oCanModel.setData(oData);
				}
			});
			this.getView().setModel(this.oCanModel, "can");
		},
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
				"UserId",
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
			var oSelectedItems = evt.getParameter("selectedItems");
			if (this._oDialog !== undefined) {
				var aData = this._oDialog.getModel("IN").getData();
				var aTempData = [],
					sHl, sRegion;
				if (oSelectedItems !== undefined) {
					for (var i = 0; i < oSelectedItems.length; i++) {
						if (aData.results.length === 0) {
							sHl = "";
							sRegion = "";
						} else {
							sHl = aData.results[0].HotlineNum;
							sRegion = aData.results[0].Region;
						}
						aTempData = {
							"HotlineNum": sHl,
							"Region": sRegion,
							"Name": oSelectedItems[i].getTitle(),
							"AdminUname": oSelectedItems[i].getDescription()
						};
						aData.results.push(aTempData);
						this._oDialog.getModel("IN").setData(aData);
					}
					evt.getSource().getBinding("items").filter([]);
				}
			}
		},
		_bindAdmin: function(pHotline, pRegion) {
			var oAdminModel = new sap.ui.model.json.JSONModel();
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, pHotline);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, pRegion);
			aFilters.push(oFilter);
			this.oModel.read("/ListOfAdminSet", {
				filters: aFilters,
				success: function(oData) {
					oAdminModel.setData(oData);
				}
			});
			this._oDialog.setModel(oAdminModel, pRegion);
		},
		handleInValueHelp: function(oEvent) {
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"Hotline.view.Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
				this._valueHelpDialog.setMultiSelect(true);
			}
			this._valueHelpDialog.open("");
		},
		handleDeValueHelp: function() {
			if (!this._valueHelpDialogGermany) {
				this._valueHelpDialogGermany = sap.ui.xmlfragment(
					"Hotline.view.DE_Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialogGermany);
				this._valueHelpDialogGermany.setMultiSelect(true);
			}
			this._valueHelpDialogGermany.open("");
		},
		onItemPress: function(oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Hotline.view.HotlineMain", this);
			}
			this.getView().addDependent(this._oDialog);
			var sPath = oEvent.getParameters("listitem").listItem.getBindingContext("tab").getPath();
			var aData = oEvent.getSource().getModel("tab").getProperty(sPath);

			aData.Edit = true;
			aData.Add = false;

			this._bindAdmin(aData.HotlineNum, "IN");
			this._bindAdmin(aData.HotlineNum, "DE");
			this._bindAdmin(aData.HotlineNum, "CA");
			var oRowModel = new sap.ui.model.json.JSONModel(aData);
			this._oDialog.setModel(oRowModel, "row");

			this._oDialog.open();
		},
		closeDialog: function() {
			this._oDialog.destroy();
			this._oDialog = undefined;
		},
		onPressAdd: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Hotline.view.HotlineMain", this);
			}

			var oEntry = {
				Edit: false,
				Add: true,
				HotlineNum: "AOOO",
				UserEdit: false,
				AdminUnameDe: "",
				UserGroupDlCa: "ca",
				UserGroupDl: "in",
				HotlineTxt: "text",
				Priority: "0",
				Frequency: "4",
				UserGroupDl_DE: "de",
			};
			this._bindAdmin("", "IN");
			this._bindAdmin("", "DE");
			this._bindAdmin("", "CA");
			this._oDialog.setModel(new sap.ui.model.json.JSONModel(oEntry), "row");
			this._oDialog.open();
		},
		refreshModel: function() {
			this.setTableModel();
		},
		_validateHotlineFields: function(aData) {
			//main information
			if (aData.HotlineNum.length <= 0) {
				return false;
			}
			if (aData.HotlineTxt.length <= 0) {
				return false;
			}
			return true;
		},
		_validateDls: function(aData) {
			var iSum = 0;
			if (aData.UserGroupDl.length > 0) {
				iSum = iSum + 1;
			}
			if (aData.UserGroupDl_DE.length > 0) {
				iSum = iSum + 1;
			}
			if (aData.UserGroupDlCa.length > 0) {
				iSum = iSum + 1;
			}
			if (iSum === 0) {
				return false;
			}
			return true;
		},
		createEntry: function() {
			//first validate the fields
			var that = this;
			var oModel = this._oDialog.getModel("row");
			var aData = oModel.getData();
			var bMainResult = this._validateHotlineFields(aData);
			var bDlResult = this._validateDls(aData);
			sap.ui.getCore().byId("_msg1").setVisible(false);
			sap.ui.getCore().byId("_msg2").setVisible(false);
			if (!bDlResult) {
				sap.ui.getCore().byId("_msg2").setVisible(true);
			}
			if (!bMainResult) {
				sap.ui.getCore().byId("_msg1").setVisible(true);
			}

			if (bMainResult && bDlResult) {
				var sPriority = "1";
				var bPriority = sap.ui.getCore().byId("prioSwitch").getState();
				if (bPriority) {
					sPriority = "0";
				}
				var bEdit = sap.ui.getCore().byId("editSwitch").getState();
				var oEntry = {
					AdminUname: "",
					HotlineNum: aData.HotlineNum,
					UserEdit: bEdit,
					AdminUnameDe: aData.AdminUnameDe,
					UserGroupDlCa: aData.UserGroupDlCa,
					UserGroupDl: aData.UserGroupDl,
					HotlineTxt: aData.HotlineTxt,
					Priority: sPriority,
					Frequency: aData.Frequency,
					UserGroupDl_DE: aData.UserGroupDl_DE
				};
				sap.ui.core.BusyIndicator.show();
				this.oModel.create("/HotlinesSet", oEntry, {
					success: function() {
						sap.ui.core.BusyIndicator.hide();
						that.setTableModel();
						that.insertAdmins(oEntry.HotlineNum);
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			}
		},
		deleteHotlines: function() {
			var that = this;
			var dialog = new sap.m.Dialog({
				title: 'Confirm',
				type: 'Message',
				content: new sap.m.Text({
					text: 'Are you sure you want to delete this hotline?'
				}),
				beginButton: new sap.m.Button({
					text: 'Yes',
					press: function() {
						var aData = that._oDialog.getModel("row").getData();
						sap.ui.core.BusyIndicator.show();
						var sPath = "HotlinesSet('" + aData.HotlineNum + "')";
						that.oModel.remove(sPath, {
							success: function() {
								sap.ui.core.BusyIndicator.hide();
								that.setTableModel();
								that.closeDialog();
							},
							error: function() {
								sap.ui.core.BusyIndicator.hide();
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: 'Cancel',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();

		},
		updateEntry: function() {
			var that = this;
			var aData = this._oDialog.getModel("row").getData();
			var bMainResult = this._validateHotlineFields(aData);
			var bDlResult = this._validateDls(aData);
			sap.ui.getCore().byId("_msg1").setVisible(false);
			sap.ui.getCore().byId("_msg2").setVisible(false);
			if (!bDlResult) {
				sap.ui.getCore().byId("_msg2").setVisible(true);
			}
			if (!bMainResult) {
				sap.ui.getCore().byId("_msg1").setVisible(true);
			}

			if (bMainResult && bDlResult) {
				var sPriority = "1";
				var bPriority = sap.ui.getCore().byId("prioSwitch").getState();
				if (bPriority) {
					sPriority = "0";
				}
				var bEdit = sap.ui.getCore().byId("editSwitch").getState();
				var oEntry = {
					AdminUname: "",
					HotlineNum: aData.HotlineNum,
					UserEdit: bEdit,
					AdminUnameDe: aData.AdminUnameDe,
					UserGroupDlCa: aData.UserGroupDlCa,
					UserGroupDl: aData.UserGroupDl,
					HotlineTxt: aData.HotlineTxt,
					Priority: sPriority,
					Frequency: aData.Frequency,
					UserGroupDl_DE: aData.UserGroupDl_DE
				};
				sap.ui.core.BusyIndicator.show();
				var sPath = "HotlinesSet('" + aData.HotlineNum + "')";
				this.oModel.update(sPath, oEntry, {
					success: function() {
						sap.ui.core.BusyIndicator.hide();
						that.setTableModel();
						that.updateAdminList(oEntry.HotlineNum);
					},
					error: function() {
						sap.ui.core.BusyIndicator.hide();
					}
				});
			}

			// var sNum = sap.ui.getCore().byId("__i00").getValue();
			// var sTxt = sap.ui.getCore().byId("__i01").getValue();
			// var sPriority = "0",
			// 	sFreq = "0";
			// if (sap.ui.getCore().byId("__rb1").getSelected()) {
			// 	sPriority = "1";
			// }
			// if (sap.ui.getCore().byId("__rb3").getSelected()) {
			// 	sFreq = "3";
			// } else if (sap.ui.getCore().byId("__rb5").getSelected()) {
			// 	sFreq = "4";
			// } else if (sap.ui.getCore().byId("__rb6").getSelected()) {
			// 	sFreq = "5";
			// }
			// var sDl = sap.ui.getCore().byId("__i04").getValue();
			// // var sAdmin = sap.ui.getCore().byId("__i05").getValue();
			// var sDl_de = sap.ui.getCore().byId("__i04_de").getValue();
			// var sDl_ca = sap.ui.getCore().byId("__i04_ca").getValue();
			// // var sAdmin_de = sap.ui.getCore().byId("__i05_de").getValue();
			// var validationState = 0;
			// if (sNum === "") {
			// 	sap.ui.getCore().byId("__i00").setValueState("Error");
			// } else {
			// 	sap.ui.getCore().byId("__i00").setValueState("None");
			// 	validationState = validationState + 1;
			// }
			// if (sTxt === "") {
			// 	sap.ui.getCore().byId("__i01").setValueState("Error");
			// } else {
			// 	sap.ui.getCore().byId("__i01").setValueState("None");
			// 	validationState = validationState + 1;
			// }
			// if (sDl === "") {
			// 	sap.ui.getCore().byId("__i04").setValueState("Error");
			// } else {
			// 	sap.ui.getCore().byId("__i04").setValueState("None");
			// 	validationState = validationState + 1;
			// }
			// // if (sAdmin === "") {
			// // 	sap.ui.getCore().byId("__i05").setValueState("Error");
			// // } else {
			// // 	sap.ui.getCore().byId("__i05").setValueState("None");
			// // 	validationState = validationState + 1;
			// // }
			// // if (sDl_de === "") {
			// // 	sap.ui.getCore().byId("__i04_de").setValueState("Error");
			// // } else {
			// // 	sap.ui.getCore().byId("__i04_de").setValueState("None");
			// // 	validationState = validationState + 1;
			// // }
			// // if (sAdmin_de === "") {
			// // 	sap.ui.getCore().byId("__i05_de").setValueState("Error");
			// // } else {
			// // 	sap.ui.getCore().byId("__i05_de").setValueState("None");
			// // 	validationState = validationState + 1;
			// // }
			// if (validationState === 3) {
			// 	//proceed ahead
			// 	var oEntry = {};
			// 	oEntry.HotlineNum = sNum.toUpperCase();
			// 	oEntry.HotlineTxt = sTxt;
			// 	oEntry.Priority = sPriority;
			// 	oEntry.Frequency = sFreq;
			// 	oEntry.UserGroupDl = sDl;
			// 	// oEntry.AdminUname = sAdmin;
			// 	oEntry.UserGroupDl_DE = sDl_de;
			// 	oEntry.UserGroupDlCa = sDl_ca;
			// 	// oEntry.Admin_DE = sAdmin_de;
			// 	sap.ui.core.BusyIndicator.show();
			// 	var that = this;
			// 	OData.request({
			// 			requestUri: "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/HotlinesSet",
			// 			method: "GET",
			// 			headers: {
			// 				"X-Requested-With": "XMLHttpRequest",
			// 				"Content-Type": "application/atom+xml",
			// 				"DataServiceVersion": "2.0",
			// 				"X-CSRF-Token": "Fetch"
			// 			}
			// 		},
			// 		function(data, response) {
			// 			var header_xcsrf_token = response.headers['x-csrf-token'];
			// 			var oHeaders = {
			// 				"x-csrf-token": header_xcsrf_token,
			// 				'Accept': 'application/json',
			// 			};
			// 			OData.request({
			// 					requestUri: "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/HotlinesSet('" + oEntry.HotlineNum +
			// 						"')",
			// 					method: "PUT",
			// 					headers: oHeaders,
			// 					data: oEntry
			// 				},
			// 				function(data, request) {
			// 					sap.ui.core.BusyIndicator.hide();
			// 					//show success message
			// 					that.setTableModel();
			// 					that.updateAdminList(oEntry.HotlineNum);
			// 				},
			// 				function(err) {
			// 					sap.ui.core.BusyIndicator.hide();
			// 					//Show error
			// 				});
			// 		},
			// 		function(err) {
			// 			var request = err.request;
			// 			var response = err.response;
			// 			sap.ui.core.BusyIndicator.hide();
			// 			//show error message
			// 		});
			// }
		},
		showAdmin: function(oControlEvent) {
			if (!this._oDialogAdmin) {
				this._oDialogAdmin = sap.ui.xmlfragment("Hotline.view.AdminList", this);
			}
			this._oDialogAdmin.open();
			this.oAdminModel = new sap.ui.model.json.JSONModel();
			sap.ui.getCore().setModel(this.oAdminModel, "admin");
			var sPath = oControlEvent.getSource().getBindingContext("tab").getPath();
			var sHotline = this.getView().byId("maintTable").getModel("tab").getProperty(sPath).HotlineNum;
			this._getAdmins(sHotline);
		},
		_getAdmins: function(pHotline) {
			var that = this;
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, pHotline);
			aFilters.push(oFilter);
			this.oModel.read("ListOfAdminSet", {
				filters: aFilters,
				success: function(oData) {
					that.oAdminModel.setData(oData);
				},
				error: function(oData) {
					sap.m.MessageBox.error("Error In Fetching List of Admins");
				}
			});
		},
		closeAdminDialog: function() {
			this._oDialogAdmin.close();
		},
		getGroupHeader: function(oGroup) {
			var sTitle = "";
			if (oGroup.key === "IN") {
				sTitle = "India";
			} else if (oGroup.key === "DE") {
				sTitle = "Germany";
			} else if (oGroup.key === "CA") {
				sTitle = "Canada";
			}
			return new sap.m.GroupHeaderListItem({
				title: sTitle,
				upperCase: false
			});
		},
		hideBusyIndicator: function() {
			sap.ui.core.BusyIndicator.hide();
		},
		showBusyIndicator: function(iDuration, iDelay) {
			sap.ui.core.BusyIndicator.show(iDelay);

			if (iDuration && iDuration > 0) {
				if (this._sTimeoutId) {
					jQuery.sap.clearDelayedCall(this._sTimeoutId);
					this._sTimeoutId = null;
				}

				this._sTimeoutId = jQuery.sap.delayedCall(iDuration, this, function() {
					this.hideBusyIndicator();
				});
			}
		},
		insertAdmins: function(pHotline) {
			//get tokens from India Admins
			//get tokens from Germany Admins
			var that = this;
			var aInA = sap.ui.getCore().byId("multiinput1").getTokens();
			var aDeA = sap.ui.getCore().byId("multiinput2").getTokens();
			var aCaA = sap.ui.getCore().byId("multiinput3").getTokens();
			var i;
			var oEntry = {};
			var batchChanges = [];
			if (aDeA.length + aInA.length + aCaA.length > 0) {
				sap.ui.core.BusyIndicator.show();
				for (i = 0; i < aInA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "IN";
					oEntry.AdminUname = aInA[i].getKey();
					oEntry.Name = "";
					batchChanges.push(this.oModel.createBatchOperation("/ListOfAdminSet", "POST", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
				for (i = 0; i < aDeA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "DE";
					oEntry.AdminUname = aDeA[i].getKey();
					oEntry.Name = "";
					batchChanges.push(this.oModel.createBatchOperation("/ListOfAdminSet", "POST", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
				for (i = 0; i < aCaA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "CA";
					oEntry.AdminUname = aCaA[i].getKey();
					oEntry.Name = "";
					batchChanges.push(this.oModel.createBatchOperation("/ListOfAdminSet", "POST", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}

				//create batch
				this.oModel.submitBatch(function() {
					sap.ui.core.BusyIndicator.hide();
					that.closeDialog();
				});
			} else {
				that.closeDialog();
			}
		},
		updateAdminList: function(pHotline) {
			var that = this;
			var aInA = sap.ui.getCore().byId("multiinput1").getTokens();
			var aDeA = sap.ui.getCore().byId("multiinput2").getTokens();
			var aCaA = sap.ui.getCore().byId("multiinput3").getTokens();
			var i, sPath;
			var oEntry = {};
			var batchChanges = [];
			if (aDeA.length + aInA.length + aCaA.length > 0) {
				sap.ui.core.BusyIndicator.show();
				//first delete all
				oEntry = {};
				oEntry.HotlineNum = pHotline;
				oEntry.Region = "";
				oEntry.AdminUname = "";
				oEntry.Name = "";
				sPath = "/ListOfAdminSet(HotlineNum='" + pHotline + "',Region='" + oEntry.Region + "',AdminUname='" + oEntry.AdminUname + "')";
				batchChanges.push(this.oModel.createBatchOperation(sPath, "DELETE", oEntry));
				this.oModel.addBatchChangeOperations(batchChanges);

				for (i = 0; i < aInA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "IN";
					oEntry.AdminUname = aInA[i].getKey();
					oEntry.Name = "";
					sPath = "/ListOfAdminSet(HotlineNum='" + pHotline + "',Region='" + oEntry.Region + "',AdminUname='" + oEntry.AdminUname + "')";
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
				for (i = 0; i < aDeA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "DE";
					oEntry.AdminUname = aDeA[i].getKey();
					oEntry.Name = "";
					sPath = "/ListOfAdminSet(HotlineNum='" + pHotline + "',Region='" + oEntry.Region + "',AdminUname='" + oEntry.AdminUname + "')";
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}
				for (i = 0; i < aCaA.length; i++) {
					oEntry = {};
					oEntry.HotlineNum = pHotline;
					oEntry.Region = "CA";
					oEntry.AdminUname = aCaA[i].getKey();
					oEntry.Name = "";
					sPath = "/ListOfAdminSet(HotlineNum='" + pHotline + "',Region='" + oEntry.Region + "',AdminUname='" + oEntry.AdminUname + "')";
					batchChanges.push(this.oModel.createBatchOperation(sPath, "PUT", oEntry));
					this.oModel.addBatchChangeOperations(batchChanges);
				}

				//create batch
				this.oModel.submitBatch(function() {
					sap.ui.core.BusyIndicator.hide();
					that.closeDialog();
				});
			} else {
				that.closeDialog();
			}
		},
		handleCaValueHelp: function() {
			if (!this._valueHelpDialogCanada) {
				this._valueHelpDialogCanada = sap.ui.xmlfragment(
					"Hotline.view.CA_Dialog",
					this
				);
				this.getView().addDependent(this._valueHelpDialogCanada);
				this._valueHelpDialogCanada.setMultiSelect(true);
			}
			this._valueHelpDialogCanada.open("");
		},
		_handleValueHelpClose_CA: function(evt) {
			var oSelectedItems = evt.getParameter("selectedItems");
			if (this._oDialog !== undefined) {
				var aData = this._oDialog.getModel("CA").getData();
				var aTempData = [],
					sHl, sRegion;
				if (oSelectedItems !== undefined) {
					for (var i = 0; i < oSelectedItems.length; i++) {
						if (aData.results.length === 0) {
							sHl = "";
							sRegion = "";
						} else {
							sHl = aData.results[0].HotlineNum;
							sRegion = aData.results[0].Region;
						}
						aTempData = {
							"HotlineNum": sHl,
							"Region": sRegion,
							"Name": oSelectedItems[i].getTitle(),
							"AdminUname": oSelectedItems[i].getDescription()
						};
						aData.results.push(aTempData);
						this._oDialog.getModel("CA").setData(aData);
					}
				}
				evt.getSource().getBinding("items").filter([]);
			}
		},
		_handleValueHelpSearch_CA: function(evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		}
	});
});