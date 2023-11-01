import { api } from "../api"
import { wsSend } from "../redux/websocket/actions";
import { createRoomFailed } from "../redux/roomRegister/actions";
import { serialize } from "../../helpers/utility"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import i18n from "../../i18n";


export const teachersApi = api.injectEndpoints({
    reducerPath: 'teacherss',
    endpoints: (builder) => ({
        getTeachers: builder.query({
            query: (params) => ({
                url : `teachers?${serialize(params)}`
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${import.meta.env.VITE_BASE_URL}/admin`
                        }
                    })
                }
            },
            providesTags: [ 'teachers' ]
        }),
        
        changePasswordTeacher: builder.mutation({
            query: (body) => {
            return {url: `teachers/change-password/${body.id}`, method: 'POST', 
                body: {
                    new_password : body.new_password
                }
            }},
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled                
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${import.meta.env.VITE_BASE_URL}/admin`
                        }
                    })
                }
            },
            invalidatesTags: ['teachers']
        }),

        teachersCreateRoom: builder.mutation({
            query: (body) => ({url: `teachers/createRoom`, method: 'POST', body}),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                    const payload = { ...data?.data, ...{ type: "create_room", override: 0 } };
                    dispatch(wsSend(payload));
                
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${import.meta.env.VITE_BASE_URL}/admin`
                            dispatch(createRoomFailed(err.message))
                        } else {
                            dispatch(createRoomFailed(err.message))
                        }
                    })
                }
            },
            invalidatesTags: ['teachers']
        }),
        
        storeTeacher: builder.mutation({
            query: (params) => ({
                url: `teachers`, 
                method: 'POST', 
                body : params
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
            invalidatesTags: ['teachers']
        }),

        updateTeacher: builder.mutation({
            query: (body) => ({
                url: `teachers/${body.id}`, 
                method: 'PUT', 
                body : body
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
            invalidatesTags: ['teachers']
        }),

        deleteTeacher: builder.mutation({
            query: (body) => ({
                url: `teachers/${body.id}`, 
                method: 'DELETE', 
                body: body ? body : {}
            }),
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
                            window.location.href=`${baseUrl()}`
                        }
                    })
                }
            },
            invalidatesTags: ['teachers']
        }),

        storeAssistant: builder.mutation({
            query: (body) => ({
                url: `teachers/assistant`, 
                method: 'POST', 
                body: body ? body : {}
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                        }
                    })
                }
            },
            invalidatesTags: ['teachers']
        }),
    })
})

export const { useGetTeachersQuery, useChangePasswordTeacherMutation, useteachersCreateRoomMutation, useUpdateTeacherMutation, useStoreTeacherMutation, useDeleteTeacherMutation, useStoreAssistantMutation } = teachersApi
