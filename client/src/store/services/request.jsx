import { baseUrl, getSubdomain, serialize } from "../../helpers/utility"
import { api } from "../api"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import i18n from "../../i18n";

export const requestApi = api.injectEndpoints({
    reducerPath: 'request',
    endpoints: (builder) => ({
        getData: builder.query({
            query: (data) => ({
                url : data?.endpoint+`?${serialize(data?.params)}`
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
            providesTags: [ 'request' ]
        }),

        storeData: builder.mutation({
            query: (data) => ({
                url: data?.endpoint, 
                method: (data?.method)?data?.method:'POST', 
                body : data?.params
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if(data?.status){
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
            invalidatesTags: ['request']
        }),

        deleteData: builder.mutation({
            query: (body) => ({url: body.endpoint, method: 'DELETE', body:(body.params)?body.params:{}}),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    if(data?.status){
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
            invalidatesTags: ['request']
        }),

        exportData: builder.mutation({
            query: (data) => ({
                url : data?.endpoint+`?${serialize(data?.params)}`,
                responseHandler: async (response) => {
                    
                    if(response && response.status == 200){
                        const blob = await response.blob()  
                        var link = document.createElement("a");
                        link.href = window?.URL?.createObjectURL(blob);//window.location.assign(window.URL.createObjectURL(blob));
                        link.download = "ユーザー.csv";
                        link.click(); 
                    
                    }else{

                        if(response?.status == 403){
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }else{
                            toast.error(i18n.t('alert.toast.file_failed_downloading'), {
                                position: "bottom-left",
                                autoClose: 3000,
                                hideProgressBar: true,
                                closeOnClick: true,
                                draggable: true,
                                progress: undefined,
                            })
                        }
                     }
                },
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    
                    toast.success(i18n.t('alert.toast.file_downloaded'), {
                        position: "bottom-left",
                        autoClose: 3000,
                        hideProgressBar: true,
                        closeOnClick: true,
                        draggable: true,
                        progress: undefined,
                    })

                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    }) 
                }
            },
            providesTags: [ 'request' ]
        }),
        
        importData: builder.mutation({
            query: (data) => ({
                url : data?.endpoint+`?${serialize(data?.params)}`,
                method: (data?.method)?data?.method:'POST',
                body : data?.params
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled

                    if(data && data?.data?.rows?.length > 0)
                        toast.success(i18n.t('admin.teachers.alert.import_success'), {
                            position: "bottom-left",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                        })

                } catch (err) {
                
                    if(err?.error?.data?.message && (err.error?.status != 403 || err.error?.originalStatus != 403))
                        return toast.error(i18n.t(err?.error?.data?.message)+' '+(JSON.stringify(err.error?.data?.data) || ''), {
                                    position: "bottom-left",
                                    autoClose: 3000,
                                    hideProgressBar: true,
                                    closeOnClick: true,
                                    draggable: true,
                                    progress: undefined,
                                })

                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    }) 
                }
            },
            providesTags: [ 'request' ]
        }),
    })
})

export const { useImportDataMutation, useExportDataMutation, useGetDataQuery, useStoreDataMutation, useDeleteDataMutation } = requestApi
