import { baseUrl, baseUrlScheduler, serialize } from "../../helpers/utility";
import { api } from "../api";
import { apiErrorHandler, clearLocalStorage } from "../../helpers/utility";
import { toast } from "react-toastify";

export const tenantsApi = api.injectEndpoints({
  reducerPath: "tenants",
  endpoints: (builder) => ({
    getTenants: builder.query({
      query: (params) => ({
        url: `tenants?${serialize(params)}`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
        } catch (err) {
          apiErrorHandler(err, () => {
            if (err.error?.status == 403 || err.error?.originalStatus == 403) {
              clearLocalStorage();
              window.location.href = `${baseUrl()}/admin`;
            }
          });
        }
      },
      providesTags: ["tenants"],
    }),

    storeTenants: builder.mutation({
      query: (body) => ({
        url: `tenants`,
        method: "POST",
        body: {
          name: body.name,
          linkage_type: body.linkage_type,
          limit: body.limit,
          user_limit: body.user_limit,
          blob_url: body.blob_url,
          blob_key: body.blob_key,
          blob_tenant_name: body.blob_tenant_name,
          use_blob_sync: body.use_blob_sync,
          use_blob_tenant_name: body.use_blob_tenant_name,
          google_client_id: body.google_client_id,
          microsoft_client_id: body.microsoft_client_id,
          subdomain: body.subdomain,
          lti_setting_id: body.lti_setting_id,
          platform_name: body.platform_name,
          platform_url: body.platform_url,
          client_id: body.client_id,
          authentication_endpoint: body.authentication_endpoint,
          accesstoken_endpoint: body.accesstoken_endpoint,
          auth_method_type: body.auth_method_type,
          auth_key: body.auth_key,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status) {
            toast.success(t(`Success Add ${data?.data.name}`), {
              position: "bottom-left",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              draggable: true,
              progress: undefined,
            });
          }
        } catch (err) {
          if (
            err.error?.data?.error_code != "alert.text.subdomain_already_use"
          ) {
            apiErrorHandler(err, () => {
              if (
                err.error?.status == 403 ||
                err.error?.originalStatus == 403
              ) {
                clearLocalStorage();
                window.location.href = `${baseUrl()}/tenant-management`;
              }
            });
          }
        }
      },
      invalidatesTags: ["tenants"],
    }),

    syncTenants: builder.mutation({
      query: (body) => ({
        url: `${baseUrlScheduler()}/sync/start`,
        method: "POST",
        body: {
          tenant_id: body.id,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status) {
            window.location.href = `${baseUrl()}/admin/tenant-management/sync/${
              data.job.data.tenantId
            }`;
          }
        } catch (err) {
          if (
            err.error?.data?.error_code != "alert.text.subdomain_already_use"
          ) {
            apiErrorHandler(err, () => {
              if (
                err.error?.status == 403 ||
                err.error?.originalStatus == 403
              ) {
                clearLocalStorage();
                window.location.href = `${baseUrl()}/admin/tenant-management`;
              }
            });
          }
        }
      },
      invalidatesTags: ["tenants"],
    }),

    statusSyncTenants: builder.query({
      query: (job_id) => ({
        url: `${baseUrlScheduler()}/sync/status/${job_id}`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
        } catch (err) {
          if (
            err.error?.data?.error_code != "alert.text.subdomain_already_use"
          ) {
            apiErrorHandler(err, () => {
              if (
                err.error?.status == 403 ||
                err.error?.originalStatus == 403
              ) {
                clearLocalStorage();
                window.location.href = `${baseUrl()}/admin/tenant-management`;
              }
            });
          }
        }
      },
      invalidatesTags: ["tenants"],
    }),

    stopSyncTenants: builder.mutation({
      query: (job_id) => ({
        url: `${baseUrlScheduler()}/sync/stopsync/${job_id}`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          //console.log(data)
          if (data.status) {
            window.location.href = `${baseUrl()}/admin/tenant-management`;
          }
        } catch (err) {
          if (
            err.error?.data?.error_code != "alert.text.subdomain_already_use"
          ) {
            apiErrorHandler(err, () => {
              if (
                err.error?.status == 403 ||
                err.error?.originalStatus == 403
              ) {
                clearLocalStorage();
                window.location.href = `${baseUrl()}/admin/tenant-management`;
              }
            });
          }
        }
      },
      invalidatesTags: ["tenants"],
    }),

    updateTenants: builder.mutation({
      query: (body) => ({
        url: `tenants/${body.id}`,
        method: "PUT",
        body: {
          name: body.name,
          linkage_type: body.linkage_type,
          limit: body.limit,
          user_limit: body.user_limit,
          blob_url: body.blob_url,
          blob_key: body.blob_key,
          blob_tenant_name: body.blob_tenant_name,
          use_blob_sync: body.use_blob_sync,
          use_blob_tenant_name: body.use_blob_tenant_name,
          google_client_id: body.google_client_id,
          microsoft_client_id: body.microsoft_client_id,
          subdomain: body.subdomain,
          lti_setting_id: body.lti_setting_id,
          platform_name: body.platform_name,
          platform_url: body.platform_url,
          client_id: body.client_id,
          authentication_endpoint: body.authentication_endpoint,
          accesstoken_endpoint: body.accesstoken_endpoint,
          auth_method_type: body.auth_method_type,
          auth_key: body.auth_key,
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status) {
            toast.success(t(`Success Edit ${data?.data.name}`), {
              position: "bottom-left",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              draggable: true,
              progress: undefined,
            });
          }
        } catch (err) {
          if (
            err.error?.data?.error_code != "alert.text.subdomain_already_use"
          ) {
            apiErrorHandler(err, () => {
              if (
                err.error?.status == 403 ||
                err.error?.originalStatus == 403
              ) {
                clearLocalStorage();
                window.location.href = `${baseUrl()}/tenant-management`;
              }
            });
          }
        }
      },
      invalidatesTags: ["tenants"],
    }),

    deleteTenants: builder.mutation({
      query: (body) => ({ url: `tenants/${body.id}`, method: "DELETE", body }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.status) {
            toast.success(t(`Success Delete ${data?.data.name}`), {
              position: "bottom-left",
              autoClose: 3000,
              hideProgressBar: true,
              closeOnClick: true,
              draggable: true,
              progress: undefined,
            });
          }
        } catch (err) {
          apiErrorHandler(err, () => {
            if (err.error?.status == 403 || err.error?.originalStatus == 403) {
              clearLocalStorage();
              window.location.href = `${baseUrl()}/tenant-management`;
            }
          });
        }
      },
      invalidatesTags: ["tenants"],
    }),

    checkSubDomain: builder.query({
      query: (params) => ({
        url: `tenants/check-subdomain`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
        } catch (err) {
          //console.log(err)
        }
      },
      providesTags: ["tenants"],
    }),

    getJob: builder.query({
      query: (params) => ({
        url: `tenants/job/${params.id}`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
        } catch (err) {
          apiErrorHandler(err, () => {
            if (err.error?.status == 403 || err.error?.originalStatus == 403) {
              clearLocalStorage();
              window.location.href = `${baseUrl()}/tenant-management`;
            }
          });
        }
      },
      providesTags: ["tenants"],
    }),

    getTenantById: builder.query({
      query: (params) => ({
        url: `tenants/${params.id}`,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
        } catch (err) {
          apiErrorHandler(err, () => {
            if (err.error?.status == 403 || err.error?.originalStatus == 403) {
              clearLocalStorage();
              window.location.href = `${baseUrl()}/tenant-management`;
            }
          });
        }
      },
      providesTags: ["tenants"],
    }),
  }),
});

export const {
  useGetTenantsQuery,
  useGetTenantByIdQuery,
  useCheckSubDomainQuery,
  useGetJobQuery,
  useStoreTenantsMutation,
  useUpdateTenantsMutation,
  useDeleteTenantsMutation,
  useSyncTenantsMutation,
  useStopSyncTenantsMutation,
  useStatusSyncTenantsQuery,
} = tenantsApi;
