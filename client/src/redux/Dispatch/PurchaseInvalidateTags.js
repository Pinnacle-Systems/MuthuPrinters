// src/redux/utils/invalidateTags.js

import purchaseInwardEntryApi from "../uniformService/PurchaseInwardEntry";
import purchaseReturnApi from "../services/PurchaseReturnService";
import purchaseCancelApi from "../uniformService/PurchaseCancelService";
import PoApi from "../uniformService/PoServices"
import store from "../store";

export const invalidatePurchaseModule = () => {
  store.dispatch(purchaseInwardEntryApi.util.invalidateTags(["purchaseInwardEntry"]));
  store.dispatch(purchaseReturnApi.util.invalidateTags(["PurchaseReturn"]));
  store.dispatch(purchaseCancelApi.util.invalidateTags(["PurchaseCancel"]));
  store.dispatch(PoApi.util.invalidateTags(["po"]))
};