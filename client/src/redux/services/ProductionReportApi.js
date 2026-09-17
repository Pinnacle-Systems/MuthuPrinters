import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "./baseQuery";

export const productionReportApi = createApi({
  reducerPath: "productionReportApi",
  baseQuery: baseQuery,
  tagTypes: ["ProductionReport"],
  endpoints: (builder) => ({
    getDailyProductionReport: builder.query({
      query: (params) => ({
        url: `/productionReport`,
        method: "GET",
        params,
      }),
      providesTags: ["ProductionReport"],
    }),
  }),
});

export const { useGetDailyProductionReportQuery } = productionReportApi;
export default productionReportApi;
