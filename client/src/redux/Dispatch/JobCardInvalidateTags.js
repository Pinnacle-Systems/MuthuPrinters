import store from "../store";
import {
  JobCardApi,
  ProductionAllocationApi,
  ProductionOutwardApi,
} from "../uniformService";

export const invalidateJobCardModule = () => {
  store.dispatch(JobCardApi.util.invalidateTags(["jobCard"]));
  store.dispatch(
    ProductionAllocationApi.util.invalidateTags(["productionAllocation"]),
  );
  store.dispatch(
    ProductionOutwardApi.util.invalidateTags(["productionOutward"]),
  );
  //   store.dispatch(stockApi.util.invalidateTags(["Stock"]));
};
