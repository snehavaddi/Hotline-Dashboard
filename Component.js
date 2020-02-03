sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Hotline/model/models"
], function (UIComponent, Device, models) {
	"use strict";
	jQuery.sap.declare("Hotline.Component");
	return UIComponent.extend("Hotline.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * @public
		 * @override
		 */
		init: function () {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);

			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			//call roles model

			// create the views based on the url/hash
			this.getRouter().initialize();
			var oRootPath = jQuery.sap.getModulePath("Hotline");
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			var oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/HOTLINE_TOOL_SRV/");
			var oStatusModel = new sap.ui.model.json.JSONModel();
			oModel.read("/BackendSet('')", {
				success: function (oData) {
					var oEntry = {
						SYSTEM: oData.SystemId,
						STATUS: "Accept",
						ICON: "sap-icon://connected"
					};
					oStatusModel.setData(oEntry);

				},
				error: function () {
					var oEntry = {
						SYSTEM: "NO BACKEND CONN.",
						STATUS: "Reject",
						ICON: "sap-icon://disconnected"
					};
					oStatusModel.setData(oEntry);
					sap.m.MessageBox.error("Backend Connection Failed, Please reload the application");
				}
			});
			this.setModel(oStatusModel, "status");
			this.setModel(oModel, "odata");

			var oCountryModel = new sap.ui.model.json.JSONModel();
			oModel.read("/CheckCountrySet", {
				success: function (oData) {
					var oEntry = {
						country: oData.results[0].Country
					};
					oCountryModel.setData(oEntry);
				},
				async: false
			});
			this.setModel(oCountryModel, "country");
		}
	});

});