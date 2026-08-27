import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { PACKING_CONTROL } from "../../Api";

const BASE_URL = process.env.REACT_APP_SERVER_URL;

const PackingControlApi = createApi({
    reducerPath: "PackingControl",
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
    }),
    tagTypes: ["PackingControl"],
    endpoints: (builder) => ({
        getPackingControl: builder.query({
            query: ({ params, searchParams }) => {
                if (searchParams) {
                    return {
                        url: PACKING_CONTROL + "/search/" + searchParams,
                        method: "GET",
                        headers: {
                            "Content-type": "application/json; charset=UTF-8",
                        },
                        params
                    };
                }
                return {
                    url: PACKING_CONTROL,
                    method: "GET",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                    params
                };
            },
            providesTags: ["PackingControl"],
        }),
        getPackingControlById: builder.query({
            query: (id) => {
                return {
                    url: `${PACKING_CONTROL}/${id}`,
                    method: "GET",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                };
            },
            providesTags: ["PackingControl"],
        }),
        getPackingControlItemsById: builder.query({
            query: ({ id, prevProcessId, packingCategory, packingType }) => {
                return {
                    url: `${PACKING_CONTROL}/getOrderItems/${id}`,
                    method: "GET",
                    headers: {
                        "Content-type": "application/json; charset=UTF-8",
                    },
                };
            },
            providesTags: ["PackingControl"],
        }),
        addPackingControl: builder.mutation({
            query: (payload) => ({
                url: PACKING_CONTROL,
                method: "POST",
                body: payload,
            }),
            invalidatesTags: ["Order"],
        }),
        upload: builder.mutation({
            query: (payload) => {
                const { id, body } = payload;
                return {
                    url: `${PACKING_CONTROL}/upload/${id}`,
                    method: "PATCH",
                    body,
                };
            },
            invalidatesTags: ["PackingControl"],
        }),
        updatePackingControl: builder.mutation({
            query: (payload) => {
                const { id, ...body } = payload;
                return {
                    url: `${PACKING_CONTROL}/${id}`,
                    method: "PUT",
                    body,
                };
            },
            invalidatesTags: ["PackingControl"],
        }),
        deletePackingControl: builder.mutation({
            query: (payload) => {
                const { id, ...body } = payload;
                return {
                    url: `${PACKING_CONTROL}/${id}`,
                    method: "DELETE",
                    body,
                }
            },
            invalidatesTags: ["PackingControl"],
        }),
    }),
});

export const {
    useGetPackingControlQuery,
    useGetPackingControlByIdQuery,
    useGetPackingControlItemsByIdQuery,
    useAddPackingControlMutation,
    useUpdatePackingControlMutation,
    useDeletePackingControlMutation,

} = PackingControlApi;

export default PackingControlApi;
