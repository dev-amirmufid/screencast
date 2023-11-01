import { baseUrl, getSubdomain, serialize } from "../../helpers/utility"
import { api } from "../api"
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";
import i18n from "../../i18n";

export const logsApi = api.injectEndpoints({
    reducerPath: 'logs',
    endpoints: (builder) => ({
        getLogs: builder.query({
            query: (params) => ({
                url : `logs?${serialize(params)}`
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
            providesTags: [ 'logs' ]
        }),
    })
})

export const { useGetLogsQuery } = logsApi
