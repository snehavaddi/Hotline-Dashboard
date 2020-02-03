sap.ui.define([
	"Hotline/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"Hotline/model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageBox");
	return BaseController.extend("Hotline.controller.HFC", {
		formatter: formatter,
		onInit: function () {
			this._mViewSettingsDialogs = {};
			var d = new Date();
			var mm = d.getMonth() + 1;
			mm = ("00" + mm).slice(-2);
			var yy = d.getFullYear();
			var oHfcModel = new JSONModel({
				month: mm,
				year: yy
			});
			this.getView().setModel(oHfcModel, "hfc");
			this.mGroupFunctions = {
				GroupName: function (oContext) {
					var name = oContext.getProperty("GroupName");
					return {
						key: name,
						text: name
					};
				},
				FromDate: function (oContext) {
					var name = oContext.getProperty("FromDate");
					var value = name.substr(0, 4) + '-' + name.substr(4, 2) + '-' + name.substr(6, 2);
					var v = new Date(value);
					var v = v.toUTCString();
					var header = v.slice(4, 16);
					return {
						key: header,
						text: header
					};
				}
			};
		},
		onAfterRendering: function () {
			this._loadInitialData();
		},
		_loadInitialData: function () {
			this.getMasterData();
			this.getHfcData();
		},
		removeInUser: function (oEvent) {
			var oRow = oEvent.getSource().getBindingContext("IN").getObject();
			this._removeUser(oRow, "IN");
		},
		removeDeUser: function (oEvent) {
			var oRow = oEvent.getSource().getBindingContext("DE").getObject();
			this._removeUser(oRow, "DE");
		},
		removeCaUser: function (oEvent) {
			var oRow = oEvent.getSource().getBindingContext("CA").getObject();
			this._removeUser(oRow, "CA");
		},
		_removeUser: function (oRow, sCountry) {
			var oModel = this._hfcDialog.getModel(sCountry);
			var aData = oModel.getData().results;
			for (var x in aData) {
				if (aData[x].Uname === oRow.Uname) {
					aData.splice(x, 1);
				}
			}
			oModel.setData({
				results: aData
			});
			oModel.refresh(true);
		},
		clearPrimaryAsgn: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("hfcAssg");
			var sPath = oContext.getPath();
			var oRow = oContext.getObject();
			oRow.Primary = "";
			oRow.Primaryname = "";
			this._hfcAsgnDialog.getModel("hfcAssg").setProperty(sPath, oRow);
		},
		clearBackup: function (oEvent) {
			var oContext = oEvent.getSource().getBindingContext("hfcAssg");
			var sPath = oContext.getPath();
			var oRow = oContext.getObject();
			var sVal;
			switch (oRow.Region) {
			case "IN":
				sVal = "_1";
				break;
			case "DE":
				sVal = "_2";
				break;
			case "CA":
				sVal = "_3";
				break;
			}
			oRow["Backup" + sVal] = "";
			oRow["Backupname" + sVal] = "";
			this._hfcAsgnDialog.getModel("hfcAssg").setProperty(sPath, oRow);
		},
		getMasterData: function () {
			var oDataModel = this.getOwnerComponent().getModel("odata");
			var oMasterModel = new JSONModel();
			oDataModel.read("/HfcMasterSet('')", {
				success: function (oData) {
					oMasterModel.setData(oData);
				},
				error: function () {

				}
			});
			this.getView().setModel(oMasterModel, "master");
		},
		onPressAddNewTask: function () {
			if (!this._hfcTaskDialog) {
				this._hfcTaskDialog = sap.ui.xmlfragment("Hotline.fragment.HfcTask", this);
				this.getView().addDependent(this._hfcTaskDialog);
				this._getAllUsers("HFC");
			}
			var oModel = new JSONModel(this._initializeTask());
			this._hfcTaskDialog.setModel(oModel, "task");
			this._hfcTaskDialog.open();
		},
		closeTaskDialog: function () {
			this._hfcTaskDialog.close();
		},
		_initializeTask: function () {
			var oEntry = {
				Title: "Add New Task",
				ButtonText: "Save",
				ProductName: "MANUAL",
				ProdVersIntern: "TASK",
				Spslevel: "00",
				FromDate: "",
				ToDate: "",
				TaskName: "",
				InPrimary: "",
				InBackup: "",
				DePrimary: "",
				DeBackup: "",
				CaPrimary: "",
				CaBackup: "",
				InPrimaryname: "",
				InBackupname: "",
				DePrimaryname: "",
				DeBackupname: "",
				CaPrimaryname: "",
				CaBackupname: "",
				Month: "",
				Year: ""
			};
			return oEntry;
		},
		onItemPress: function (oEvent) {
			var oRow = oEvent.getSource().getBindingContext("hfcTask").getObject();
			if (!this._hfcTaskDialog) {
				this._hfcTaskDialog = sap.ui.xmlfragment("Hotline.fragment.HfcTask", this);
				this.getView().addDependent(this._hfcTaskDialog);
				this._getAllUsers("HFC");
			}
			oRow.Title = "Modify Entry";
			oRow.ButtonText = "Update";
			var oModel = new JSONModel(oRow);
			this._hfcTaskDialog.setModel(oModel, "task");
			this._hfcTaskDialog.open();
		},
		_validateNewTask: function (aData) {
			var iCheck = 0;
			if (aData.FromDate > aData.ToDate || aData.FromDate === "" || aData.ToDate === "") {
				iCheck = iCheck + 1;
				aData.FromDateValueState = "Error";
				aData.FromDateValueStateText = "To Date should be after or on same day";
			} else {
				aData.FromDateValueState = "None";
			}

			if (aData.TaskName.length === 0) {
				iCheck = iCheck + 1;
				aData.TaskNameValueState = "Error";
				aData.TaskNameValueStateText = "Task Name cannot be empty";
			} else {
				aData.TaskNameValueState = "None";
			}

			if (aData.InPrimary === aData.InBackup && aData.InPrimary.length != 0) {
				iCheck = iCheck + 1;
				aData.InPrimaryState = "Error";
				aData.InPrimaryText = "Primary and backup cannot be same";
			} else {
				aData.InPrimaryState = "None";
			}

			if (aData.DePrimary === aData.DeBackup && aData.DePrimary.length != 0) {
				iCheck = iCheck + 1;
				aData.DePrimaryState = "Error";
				aData.DePrimaryText = "Primary and backup cannot be same";
			} else {
				aData.DePrimaryState = "None";
			}
			if (aData.CaPrimary === aData.CaBackup && aData.CaPrimary.length != 0) {
				iCheck = iCheck + 1;
				aData.CaPrimaryState = "Error";
				aData.CaPrimaryText = "Primary and backup cannot be same";
			} else {
				aData.CaPrimaryState = "None";
			}

			this._hfcTaskDialog.getModel("task").setData(aData);
			this._hfcTaskDialog.getModel("task").refresh(true);
			return iCheck;
		},
		deleteTask: function () {
			var that = this;
			// HfcHotlinerSet(ProductName='MANUAL',ProdVersIntern='TASK',Spslevel='00',FromDate='20190424',ToDate='20190424',TaskName='Recheck')
			var aData = this._hfcTaskDialog.getModel("task").getData();
			var sPath = "/HfcHotlinerSet(ProductName='MANUAL',ProdVersIntern='TASK',Spslevel='00',FromDate='" + aData.FromDate + "',ToDate='" +
				aData.ToDate + "',TaskName='" + aData.TaskName + "')";
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.remove(sPath, {
				success: function () {
					sap.m.MessageToast.show("Task Deleted");
					that.getHfcData();
					that.closeTaskDialog();
				},
				error: function () {
					sap.m.MessageToast.show("Deletion Failed");
				}
			});
		},
		addNewTask: function () {
			var aData = this._hfcTaskDialog.getModel("task").getData();
			var iValidate = this._validateNewTask(aData);
			if (iValidate === 0) {
				var that = this;
				var sPrimary = aData.Primary;
				try {
					if (aData.Primary === undefined) {
						sPrimary = aData.Primary_A;
					}
				} catch (e) {

				}
				var oEntry = {
					ProductName: aData.ProductName,
					ProdVersIntern: aData.ProdVersIntern,
					Spslevel: aData.Spslevel,
					FromDate: aData.FromDate,
					ToDate: aData.ToDate,
					TaskName: aData.TaskName,
					Primary_A: sPrimary,
					InBackup: aData.InBackup,
					DeBackup: aData.DeBackup,
					CaBackup: aData.CaBackup,
					Primaryname: aData.Primaryname,
					InBackupname: aData.InBackupname,
					DeBackupname: aData.DeBackupname,
					CaBackupname: aData.CaBackupname,
					Month: "",
					Year: ""
				}
				var oDataModel = this.getOwnerComponent().getModel("odata");
				oDataModel.create("/HfcHotlinerSet", oEntry, {
					success: function () {
						sap.m.MessageToast.show("Task Updated");
						//	that.getHfcData();
						that.closeTaskDialog();
					},
					error: function () {
						sap.m.MessageToast.show("Task Update Failed, please try again");
					}
				});
			}
		},
		getHfcData: function () {
			var aData = this.getView().getModel("hfc").getData();
			var aFilters = [];
			var that = this;
			var oModel = new JSONModel();
			var oFilter = new sap.ui.model.Filter("Month", sap.ui.model.FilterOperator.EQ, aData.month);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aData.year);
			aFilters.push(oFilter);
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.read("/HfcHotlinerSet", {
				filters: aFilters,
				success: function (oData) {
					that._getUniqueProducts(oData.results);
					oModel.setData(oData);
				}
			});
			this.getView().setModel(oModel, "hfcTask");
			this.byId("hfcTaskTablevsdFilterBar").setVisible(false);
		},
		_getUniqueProducts: function (aData) {
			var aUniqueGroups = [...new Set(aData.map(item => item.GroupName))];
			var aUniq = [];
			for (var x in aUniqueGroups) {
				var oEntry = {
					GroupName: aUniqueGroups[x]
				}
				aUniq.push(oEntry);
			}
			var oProductModel = new JSONModel(aUniq);
			this.getView().setModel(oProductModel, "prods");
		},

		handleFilterButtonPressed: function (oEvent) {
			this.sId = oEvent.getSource().getParent().getParent().getId();
			this.createViewSettingsDialog("Hotline.fragment.Filter").open();
		},
		handleSortButtonPressed: function (oEvent) {
			this.sId = oEvent.getSource().getParent().getParent().getId();
			this.createViewSettingsDialog("Hotline.fragment.Sort").open();
		},
		handleGroupButtonPressed: function (oEvent) {
			this.sId = oEvent.getSource().getParent().getParent().getId();
			this.createViewSettingsDialog("Hotline.fragment.Group").open();
		},
		createViewSettingsDialog: function (sDialogFragmentName) {
			var oDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment(sDialogFragmentName, this);
				this._mViewSettingsDialogs[sDialogFragmentName] = oDialog;
				this.getView().addDependent(oDialog);
			}
			return oDialog;
		},
		_getId: function () {
			var sId = "";
			if (this.sId.includes("hfcTaskTable")) {
				sId = "hfcTaskTable"
			} else if (this.sId.includes("hfcAssgnTable")) {
				sId = "hfcAssgnTable"
			} else if (this.sId.includes("hfcPrefTable")) {
				sId = "hfcPrefTable"
			}
			return sId;
		},
		handleFilterDialogConfirm: function (oEvent) {
			var sId = this._getId();
			var oTable = this.byId(sId);
			if (oTable === undefined) {
				oTable = sap.ui.getCore().byId(sId);
			}
			var mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				aFilters = [];

			mParams.filterItems.forEach(function (oItem) {
				var oFilter = new sap.ui.model.Filter("GroupName", "EQ", oItem.getKey());
				aFilters.push(oFilter);
			});

			// apply filter settings
			oBinding.filter(aFilters);

			// update filter bar
			var oFilterBar = this.byId(sId + "vsdFilterBar");
			var oFilterLabel = this.byId(sId + "vsdFilterLabel");
			if (oFilterBar === undefined) {
				oFilterBar = sap.ui.getCore().byId(sId + "vsdFilterBar");
			}
			if (oFilterLabel === undefined) {
				oFilterLabel = sap.ui.getCore().byId(sId + "vsdFilterLabel");
			}

			oFilterBar.setVisible(aFilters.length > 0);
			oFilterLabel.setText(mParams.filterString);
		},
		handleSortDialogConfirm: function (oEvent) {
			var sId = this._getId();
			var oTable = this.byId(sId);
			if (oTable === undefined) {
				oTable = sap.ui.getCore().byId(sId);
			}
			var mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},
		handleGroupDialogConfirm: function (oEvent) {
			var sId = this._getId();
			var oTable = this.byId(sId);
			if (oTable === undefined) {
				oTable = sap.ui.getCore().byId(sId);
			}
			var mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				vGroup,
				aGroups = [];

			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				vGroup = this.mGroupFunctions[sPath];
				aGroups.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
				// apply the selected group settings
				oBinding.sort(aGroups);
			} else {
				aGroups[0] = {
					bDescending: mParams.groupDescending,
					fnCompare: undefined,
					sPath: "FromDate",
					vGroup: undefined
				};
				oBinding.sort(aGroups);
			}
		},
		savehfcAssg: function () {
			var batchChanges = [];
			var that = this;
			var oModel = this.getOwnerComponent().getModel("odata");
			sap.ui.core.BusyIndicator.show();

			var aData = this._hfcAsgnDialog.getModel("hfcAssg").getData().results;
			for (var x in aData) {
				var sPath = "HfcAsgnSet(ProductName='',ProdVersIntern='',Spslevel='',FromDate='',ToDate='',TaskName='')";
				batchChanges.push(oModel.createBatchOperation(sPath, "PUT", aData[x]));
				oModel.addBatchChangeOperations(batchChanges);
			}
			oModel.submitBatch(function () {
				sap.ui.core.BusyIndicator.hide();
				that._loadInitialData();
				sap.m.MessageToast.show("Saved Successfully");
				that.closehfcAssg();
			}, function () {
				sap.m.MessageToast.show("Assignment List Save Failed");
				sap.ui.core.BusyIndicator.hide();
			});
		},
		closeUserList: function () {},
		closehfcAssg: function () {
			this._hfcAsgnDialog.close();
		},
		openHfcAssign: function () {
			if (!this._hfcAsgnDialog) {
				var sCountry = this.getOwnerComponent().getModel("country").getData().country;
				this._hfcAsgnDialog = sap.ui.xmlfragment("Hotline.fragment.HfcAssign", this);
				this.getView().addDependent(this._hfcAsgnDialog);
				this._getAssigneeList(sCountry);
				this._getAllUsers("HFC");
			}
			var oModel = this.getOwnerComponent().getModel("odata");
			var oHfcAsgnModel = new JSONModel();
			var oHfcSchModel = new JSONModel();
			sap.ui.core.BusyIndicator.show();
			oModel.read("/HfcSchSet('')", {
				success: function (oData) {
					oHfcSchModel.setData(oData);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.m.MessageBox.error("Backend Call Failed, Please try again");
					sap.ui.core.BusyIndicator.hide();
				}
			});
			var that = this;
			sap.ui.core.BusyIndicator.show();
			oModel.read("/HfcAsgnSet", {
				success: function (oData) {
					that._getUniqueProducts(oData.results);
					var aData = oHfcSchModel.getData();
					oData.Year = aData.CYear;
					oData.SelMonth = aData.CMonth;
					oHfcAsgnModel.setData(oData);
					that._hfcAsgnDialog.open();
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.m.MessageToast.show("")
					sap.ui.core.BusyIndicator.hide();
				}
			});
			this._hfcAsgnDialog.setModel(oHfcAsgnModel, "hfcAssg");

		},
		getHfcAssignment: function () {
			var aFilters = [];
			var oModel = this._hfcAsgnDialog.getModel("hfcAssg");
			var aData = oModel.getData();
			var oFilter = new sap.ui.model.Filter("Month", sap.ui.model.FilterOperator.EQ, aData.SelMonth);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Year", sap.ui.model.FilterOperator.EQ, aData.Year);
			aFilters.push(oFilter);
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.read("/HfcAsgnSet", {
				filters: aFilters,
				success: function (oData) {
					oData.SelMonth = aData.SelMonth;
					oData.Year = aData.Year;
					oModel.setData(oData);
				}
			});
			oModel.refresh(true);
			sap.ui.getCore().byId("hfcAssgnTablevsdFilterBar").setVisible(false);
		},
		openPrefDialog: function () {
			var that = this;
			if (!this._hfcPrefDialog) {
				this._hfcPrefDialog = sap.ui.xmlfragment("Hotline.fragment.HfcPreference", this);
				this.getView().addDependent(this._hfcPrefDialog);
			}
			sap.ui.core.BusyIndicator.show();
			var oModel = this.getOwnerComponent().getModel("odata");
			oModel.read("/HfcPrefSet", {
				success: function (oData) {
					that._getUniqueProducts(oData.results);
					that._processData(oData.results);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function () {
					sap.m.MessageToast.show("Backend called failed");
					sap.ui.core.BusyIndicator.hide();
				}
			});
			this._hfcPrefDialog.open();
			sap.ui.getCore().byId("hfcPrefTablevsdFilterBar").setVisible(false);

		},
		_getAssigneeList: function (pCountry) {
			var aFilters = [],
				that = this;
			var sId = "HFC_" + pCountry;
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sId);
			aFilters.push(oFilter);
			this.oUserModel = new JSONModel();
			var oModel = this.getOwnerComponent().getModel("odata");
			oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oUserModel.setData(oData);
					that.getView().setModel(that.oUserModel, "userAssign");
				},
				async: false
			});

		},
		_initializeUserList: function () {
			if (!this._oUserList) {
				this._oUserList = sap.ui.xmlfragment(
					"Hotline.fragment.UserList",
					this
				);
				this.getView().addDependent(this._oUserList);
			}
		},
		onPrimaryHelp: function (oEvent) {
			this._initializeUserList();
			this.sPath = oEvent.getSource().getBindingContext("hfcAssg").getPath();
			this.sType = "P";
			this._oUserList.open();
		},
		onBackupHelp: function (oEvent) {
			this._initializeUserList();
			this.sPath = oEvent.getSource().getBindingContext("hfcAssg").getPath();
			this.sType = "B";
			this._oUserList.open();
		},
		_handleUserSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleUserConfirm: function (evt) {
			var oSelectedItems = evt.getParameter("selectedItems");
			var oModel = this._hfcAsgnDialog.getModel("hfcAssg");
			var oRow = oModel.getProperty(this.sPath);
			var sBackup, sPath;
			switch (oRow.Region) {
			case "IN":
				sBackup = oRow.Backup_1;
				sPath = "_1";
				break;
			case "DE":
				sBackup = oRow.Backup_2;
				sPath = "_2";
				break;
			case "CA":
				sBackup = oRow.Backup_3;
				sPath = "_3";
				break;
			}
			if (this.sType === "P") {
				if (sBackup !== oSelectedItems[0].getDescription()) {
					oRow.Primary = oSelectedItems[0].getDescription();
					oRow.Primaryname = oSelectedItems[0].getTitle();
				} else {
					sap.m.MessageToast.show("Oops!! Primary and Backup cannot be same");
				}

			} else {
				if (oRow.Primary !== oSelectedItems[0].getDescription()) {
					oRow["Backup" + sPath] = oSelectedItems[0].getDescription();
					oRow["Backupname" + sPath] = oSelectedItems[0].getTitle();
				} else {
					sap.m.MessageToast.show("Oops!! Primary and Backup cannot be same");
				}
			}
			oModel.setProperty(this.sPath, oRow);
			oModel.refresh(true);
		},
		_processData: function (aData) {
			var oHfcModel = new JSONModel();
			var aHfcData = {};
			aHfcData.results = [];
			var oEntry = {};
			for (var x in aData) {
				oEntry = {
					B_Name: aData[x].B_Name,
					B_Selected: aData[x].B_Selected,
					B_Uname: aData[x].B_Uname,
					FromDate: aData[x].FromDate,
					Month: aData[x].Month,
					Name: aData[x].Name,
					ProdVersIntern: aData[x].ProdVersIntern,
					ProductName: aData[x].ProductName,
					Region: aData[x].Region,
					Selected: aData[x].Selected,
					Spslevel: aData[x].Spslevel,
					TaskName: aData[x].TaskName,
					ToDate: aData[x].ToDate,
					Uname: aData[x].Uname,
					Year: aData[x].Year,
					GroupName: aData[x].GroupName,
					pState: false,
					bState: false,
					pEnable: true,
					bEnable: true
				};
				switch (oEntry.B_Selected) {
				case 'Y':
					oEntry.bEnable = false;
					oEntry.bState = true;
					break;
				case 'S':
					oEntry.bEnable = true;
					oEntry.bState = true;
					break;
				case 'N':
					oEntry.bEnable = true;
					oEntry.bState = false;
					break;
				}
				switch (oEntry.Selected) {
				case 'Y':
					oEntry.pEnable = false;
					oEntry.pState = true;
					break;
				case 'S':
					oEntry.pEnable = true;
					oEntry.pState = true;
					break;
				case 'N':
					oEntry.pEnable = true;
					oEntry.pState = false;
					break;
				}
				aHfcData.results.push(oEntry);
			}
			oHfcModel.setData(aHfcData);
			this._hfcPrefDialog.setModel(oHfcModel, "hfcPref");

		},
		closeHfcPref: function () {
			this._hfcPrefDialog.close();
		},
		saveHfcPref: function () {
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var oEntry = {};
			var batchChanges = [];
			var oModel = this.getOwnerComponent().getModel("odata");
			var aData = this._hfcPrefDialog.getModel("hfcPref").getData().results;
			var sPath = "/HfcPrefSet(ProductName='',ProdVersIntern='',Spslevel='',FromDate='',ToDate='')";
			for (var x in aData) {
				oEntry = {
					B_Name: aData[x].B_Name,
					B_Selected: aData[x].B_Selected,
					B_Uname: aData[x].B_Uname,
					FromDate: aData[x].FromDate,
					Month: aData[x].Month,
					Name: aData[x].Name,
					ProdVersIntern: aData[x].ProdVersIntern,
					ProductName: aData[x].ProductName,
					Region: aData[x].Region,
					Selected: aData[x].Selected,
					Spslevel: aData[x].Spslevel,
					TaskName: aData[x].TaskName,
					ToDate: aData[x].ToDate,
					Uname: aData[x].Uname,
					Year: aData[x].Year
				};
				if (aData[x].Selected === "S" && aData[x].pState === false) {
					oEntry.Name = "D";
					batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
					oModel.addBatchChangeOperations(batchChanges);
				}
				if (aData[x].Selected === "N" && aData[x].pState === true) {
					oEntry.Name = "A";
					batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
					oModel.addBatchChangeOperations(batchChanges);
				}

				if (aData[x].B_Selected === "S" && aData[x].bState === false) {
					oEntry.B_Name = "D";
					batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
					oModel.addBatchChangeOperations(batchChanges);
				}
				if (aData[x].B_Selected === "N" && aData[x].bState === true) {
					oEntry.B_Name = "A";
					batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
					oModel.addBatchChangeOperations(batchChanges);
				}
			}
			oModel.submitBatch(function () {
				sap.ui.core.BusyIndicator.hide();
				that.closeHfcPref();
			}, function () {
				sap.m.MessageToast.show("Preference Update Failed");
				sap.ui.core.BusyIndicator.hide();
			});
		},
		validateHotline: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("hfcPref").getPath();
			var oModel = this._hfcPrefDialog.getModel("hfcPref");
			var oRow = oModel.getProperty(sPath);
			if (oRow.Selected === "Y") {
				return;
			}
			if (oRow.B_Selected === "Y") {
				return;
			}
			if (oRow.Selected === "S" && oRow.pState) {
				if (oRow.bState) {
					sap.m.MessageToast.show("Oops!! You cannot select Both");
					oRow.bState = false;
				}
			}
			if (oRow.B_Selected === "S" && oRow.bState) {
				if (oRow.pState) {
					sap.m.MessageToast.show("Oops!! You cannot select Both");
					oRow.pState = false;
				}
			}
			if (oRow.Selected === "N" && oRow.pState) {
				if (oRow.bState) {
					sap.m.MessageToast.show("Oops!! You cannot select Both");
					oRow.bState = false;
				}
			}
			if (oRow.B_Selected === "N" && oRow.bState) {
				if (oRow.pState) {
					sap.m.MessageToast.show("Cant Select Both");
					oRow.pState = false;
				}
			}
			oModel.setProperty(sPath, oRow);
			oModel.refresh(true);
		},
		openHfcScheduler: function () {
			if (!this._hfcSchDialog) {
				this._hfcSchDialog = sap.ui.xmlfragment("Hotline.fragment.HfcSchedules", this);
				this.getView().addDependent(this._hfcSchDialog);
			}
			var oHfcSchModel = new JSONModel();
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.read("/HfcSchSet('')", {
				success: function (oData) {
					oHfcSchModel.setData(oData);
				}
			});
			this.getView().setModel(oHfcSchModel, "hfcS");
			this._hfcSchDialog.setModel(oHfcSchModel, "hfcSch");
			this._hfcSchDialog.open();
		},
		updateHfcSchedules: function () {
			var that = this;
			var aData = this._hfcSchDialog.getModel("hfcSch").getData();
			aData.Hotline = "HFC";
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.update("/HfcSchSet('HFC')", aData, {
				success: function () {
					that._loadInitialData();
					sap.m.MessageBox.success("Update Successfull");
					that.closeHfcSch();
				},
				error: function () {
					sap.m.MessageBox.error("Update Failed, Please try again");
				}
			});
		},
		closeHfcSch: function () {
			this._hfcSchDialog.close();
		},
		updateMasterData: function () {
			if (!this._hfcDialog) {
				this._hfcDialog = sap.ui.xmlfragment("Hotline.fragment.HFCMaster", this);
				this.getView().addDependent(this._hfcDialog);
				this._getAllUsers();
			}
			var oModel = this.getOwnerComponent().getModel("odata");
			var oHfcModel = new JSONModel();
			oModel.read("/HfcSet('')", {
				success: function (oData) {
					oHfcModel.setData(oData);
				},
				async: false
			});
			this._bindAdmin("", "IN");
			this._bindAdmin("", "DE");
			this._bindAdmin("", "CA");
			this._hfcDialog.setModel(oHfcModel, "hfcData");
			this._hfcDialog.open();
		},
		_bindAdmin: function (pHotline, pRegion) {
			var oAdminModel = new JSONModel();
			var oModel = this.getOwnerComponent().getModel("odata");
			var oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, pRegion);
			oModel.read("/HfcAdminSet", {
				filters: [oFilter],
				success: function (oData) {
					oAdminModel.setData(oData);
				}
			});
			this._hfcDialog.setModel(oAdminModel, pRegion);
		},
		closeHfcDialog: function () {
			this._hfcDialog.close();
		},
		updateHfc: function () {
			var that = this;
			var oModel = this._hfcDialog.getModel("hfcData");
			var aData = oModel.getData();
			var sPath = "/HfcSet('" + aData.Id + "')";
			var oDataModel = this.getOwnerComponent().getModel("odata");
			oDataModel.update(sPath, aData, {
				success: function (oData) {
					that.closeHfcDialog();
					that.updateHfcAdmins("HFC");
				},
				error: function () {
					sap.m.MessageBox.error("Update Failed, Please try again later");
				}
			});
		},
		updateHfcAdmins: function (pHotline) {
			var oModel = this.getOwnerComponent().getModel("odata");
			var that = this;
			var aInA = this._hfcDialog.getModel("IN").getData().results;
			var aDeA = this._hfcDialog.getModel("DE").getData().results;
			var aCaA = this._hfcDialog.getModel("CA").getData().results;
			var i, sPath;
			var oEntry = {};
			var batchChanges = [];
			if (aDeA.length + aInA.length + aCaA.length > 0) {
				sap.ui.core.BusyIndicator.show();
				//first delete all
				oEntry = {
					Id: pHotline,
					Uname: "ALL",
					Name: "ALL",
					Region: ""
				};
				sPath = "/HfcAdminSet('HFC')";
				batchChanges.push(oModel.createBatchOperation(sPath, "DELETE", oEntry));
				oModel.addBatchChangeOperations(batchChanges);

				for (i = 0; i < aInA.length; i++) {
					if (aInA[i].Uname.length > 0 && aInA[i].Name.length > 0) {
						oEntry = {
							Id: pHotline,
							Uname: aInA[i].Uname,
							Name: aInA[i].Name,
							Region: "IN"
						};
						sPath = "/HfcAdminSet('HFC')";
						batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
						oModel.addBatchChangeOperations(batchChanges);
					}
				}
				for (i = 0; i < aDeA.length; i++) {
					if (aDeA[i].Uname.length > 0 && aDeA[i].Name.length > 0) {
						oEntry = {
							Id: pHotline,
							Uname: aDeA[i].Uname,
							Name: aDeA[i].Name,
							Region: "DE"
						};
						sPath = "/HfcAdminSet('HFC')";
						batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
						oModel.addBatchChangeOperations(batchChanges);
					}
				}
				for (i = 0; i < aCaA.length; i++) {
					if (aCaA[i].Uname.length > 0 && aCaA[i].Name.length > 0) {
						oEntry = {
							Id: pHotline,
							Uname: aCaA[i].Uname,
							Name: aCaA[i].Name,
							Region: "CA"
						};
						sPath = "/HfcAdminSet('HFC')";
						batchChanges.push(oModel.createBatchOperation(sPath, "PUT", oEntry));
						oModel.addBatchChangeOperations(batchChanges);
					}
				}

				//create batch
				oModel.submitBatch(function () {
					sap.ui.core.BusyIndicator.hide();
					that.closeHfcDialog();
				}, function () {
					sap.m.MessageToast.show("Admin List Update Failed");
					sap.ui.core.BusyIndicator.hide();
				});
			} else {
				that.closeHfcDialog();
			}

		},
		_getAllUsers: function (pType) {
			var aFilters = [],
				that = this;
			var sDlIn, sDlDe, sDlCa;
			if (pType === "HFC") {
				sDlIn = "HFC_IN";
				sDlDe = "HFC_DE";
				sDlCa = "HFC_CA";
			} else {
				sDlIn = "ALL";
				sDlDe = "ALL_DE";
				sDlCa = "ALL_CA";
			}
			var aUserList = new Array();
			aUserList.results = new Array();
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sDlIn);
			aFilters.push(oFilter);
			this.oUserModel = new JSONModel();
			var oModel = this.getOwnerComponent().getModel("odata");
			oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oUserModel.setData(oData);
					aUserList.results = aUserList.results.concat(oData.results);
				}
			});
			this.getView().setModel(this.oUserModel, "inUser");
			aFilters = [];
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sDlDe);
			aFilters.push(oFilter);
			this.oGerModel = new JSONModel();
			oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oGerModel.setData(oData);
					aUserList.results = aUserList.results.concat(oData.results);
				}
			});
			this.getView().setModel(this.oGerModel, "deUser");
			aFilters = [];
			oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, sDlCa);
			aFilters.push(oFilter);
			this.oCanModel = new JSONModel();
			this.oAllUsers = new JSONModel();
			oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function (oData) {
					that.oCanModel.setData(oData);
					aUserList.results = aUserList.results.concat(oData.results);
					that.oAllUsers.setData(aUserList);
				}
			});
			this.getView().setModel(this.oCanModel, "caUser");
			this.getView().setModel(this.oAllUsers, "allUser");
		},
		openAllUserListAssign: function (oEvent) {
			this.sIdIn = oEvent.getSource().getId();
			this.openBy = "ASGN";
			//	this._openAllUserList();
			this._oAllUserList = sap.ui.xmlfragment(
				"Hotline.fragment.AllUser",
				this
			);
			this.getView().addDependent(this._oAllUserList);
			this._oAllUserList.open("");
		},
		openAllUserList: function (oEvent) {
			this.sIdIn = oEvent.getSource().getId();
			this.openBy = "TASK";
			//	this._openAllUserList();
			this._oAllUserList = sap.ui.xmlfragment(
				"Hotline.fragment.AllUser",
				this
			);
			this.getView().addDependent(this._oAllUserList);
			this._oAllUserList.open("");
		},
		_openAllUserList: function () {
			if (!this._oAllUserList) {
				this._oAllUserList = sap.ui.xmlfragment(
					"Hotline.fragment.AllUser",
					this
				);
				this.getView().addDependent(this._oAllUserList);
			}
			this._oAllUserList.open("");
		},
		_handleAllUserSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleAllUserConfirm: function (evt) {
			var aItem = evt.getParameter("selectedItems")[0];
			if (evt.getId() !== "cancel") {
				if (this.openBy === "TASK") {
					var oModel = this._hfcTaskDialog.getModel("task");
					var aData = oModel.getData();
					aData.Primary = aItem.getDescription();
					aData.Primaryname = aItem.getTitle();
					oModel.setData(aData);
					oModel.refresh(true);
				} else {
					oModel = this._hfcAsgnDialog.getModel("hfcAssg");
					var sPath = sap.ui.getCore().byId(this.sIdIn).getBindingContext("hfcAssg").getPath();
					var aAssignData = oModel.getProperty(sPath);
					aAssignData.Primary = aItem.getDescription();
					aAssignData.Primaryname = aItem.getTitle();
					oModel.setProperty(sPath, aAssignData);
					oModel.refresh(true);
				}

			}
			evt.getSource().getBinding("items").filter([]);
		},
		openIndiaUserList: function (oEvent) {
			this.sIdIn = oEvent.getSource().getId();
			if (!this._oIndiaUserList) {
				this._oIndiaUserList = sap.ui.xmlfragment(
					"Hotline.fragment.Dialog",
					this
				);
				this.getView().addDependent(this._oIndiaUserList);
				if (this.sIdIn === "inToken") {
					this._oIndiaUserList.setMultiSelect(true);
				} else {
					this._oIndiaUserList.setMultiSelect(false);
				}
			}
			this._oIndiaUserList.open("");
		},
		openGermanyUserList: function (oEvent) {
			this.sIdDe = oEvent.getSource().getId();
			if (!this._oGermanyUserList) {
				this._oGermanyUserList = sap.ui.xmlfragment(
					"Hotline.fragment.DE_Dialog",
					this
				);
				this.getView().addDependent(this._oGermanyUserList);
				if (this.sIdIn === "deToken") {
					this._oGermanyUserList.setMultiSelect(true);
				} else {
					this._oGermanyUserList.setMultiSelect(false);
				}
			}
			this._oGermanyUserList.open("");
		},
		openCanadaUserList: function (oEvent) {
			this.sIdCa = oEvent.getSource().getId();
			if (!this._oCanadaUserList) {
				this._oCanadaUserList = sap.ui.xmlfragment(
					"Hotline.fragment.CA_Dialog",
					this
				);
				this.getView().addDependent(this._oCanadaUserList);
				if (this.sIdIn === "caToken") {
					this._oCanadaUserList.setMultiSelect(true);
				} else {
					this._oCanadaUserList.setMultiSelect(false);
				}
			}
			this._oCanadaUserList.open("");
		},
		_handleIndiaSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleIndiaConfirm: function (evt) {
			if (this.sIdIn === "inToken") {
				var oSelectedItems = evt.getParameter("selectedItems");
				if (this._hfcDialog !== undefined) {
					this._updateAdminModel("IN", oSelectedItems);
				}
			} else {
				if (evt.getId() !== "cancel") {
					var oModel = this._hfcTaskDialog.getModel("task");
					var aData = oModel.getData();
					var aItem = evt.getParameter("selectedItems")[0];
					if (this.sIdIn === "taskIn1") {
						aData.InPrimary = aItem.getDescription();
						aData.InPrimaryname = aItem.getTitle();
					} else {
						aData.InBackup = aItem.getDescription();
						aData.InBackupname = aItem.getTitle();
					}
					oModel.setData(aData);
					oModel.refresh();
				}
			}
			evt.getSource().getBinding("items").filter([]);
		},
		_handleGermanySearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleGermanyConfirm: function (evt) {
			if (this.sIdDe === "deToken") {
				var oSelectedItems = evt.getParameter("selectedItems");
				if (this._hfcDialog !== undefined) {
					this._updateAdminModel("DE", oSelectedItems);
				}
			} else {
				if (evt.getId() !== "cancel") {
					var oModel = this._hfcTaskDialog.getModel("task");
					var aData = oModel.getData();
					var aItem = evt.getParameter("selectedItems")[0];
					if (this.sIdDe === "taskDe1") {
						aData.DePrimary = aItem.getDescription();
						aData.DePrimaryname = aItem.getTitle();
					} else {
						aData.DeBackup = aItem.getDescription();
						aData.DeBackupname = aItem.getTitle();
					}
					oModel.setData(aData);
					oModel.refresh();
				}
			}
		},
		_updateAdminModel: function (pRegion, aSelectedItem) {
			var aData = this._hfcDialog.getModel(pRegion).getData();
			var aTempData = [];
			if (aSelectedItem !== undefined) {
				for (var i = 0; i < aSelectedItem.length; i++) {
					var iUserExist = 0;
					aTempData = {
						"Id": "HFC",
						"Region": pRegion,
						"Name": aSelectedItem[i].getTitle(),
						"Uname": aSelectedItem[i].getDescription()
					};
					for (var x in aData.results) {
						if (aData.results[x].Uname === aSelectedItem[i].getDescription()) {
							sap.m.MessageToast.show("User already added");
							iUserExist += 1;
						}
					}
					if (iUserExist === 0) {
						aData.results.push(aTempData);
					}
				}
				this._hfcDialog.getModel(pRegion).setData(aData);
			}
		},
		_handleCanadaSearch: function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new sap.ui.model.Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_handleCanadaConfirm: function (evt) {
			if (this.sIdCa === "caToken") {
				var oSelectedItems = evt.getParameter("selectedItems");
				if (this._hfcDialog !== undefined) {
					this._updateAdminModel("CA", oSelectedItems);
				}
			} else {
				if (evt.getId() !== "cancel") {
					var oModel = this._hfcTaskDialog.getModel("task");
					var aData = oModel.getData();
					var aItem = evt.getParameter("selectedItems")[0];
					if (this.sIdCa === "taskCa1") {
						aData.CaPrimary = aItem.getDescription();
						aData.CaPrimaryname = aItem.getTitle();
					} else {
						aData.CaBackup = aItem.getDescription();
						aData.CaBackupname = aItem.getTitle();
					}
					oModel.setData(aData);
					oModel.refresh();
				}
			}
		},
		getGroupNameHeader: function (oGroup) {
			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
		},
		clearPrimary: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.Primary = "";
			aData.Primaryname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},
		clearDePrimary: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.DePrimary = "";
			aData.DePrimaryname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},
		clearCaPrimary: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.CaPrimary = "";
			aData.CaPrimaryname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},
		clearInBackup: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.InBackup = "";
			aData.InBackupname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},
		clearDeBackup: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.DeBackup = "";
			aData.DeBackupname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},
		clearCaBackup: function (oEvent) {
			var oModel = this._hfcTaskDialog.getModel("task");
			var aData = oModel.getData();
			aData.CaBackup = "";
			aData.CaBackupname = "";
			oModel.setData(aData);
			oModel.refresh(true);
		},

	});

});