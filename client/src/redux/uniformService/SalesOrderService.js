import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { SALES_ORDER_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const SalesOrderApi = createApi({
  reducerPath: "SalesOrder",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["SalesOrder"],
  endpoints: (builder) => ({
    getSalesOrder: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: SALES_ORDER_API + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params,
          };
        }
        return {
          url: SALES_ORDER_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["SalesOrder"],
    }),
    getRefList: builder.query({
      query: ({ params }) => {
        return {
          url: SALES_ORDER_API + "/refList",
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["SalesOrder"],
    }),
    getOrderItemsList: builder.query({
      query: ({ params }) => {
        return {
          url: SALES_ORDER_API + "/orderitemsList",
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["SalesOrder"],
    }),
    getSalesOrderById: builder.query({
      query: (id) => {
        return {
          url: `${SALES_ORDER_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["SalesOrder"],
    }),
    addSalesOrder: builder.mutation({
      query: (payload) => ({
        url: SALES_ORDER_API,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SalesOrder"],
    }),
    updateSalesOrder: builder.mutation({
      query: ({ id, body }) => {
        return {
          url: `${SALES_ORDER_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["SalesOrder"],
    }),
    deleteSalesOrder: builder.mutation({
      query: (id) => ({
        url: `${SALES_ORDER_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SalesOrder"],
    }),
  }),
});

export const {
  useGetSalesOrderQuery,
  useGetSalesOrderByIdQuery,
  useGetRefListQuery,
  useGetOrderItemsListQuery,
  useLazyGetSalesOrderByIdQuery,
  useAddSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
} = SalesOrderApi;

export default SalesOrderApi;
