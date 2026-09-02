import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SALES_BILL_ENTRY_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const SalesBillEntryApi = createApi({
  reducerPath: "SalesBillEntry",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["SalesBillEntry"],
  endpoints: (builder) => ({
    getSalesBillEntry: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: SALES_BILL_ENTRY_API + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params
          };
        }
        return {
          url: SALES_BILL_ENTRY_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params
        };
      },
      providesTags: ["SalesBillEntry"],
    }),
    getSalesBillEntryById: builder.query({
      query: (id) => {
        return {
          url: `${SALES_BILL_ENTRY_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["SalesBillEntry"],
    }),
    addSalesBillEntry: builder.mutation({
      query: (payload) => ({
        url: SALES_BILL_ENTRY_API,
        method: "POST",
        body: payload,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }),
      invalidatesTags: ["SalesBillEntry"],
    }),
    updateSalesBillEntry: builder.mutation({
      query: (payload) => {
        const { id, ...body } = payload;
        return {
          url: `${SALES_BILL_ENTRY_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["SalesBillEntry"],
    }),
    deleteSalesBillEntry: builder.mutation({
      query: (id) => ({
        url: `${SALES_BILL_ENTRY_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesBillEntry"],
    }),
  }),
});

export const {
  useGetSalesBillEntryQuery,
  useGetSalesBillEntryByIdQuery,
  useAddSalesBillEntryMutation,
  useUpdateSalesBillEntryMutation,
  useDeleteSalesBillEntryMutation,
} = SalesBillEntryApi;

export default SalesBillEntryApi;
