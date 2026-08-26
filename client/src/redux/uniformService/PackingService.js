import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { PACKING_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const packingApi = createApi({
  reducerPath: "Packing",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["Packing"],
  endpoints: (builder) => ({
    getPacking: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: PACKING_API + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params,
          };
        }
        return {
          url: PACKING_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["Packing"],
    }),
    getRefList: builder.query({
      query: ({ params }) => {
        return {
          url: PACKING_API + "/refList",
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["Packing"],
    }),
    getOrderItemsList: builder.query({
      query: ({ params }) => {
        return {
          url: PACKING_API + "/orderitemsList",
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["Packing"],
    }),
    getPackingById: builder.query({
      query: (id) => {
        return {
          url: `${PACKING_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["Packing"],
    }),
    addPacking: builder.mutation({
      query: (payload) => ({
        url: PACKING_API,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Packing"],
    }),
    updatePacking: builder.mutation({
      query: ({ id, body }) => {
        return {
          url: `${PACKING_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["Packing"],
    }),
    deletePacking: builder.mutation({
      query: (id) => ({
        url: `${PACKING_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Packing"],
    }),
  }),
});

export const {
  useGetPackingQuery,
  useGetPackingByIdQuery,
  useGetRefListQuery,
  useGetOrderItemsListQuery,
  useLazyGetPackingByIdQuery,
  useAddPackingMutation,
  useUpdatePackingMutation,
  useDeletePackingMutation,
} = packingApi;

export default packingApi;
