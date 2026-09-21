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
    getYearWiseBreakupReport: builder.query({
      query: (params) => ({
        url: `/salesReport/yearWiseBreakup`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getMonthWiseBreakupReport: builder.query({
      query: (params) => ({
        url: `/salesReport/monthWiseBreakup`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getQuarterWiseBreakupReport: builder.query({
      query: (params) => ({
        url: `/salesReport/quarterWiseBreakup`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
    getCustomerWiseBreakupReport: builder.query({
      query: (params) => ({
        url: `/salesReport/customerWiseBreakup`,
        method: "GET",
        params,
      }),
      providesTags: ["SalesReport"],
    }),
  }),
});

export const { useGetSalesReportQuery, useGetMonthlySalesReportQuery, useGetCustomerWiseSalesReportQuery, useGetYearWiseSalesReportQuery, useGetYearWiseBreakupReportQuery, useGetMonthWiseBreakupReportQuery, useGetQuarterWiseBreakupReportQuery, useGetCustomerWiseBreakupReportQuery } = salesReportApi;
export default salesReportApi;
