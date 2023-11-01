import { baseUrl, serialize } from "../../helpers/utility"
import { api } from "../api"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import { wsSend } from "../redux/websocket/actions";

export const roomsApi = api.injectEndpoints({
    reducerPath: 'rooms',
    endpoints: (builder) => ({
        getRooms: builder.query({
            query: (params) => ({
                url : `rooms?${serialize(params)}`
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            providesTags: [ 'rooms' ]
        }),

        storeRoom: builder.mutation({
            query: (body) => ({url: `rooms`, method: 'POST', 
                body : {
                    name : body.name,
                    expiredAt : body.expiredAt,
                    is_disabled : body.is_disabled,
                    teacher_id : body.teacher_id,
                    tenant_id : body.tenant_id
                }
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled

                    if(data.status){
                        toast.success(t(`Success Add ${data?.data.name}`), {
                            position: "bottom-left",
                            autoClose: 3000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                          })
                    }
                    
                    // const payload = { ...data?.data, ...{ type: "create_room", override: 0 } };
                    // dispatch(wsSend(payload));

                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['rooms']
        }),

        updateRoom: builder.mutation({
            query: (body) => ({url: `rooms/${body.id}`, method: 'PUT', 
                body : {
                    name : body.name,
                    expiredAt : body.expiredAt,
                    is_disabled : body.is_disabled,
                    teacher_id : body.teacher_id,
                    tenant_id : body.tenant_id
                }
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['rooms']
        }),

        deleteRoom: builder.mutation({
            query: (body) => ({url: `rooms/${body.id}`, method: 'DELETE', body}),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    apiErrorHandler(err,()=>{
                        if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                            clearLocalStorage()
                            window.location.href=`${baseUrl()}/teacher`
                        }
                    })
                }
            },
            invalidatesTags: ['rooms']
        }),

        getRoomById: builder.query({
            query: (params) => ({
                url : `rooms/${params.id}`
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    // apiErrorHandler(err,()=>{
                    //     if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                    //         clearLocalStorage()
                    //         window.location.href=`${baseUrl()}/teacher`
                    //     }
                    // })
                }
            },
            providesTags: [ 'rooms' ]
        }),
        getRoomByUri: builder.query({
            query: (params) => ({
                url : `rooms/roomId/${params.id}`
            }),
            async onQueryStarted(arg, {dispatch,queryFulfilled}) {
                try {
                    const { data } = await queryFulfilled
                } catch (err) {
                    // apiErrorHandler(err,()=>{
                    //     if(err.error?.status == 403 || err.error?.originalStatus == 403) {
                    //         clearLocalStorage()
                    //         window.location.href=`${baseUrl()}/teacher`
                    //     }
                    // })
                }
            },
            providesTags: [ 'rooms' ]
        }),
    })
})

export const { useGetRoomsQuery, useGetRoomsLazyQuery,  useStoreRoomMutation, useUpdateRoomMutation, useDeleteRoomMutation, useGetRoomByIdQuery, useGetRoomByUriQuery } = roomsApi
