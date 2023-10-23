import MessageBox from 'sap/m/MessageBox';
import UI5Object from 'sap/ui/base/Object';
import Message from 'sap/ui/core/message/Message';
import Messaging from 'sap/ui/core/Messaging';
import { Binding$AggregatedDataStateChangeEvent } from 'sap/ui/model/Binding';
import Filter from 'sap/ui/model/Filter';
import FilterOperator from 'sap/ui/model/FilterOperator';
import ListBinding from 'sap/ui/model/ListBinding';
import ODataListBinding from 'sap/ui/model/odata/v2/ODataListBinding';

import Component from '../Component';
import Core from 'sap/ui/core/Core';

export default class ErrorHandler extends UI5Object {
	private _oComponent: Component;
	private _bMessageOpen: boolean;
	public oMessageModelBinding: ListBinding;

	/**
	 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
	 * @param oComponent reference to the app's component
	 */
	constructor(oComponent: Component) {
		super();

		const oMessageManager = Core.getMessageManager() as unknown as Messaging ;
		const oMessageModel = oMessageManager.getMessageModel();

		this._oComponent = oComponent;
		this._bMessageOpen = false;

		this.oMessageModelBinding = oMessageModel.bindList(
			"/",
			undefined,
			[],
			new Filter("technical", FilterOperator.EQ, true)
		);

		this.oMessageModelBinding.attachChange(
			(oEvent: Binding$AggregatedDataStateChangeEvent) => {
				const aContexts = (oEvent.getSource() as unknown as ODataListBinding).getContexts();
				const aMessages: Message[] = [];

				if (this._bMessageOpen || !aContexts.length) {
					return;
				}

				aContexts.forEach(function (oContext) {
					aMessages.push(oContext.getObject() as Message);
				});
				oMessageManager.removeMessages(aMessages);


				// Due to batching there can be more than one technical message. However the UX
				// guidelines say "display a single message in a message box" assuming that there
				// will be only one at a time.
				const sErrorTitle = "Ocorreu um erro técnico. Contate o suporte.";
				this._showServiceError(sErrorTitle, aMessages[0].getMessage());
			}
		);
	}

	/**
	 * Shows a MessageBox when a service call has failed.
	 * Only the first error message will be displayed.
	 * @param sErrorTitle A title for the error message
	 * @param sDetails A technical error to be displayed on request
	 * @private
	 */
	private _showServiceError(sErrorTitle: string, sDetails: string): void {
		this._bMessageOpen = true;
		MessageBox.error(sErrorTitle, {
			id: "serviceErrorMessageBox",
			details: sDetails,
			styleClass: this._oComponent.getContentDensityClass(),
			actions: [MessageBox.Action.CLOSE],
			onClose: () => {
				this._bMessageOpen = false;
			},
		});
	}
}
