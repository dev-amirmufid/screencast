import { Route, Routes } from "react-router-dom";
import { AdminRouters } from "./AdminRouters";
import { TenantRouters } from "./TenantRouters";

export const ROUTER = [
  {
    subdomain : 'www',
    app : AdminRouters,
    main : true
  },
  {
    subdomain : import.meta.env.VITE_SUBDOMAIN_ADMIN,
    app : AdminRouters,
    main : false
  },
  {
    subdomain : import.meta.env.VITE_SUBDOMAIN_TENANT,
    app : TenantRouters,
    main : false
  }
]
