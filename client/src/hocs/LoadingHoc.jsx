import React, { useState } from "react";
import LoadingOverlay from "../components/common/Overlay";

const LoadingHoc = (WrappedComponent) => {
  function HOC(props) {
    const [loading, setLoading] = useState(false);

    const setLoadingState = (isComponentLoading) => {
      setLoading(isComponentLoading);
    };
    return (
      <>
        {loading && <LoadingOverlay isOpen={loading} />}
        <WrappedComponent {...props} setLoading={setLoadingState} />
      </>
    );
  }

  return HOC;
};
export default LoadingHoc;
