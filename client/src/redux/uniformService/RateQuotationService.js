import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RATE_QUOTATION_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const RateQuotationApi = createApi({
  reducerPath: "rateQuotation",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["rateQuotation"],
  endpoints: (builder) => ({
    getRateQuotation: builder.query({
      query: ({ params }) => {
        return {
          url: RATE_QUOTATION_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["rateQuotation"],
    }),

    getRateQuotationById: builder.query({
      query: (id) => {
        return {
          url: `${RATE_QUOTATION_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["rateQuotation"],
    }),
    addRateQuotation: builder.mutation({
      query: (payload) => ({
        url: RATE_QUOTATION_API,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["rateQuotation"],
    }),
    updateRateQuotation: builder.mutation({
      query: ({ id, body }) => {
        return {
          url: `${RATE_QUOTATION_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["rateQuotation"],
    }),
    deleteRateQuotation: builder.mutation({
      query: (id) => ({
        url: `${RATE_QUOTATION_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["rateQuotation"],
    }),
  }),
});

export const {
  useGetRateQuotationQuery,
  useGetRateQuotationByIdQuery,
  useAddRateQuotationMutation,
  useUpdateRateQuotationMutation,
  useDeleteRateQuotationMutation,
} = RateQuotationApi;

export default RateQuotationApi;
