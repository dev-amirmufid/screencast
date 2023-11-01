import { api } from "../api"

export const authApi = api.injectEndpoints({
    reducerPath: 'auth',
    endpoints: (builder) => ({
        authAdmin: builder.mutation({
            query: (body) => ({url: `auth/admin`, method: 'POST', body}),
            invalidatesTags: ['auth']
        }),
        
        authTeacher: builder.mutation({
            query: (body) => ({url: `auth/teacher`, method: 'POST', body}),
            invalidatesTags: ['auth']
        }),
        
        authStudent: builder.mutation({
            query: (body) => ({url: `auth/student`, method: 'POST', body}),
            invalidatesTags: ['auth']
        }),

        authLogout: builder.mutation({
          query: (body) => ({url: `auth/logout`, method: 'POST', body}),
          invalidatesTags: ['auth']
        })
    })
})

export const {useAuthAdminMutation, useAuthTeacherMutation, useAuthStudentMutation, useAuthLogoutMutation} = authApi
