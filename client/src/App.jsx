import React, {Suspense} from "react";

import { BrowserRouter } from "react-router-dom";

import {AuthProvider} from "./router/Provider/AuthProvider";
import { getSubdomain } from "./helpers/utility";

import { ROUTER } from "./router/RouterMap";
import Overlay from "./components/common/Overlay";


export const getApp = () => {
  const subdomain = getSubdomain(window.location.hostname);

  const main = ROUTER.find(app => app.main);

  if(!main) throw new Error("main app not found");

  if(subdomain == "") return main.app
  
  const app = ROUTER.find(app => subdomain === app.subdomain);

  if(!app) {
    const tenant = ROUTER.find(app => 'tenant' === app.subdomain);
    return tenant.app
  }

  return app.app
}

const App = () => {
  const AppRouter = getApp();
  return (
    <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Overlay isOpen={true} />}>
            <AppRouter />
          </Suspense>
        </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
