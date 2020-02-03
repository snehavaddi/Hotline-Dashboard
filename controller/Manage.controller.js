sap.ui.define([
	"Hotline/controller/BaseController",
	"Hotline/model/formatter"
], function(BaseController, formatter) {
	"use strict";

	return BaseController.extend("Hotline.controller.Manage", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("manage").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function(oEvent) {
			var sHotline = oEvent.getParameter("arguments").hotline;
			var d = new Date();
			var sYear = d.getFullYear().toString();
			var serviceUrl = "/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/"; //change before upload
			this.oModel = new sap.ui.model.odata.ODataModel(serviceUrl);
			var oBtnModel = new sap.ui.model.json.JSONModel({
				editHeader: false,
				target: 0
			});
			this.getView().setModel(oBtnModel, "btn");
			this._getHeader(sHotline, sYear, "DE");
			this._getItems(sHotline, sYear, "DE");
			this._initializeUserModel();
			this._getAllUsers();
		},
		_getAllUsers: function() {
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("UserId", sap.ui.model.FilterOperator.EQ, "ALL_DE");
			aFilters.push(oFilter);
			var oGerModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/UserValueSet", {
				filters: aFilters,
				success: function(oData) {
					oGerModel.setData(oData);
				}
			});
			this.getView().setModel(oGerModel, "ger");
		},
		_initializeUserModel: function() {
			var oUserModel = new sap.ui.model.json.JSONModel({
				fullname: '',
				uname: '',
				hotline: '',
				year: '',
				region: 'DE',
				fte: '',
				edit: false
			});
			this.getView().setModel(oUserModel, "manageUser");
		},
		onPressAdd: function() {
			if (!this._manageDialog) {
				this._manageDialog = sap.ui.xmlfragment("Hotline.view.ManagerUser", this);
			}
			var aData = [];
			aData = this._setManageDialogData("A", []);
			var oUserModel = new sap.ui.model.json.JSONModel();
			oUserModel.setData(aData);
			this.getView().setModel(oUserModel, "info");
			this.getView().addDependent(this._manageDialog);
			this._manageDialog.open();

		},
		onItemPress: function(oEvent) {
			if (!this._manageDialog) {
				this._manageDialog = sap.ui.xmlfragment("Hotline.view.ManagerUser", this);
			}
			var oUserData = oEvent.getParameters("listitem").listItem.getBindingContext("user");

			var oUserModel = new sap.ui.model.json.JSONModel();
			var aData = this._setManageDialogData("E", oUserData);
			oUserModel.setData(aData);
			this.getView().setModel(oUserModel, "info");
			this.getView().addDependent(this._manageDialog);
			this._manageDialog.open();
		},
		_setManageDialogData: function(sType, aUserData) {
			var oUserModel = this.getView().getModel("manageUser");
			var aData = oUserModel.getData();
			var aHeadData = this.getView().getModel("head").getData();
			if (sType === "A") {
				aData.edit = false;
				aData.fte = '0.0090';
				aData.fullname = '';
				aData.uname = '';
			} else {
				aData.edit = true;
				aData.fte = aUserData.getProperty("Fte");
				aData.fullname = aUserData.getProperty("FullName").trim();
				aData.uname = aUserData.getProperty("Uname");
			}
			aData.region = 'DE';
			aData.hotline = aHeadData.HotlineNum;
			aData.year = aHeadData.CalYear;
			return aData;
		},
		refreshUser: function() {
			var aData = this.getView().getModel("head").getData();
			this._getHeader(aData.HotlineNum, aData.CalYear, "DE");
			this._getItems(aData.HotlineNum, aData.CalYear, "DE");
		},
		_getHeader: function(sHotline, sYear, sRegion) {
			var oHeadModel = new sap.ui.model.json.JSONModel();
			var sPath = "/ManageDaysSet(HotlineNum='" + sHotline + "',CalYear='" + sYear + "',Region='" + sRegion + "')";
			sap.ui.core.BusyIndicator.show();
			this.oModel.read(sPath, {
				success: function(oData) {
					if (oData.HotlineNum.length !== 0) {
						oHeadModel.setData(oData);

					} else {
						sap.m.MessageToast.show("There is no target maintained for the selected Year");
					}
					sap.ui.core.BusyIndicator.hide();
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});
			this.getView().setModel(oHeadModel, "head");
		},
		calculateTarget: function() {
			var that = this;
			var sRegion = 'DE';
			var aData = this.getView().getModel("head").getData();
			var sHotline = aData.HotlineNum;
			var sYear = aData.CalYear;
			that._calculateUpdate(sHotline, sYear, sRegion);
		},
		_calculateUpdate: function(sHotline, sYear, sRegion) {
			var that = this;
			var sPath = "/ListOfUserSet(HotlineNum='" + sHotline + "',Region='" + sRegion + "',CalYear='" + sYear + "',Uname='')";
			this.oModel.read(sPath, {
				success: function() {
					that._getItems(sHotline, sYear, sRegion);
				}
			});
		},
		_getItems: function(sHotline, sYear, sRegion) {
			var aFilters = [];
			var oUserModel = new sap.ui.model.json.JSONModel();
			var oFilter = new sap.ui.model.Filter("HotlineNum", sap.ui.model.FilterOperator.EQ, sHotline);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("CalYear", sap.ui.model.FilterOperator.EQ, sYear);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Region", sap.ui.model.FilterOperator.EQ, sRegion);
			aFilters.push(oFilter);
			sap.ui.core.BusyIndicator.show();
			this.oModel.read("/ListOfUserSet", {
				filters: aFilters,
				success: function(oData) {
					oUserModel.setData(oData);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});
			this.getView().setModel(oUserModel, "user");
		},
		closeDialog: function() {
			this._manageDialog.close();
		},
		createEntry: function() {
			var that = this;
			var aUser = this.getView().getModel("info").getData();
			var oEntry = {
				HotlineNum: aUser.hotline,
				Region: 'DE',
				CalYear: aUser.year,
				Uname: aUser.uname,
				Fte: aUser.fte
			};
			if (oEntry.HotlineNum !== '' && oEntry.CalYear !== '' & oEntry.Uname !== '') {
				this.oModel.create("/ListOfUserSet", oEntry, {
					success: function(oData) {
						if (oData.CalYear === "0") {
							that._getItems(aUser.hotline, aUser.year, "DE");
						}
						sap.m.MessageToast.show(oData.FullName);
					}
				});
				this.closeDialog();
			} else {
				sap.m.MessageToast.show("All Fields Are Mandatory!!!");
			}
		},
		updateEntry: function() {
			var that = this;
			var aUser = this.getView().getModel("info").getData();
			var oEntry = {
				HotlineNum: aUser.hotline,
				Region: 'DE',
				CalYear: aUser.year,
				Uname: aUser.uname,
				Fte: aUser.fte
			};
			if (oEntry.HotlineNum !== '' && oEntry.CalYear !== '' & oEntry.Uname !== '') {
				var sPath = "/ListOfUserSet(HotlineNum='" + oEntry.HotlineNum + "',Region='" + oEntry.Region + "',CalYear='" + oEntry.CalYear +
					"',Uname='"+ oEntry.Uname +"')";
				this.oModel.update(sPath, oEntry, {
					success: function() {
						that._getItems(aUser.hotline, aUser.year, "DE");
						that._calculateUpdate(aUser.hotline, aUser.year, "DE");
					}
				});
				this.closeDialog();
			} else {
				sap.m.MessageToast.show("All Fields Are Mandatory!!!");
			}
		},
		deleteEntry: function() {
			var that = this;
			var aUser = this.getView().getModel("info").getData();
			var oEntry = {
				HotlineNum: aUser.hotline,
				Region: 'DE',
				CalYear: aUser.year,
				Uname: aUser.uname,
				Fte: aUser.fte
			};
			if (oEntry.HotlineNum !== '' && oEntry.CalYear !== '' & oEntry.Uname !== '') {
				var sPath = "/ListOfUserSet(HotlineNum='" + oEntry.HotlineNum + "',Region='" + oEntry.Region + "',CalYear='" + oEntry.CalYear +
					"',Uname='"+ oEntry.Uname +"')";
				this.oModel.remove(sPath, {
					success: function() {
						that._getItems(aUser.hotline, aUser.year, "DE");
						that._calculateUpdate(aUser.hotline, aUser.year, "DE");
					},
					error : function(){
						sap.m.MessageToast.show("Could Not Delete User");
					}
				});
				this.closeDialog();
			} else {
				sap.m.MessageToast.show("All Fields Are Mandatory!!!");
			}
		},
		editTarget: function() {
			this.getView().getModel("btn").getData().editHeader = true;
			var aHead = this.getView().getModel("head").getData();
			this.getView().getModel("btn").getData().target = aHead.Target;
			this.getView().getModel("btn").refresh(true);
		},
		updateTarget: function() {
			var that = this;
			this.getView().getModel("btn").getData().editHeader = false;
			this.getView().getModel("btn").refresh(true);

			var aHead = this.getView().getModel("head").getData();
			var sHotline = aHead.HotlineNum;
			var sRegion = 'DE';
			var sYear = aHead.CalYear;
			var iTarget = this.getView().getModel("btn").getData().target;
			var oEntry = {
				HotlineNum: sHotline,
				Region: sRegion,
				CalYear: sYear,
				Target: iTarget
			};
			if (iTarget > 0) {
				var sPath = "/ManageDaysSet(HotlineNum='" + sHotline + "',CalYear='" + sYear + "',Region='" + sRegion + "')";
				this.oModel.update(sPath, oEntry, {
					success: function() {
						that._getHeader(sHotline, sYear, sRegion);
						that._calculateUpdate(sHotline, sYear, sRegion);
					}
				});
			}

		},
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
			//create a filter for the binding
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
				var sUserId = oSelectedItem.getDescription();
				var sUserName = oSelectedItem.getTitle();
				var oModel = this.getView().getModel("info");
				oModel.getData().fullname = sUserName;
				oModel.getData().uname = sUserId;
				oModel.refresh(true);
			}
			evt.getSource().getBinding("items").filter([]);
		}
	});

});