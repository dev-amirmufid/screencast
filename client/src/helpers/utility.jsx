import i18n from "../i18n";
import { parse } from "tldts";

export const cutText = (value, textLength) => {
  return value
    ? value.length > textLength
      ? `${value.substr(0, textLength)}...`
      : value
    : "";
};

export const serialize = (obj, prefix) => {
  var str = [],
    p;
  obj = removeEmpty(obj);
  for (p in obj) {
    if (obj.hasOwnProperty(p)) {
      var k = prefix ? prefix + "[" + p + "]" : p,
        v = obj[p];
      str.push(
        v !== null && typeof v === "object"
          ? serialize(v, k)
          : encodeURIComponent(k) + "=" + encodeURIComponent(v)
      );
    }
  }
  return str.join("&");
};

export const concatClearText = (arr) => {
  arr = arr.filter(Boolean);
  return arr.join(" ").trim();
};

export const clearLocalStorage = () => {
  localStorage.removeItem("openIDAccount");
  localStorage.removeItem("loginSession");
  localStorage.removeItem("login");
  localStorage.removeItem("roomData");
};

export const apiErrorHandler = (err, callback = false) => {
  import("react-toastify").then(({ toast }) => {
    let message = "";

    if (err.error?.status == 404 || err.error?.originalStatus == 404) {
      message =
        err.error && err.error.data && err.error.data.error_code
          ? i18n.t(err.error.data.error_code)
          : i18n.t("alert.text.api_not_found");
    } else if (err.error?.status == 403 || err.error?.originalStatus == 403) {
      message = "Unauthorized, you have signed out";
    } else {
      message =
        err.error && err.error.data && err.error.data.error_code
          ? i18n.t(err.error.data.error_code)
          : err?.error?.data?.message;
    }

    const toastId = "api-alert";
    //   toast.update(toastId.current, { type: toast.TYPE.INFO, autoClose: 5000 });
    // } else {
    toast.error(message, {
      toastId: toastId,
      position: "bottom-left",
      autoClose: 3000,
      hideProgressBar: true,
      closeOnClick: false,
      draggable: false,
      progress: undefined,
    });

    if (callback) {
      setTimeout(() => {
        callback();
      }, 1000);
    }
  });
};

export const RenderHTML = ({ HTML }) => (
  // eslint-disable-next-line react/no-danger
  <span className="text-red-600" dangerouslySetInnerHTML={{ __html: HTML }} />
);

export const removeEmpty = (obj) => {
  if (obj) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v != null && v != "")
        .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
    );
  } else {
    return obj;
  }
};

export const emptyStringToNull = (obj) => {
  const newObj = { ...obj };
  for (let key in newObj) {
    if (newObj[key] === "") newObj[key] = null;
  }
  return newObj;
};

export const getSubdomain = (location) => {
  const host = parse(location);
  console.log(host);
  let subdomain = host.subdomain;
  if (host.publicSuffix == "localhost") {
    subdomain = host.domainWithoutSuffix;
  }
  return subdomain;
};

export const baseUrl = () => {
  return import.meta.env.VITE_BASE_URL.replace(
    "*",
    getSubdomain(window.location.hostname)
  );
};

export const baseUrlScheduler = () => {
  return import.meta.env.VITE_API_SCHEDULER_URL;
};
