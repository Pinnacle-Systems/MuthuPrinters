import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ITEM_SUB_GROUP_API } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const ItemSubGroupMasterApi = createApi({
  reducerPath: "ItemSubGroupMaster",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["ItemSubGroupMaster"],
  endpoints: (builder) => ({
    getItemSubGroupMaster: builder.query({
      query: ({ params, searchParams }) => {
        if (searchParams) {
          return {
            url: ITEM_SUB_GROUP_API + "/search/" + searchParams,
            method: "GET",
            headers: {
              "Content-type": "application/json; charset=UTF-8",
            },
            params,
          };
        }
        return {
          url: ITEM_SUB_GROUP_API,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
          params,
        };
      },
      providesTags: ["ItemSubGroupMaster"],
    }),
    getItemSubGroupMasterById: builder.query({
      query: (id) => {
        return {
          url: `${ITEM_SUB_GROUP_API}/${id}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
          },
        };
      },
      providesTags: ["ItemSubGroupMaster"],
    }),
    addItemSubGroupMaster: builder.mutation({
      query: (payload) => ({
        url: ITEM_SUB_GROUP_API,
        method: "POST",
        body: payload,
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      }),
      invalidatesTags: ["ItemSubGroupMaster"],
    }),
    updateItemSubGroupMaster: builder.mutation({
      query: (payload) => {
        const { id, ...body } = payload;
        return {
          url: `${ITEM_SUB_GROUP_API}/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: ["ItemSubGroupMaster"],
    }),
    deleteItemSubGroupMaster: builder.mutation({
      query: (id) => ({
        url: `${ITEM_SUB_GROUP_API}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ItemSubGroupMaster"],
    }),
  }),
});

export const {
  useGetItemSubGroupMasterQuery,
  useGetItemSubGroupMasterByIdQuery,
  useLazyGetItemSubGroupMasterByIdQuery,
  useAddItemSubGroupMasterMutation,
  useUpdateItemSubGroupMasterMutation,
  useDeleteItemSubGroupMasterMutation,
} = ItemSubGroupMasterApi;

export default ItemSubGroupMasterApi;
