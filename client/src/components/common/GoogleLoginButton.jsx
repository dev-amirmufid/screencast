import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGoogleLogin } from '@react-oauth/google';
import ReactHtmlParser from "html-react-parser";
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useDispatch } from 'react-redux';

const GoogleLoginButton = (props) => {
  const {t} = useTranslation();
  const auth = useAuth();
  const dispatch = useDispatch();
  

  const login = useGoogleLogin({
    onSuccess: props.onSuccess,
    onError: errorResponse => console.log(errorResponse),
});
  
  return (
    <button
      onClick={() => login()}
      disabled={props.disabled}
      type="button"
      className="w-full mt-4 ml-2 mr-2 focus:shadow  focus:outline-none border border-grey-500 text-gray-700 text-sm font-bold p-3 rounded"
    >
      <div className="flex items-center justify-center">
        <FontAwesomeIcon icon="fa-brands fa-google" className="text-2xl ml-2 mr-5 text-red-500" />
        <span className="text-center">
          {ReactHtmlParser(t("btn.btn_google"))}
        </span>
      </div>
    </button>
  )
}

export default GoogleLoginButton
