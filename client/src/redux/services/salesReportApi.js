import { createApi } from "@reduxjs/toolkit/query/react";
import baseQuery from "./baseQuery";

export const salesReportApi = createApi({
  reducerPath: "salesReportApi",
  baseQuery: baseQuery,
  tagTypes: ["SalesReport"],
  endpoints: (builder) => ({
    getSalesReport: builder.query({
      query: (params) => ({
        url: `/salesReport`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getMonthlySalesReport: builder.query({
      query: (params) => ({
        url: `/salesReport/monthly`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getCustomerWiseSalesReport: builder.query({
      query: (params) => ({
        url: `/salesReport/customerWise`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getYearWiseSalesReport: builder.query({
      query: (params) => ({
        url: `/salesReport/yearWise`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
  }),
});

export const { useGetSalesReportQuery, useGetMonthlySalesReportQuery, useGetCustomerWiseSalesReportQuery, useGetYearWiseSalesReportQuery } = salesReportApi;
export default salesReportApi;
