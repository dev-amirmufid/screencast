import { baseUrl, getSubdomain, serialize } from "../../helpers/utility"
import { api } from "../api"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import i18n from "../../i18n";

export const usersApi = api.injectEndpoints({
    reducerPath: 'users',
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: (data) => ({
                url: `users/?${serialize(data)}`
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err, () => {
                        if (err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href = `${baseUrl()}/admin`
                        }
                    })
                }
            },
            providesTags: ['users']
        }),

        storeUsers: builder.mutation({
            query: (body) => ({
                url: `users`,
                method: 'POST',
                body: body
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    if (data.status) {
                        toast.success(i18n.t('alert.text.success_save'), {
                            position: "bottom-left",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                        })
                    }
                } catch (err) {
                    apiErrorHandler(err, () => {
                        if (err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/admin`
                        }
                    })
                }
            },
            invalidatesTags: ['users']
        }),

        updateUsers: builder.mutation({
            query: (body) => ({
                url: `users/${body.id}`,
                method: 'PUT',
                body: body
            }),
            async onQueryStarted(arg, { dispatch, queryFulfilled }) {
                try {
                    const { data } = await queryFulfilled
                    if(data.status){
                        toast.success(i18n.t('alert.text.success_edit'), {
                            position: "bottom-left",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                        })
                    }
                } catch (err) {
                    apiErrorHandler(err, () => {
                        if (err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/admin`
                        }
                    })
                }
            },
            invalidatesTags: ['users']
        }),

        deleteUsers: builder.mutation({ 
            query: (body) => ({url: `users/${body.id}`, method: 'DELETE', body:(body.params)?body.params:{}}),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if (data.status) {
                        toast.success(i18n.t('alert.text.success_delete'), {
                            position: "bottom-left",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                        })
                    }
                } catch (err) {
                    apiErrorHandler(err, () => {
                        if (err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/admin`
                        }
                    })
                }
            },
            invalidatesTags: ['users']
        }),
    })
})

export const { useGetUsersQuery, useStoreUsersMutation, useUpdateUsersMutation, useDeleteUsersMutation } = usersApi
