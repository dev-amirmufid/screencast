import { baseUrl, serialize } from "../../helpers/utility"
import { api } from "../api"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import i18n from "../../i18n";

export const schoolsApi = api.injectEndpoints({
    reducerPath: 'schools',
    endpoints: (builder) => ({
        getSchools: builder.query({
            query: (params) => ({
                url : `schools?${serialize(params)}`
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/admin`
                        }
                    })
                }
            },
            providesTags: [ 'schools' ]
        }),

        storeSchools: builder.mutation({
            query: (body) => ({url: `schools`, method: 'POST', 
                body : {
                    school_code:body.school_code,
                    tenant_id:body.tenant_id,
                    name:body.name,
                }
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if(data.status){
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
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['schools']
        }),

        updateSchools: builder.mutation({
            query: (body) => ({url: `schools/${body.id}`, method: 'PUT', 
                body : {
                    name:body.name,
                    school_code:body.school_code,
                    tenant_id:body.tenant_id
                }
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if(data.status){
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
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['schools']
        }),

        deleteSchools: builder.mutation({
            query: (body) => ({url: `schools/${body.id}`, method: 'DELETE', body}),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if(data.status){
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
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['schools']
        }),
    })
})

export const { useGetSchoolsQuery, useStoreSchoolsMutation, useUpdateSchoolsMutation, useDeleteSchoolsMutation } = schoolsApi
