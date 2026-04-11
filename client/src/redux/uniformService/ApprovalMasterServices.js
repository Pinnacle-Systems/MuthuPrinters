import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { APPROVAL_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const approvalMasterApi = createApi({
  reducerPath: "approvalMaster",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["Approval"],
  endpoints: (builder) => ({
    getApproval: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: APPROVAL_API + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params,
          };
        }
        return {
          url: APPROVAL_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["Approval"],
    }),
    getApprovalNew: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: `${APPROVAL_API}/new` + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params,
          };
        }
        return {
          url: `${APPROVAL_API}/new`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["Approval"],
    }),
    getApprovalById: builder.query({
      query: (id) => {
        return {
          url: `${APPROVAL_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["Approval"],
    }),
    addApproval: builder.mutation({
      query: (payload) => ({
        url: APPROVAL_API,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Approval"],
    }),
    updateApproval: builder.mutation({
      query: (payload) => {
        const { id, ...body } = payload;
        return {
          url: `${APPROVAL_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["Approval"],
    }),
    deleteApproval: builder.mutation({
      query: (id) => ({
        url: `${APPROVAL_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Approval"],
    }),
  }),
});

export const {
  useGetApprovalQuery,
  useGetApprovalNewQuery,
  useLazyGetApprovalByIdQuery,
  useGetApprovalByIdQuery,
  useAddApprovalMutation,
  useUpdateApprovalMutation,
  useDeleteApprovalMutation,
} = approvalMasterApi;

export default approvalMasterApi;
