import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react'
import { getSubdomain } from '../helpers/utility';

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_URL,
        prepareHeaders: (headers,{ getState }) => {
            headers.set("subdomain", getSubdomain(window.location.hostname));
            const loginStorage = localStorage.getItem("login") != null
                ? JSON.parse(localStorage.getItem("login"))
                : null

            const token = loginStorage?.access_token?.token || null;
            if (token) {
                headers.set('Authorization', `Bearer ${token}`)
            }
            return headers
        }
    }),
    tagTypes: ['teachers','auth','tenants','rooms'],
    endpoints: () => ({}),
    refetchOnMountOrArgChange : true
})
