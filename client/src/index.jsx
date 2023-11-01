import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/store";
import App from "./App";
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { CookiesProvider } from 'react-cookie';

library.add(fas, far, fab)

import "./i18n";
import './styles.scss';

const loadCss = async () => {
  if(process.env.NODE_ENV == 'development'){
    return import("./styles/tailwind.css")
  } else {
    return import("./styles/output.css")
  }
}

loadCss().then(()=>{
  ReactDOM.createRoot(document.getElementById("root")).render(
    <CookiesProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </CookiesProvider>
  )
}
)
