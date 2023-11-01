import React from 'react';
import { Route, Routes } from "react-router-dom"

const NotFound = React.lazy(() => import("../pages/NotFound"));

export const NotFoundRouters = () => {
  return (
    <Routes>
      <Route path="/" element={<NotFound />} />
      <Route path="*" element={ <NotFound />} />
    </Routes>
  )
}
