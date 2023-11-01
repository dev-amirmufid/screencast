import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup"
import LoadingHoc from "../../hocs/LoadingHoc";

import { useAuth } from "../../hooks/useAuth";
import Footer from "../../components/Layout/Footer";
import Alert from '../../components/common/Alert'

const LoginAdmin = ({ setLoading }) => {

  const auth = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const formik = useFormik({
    initialValues: {
      username: '',
      password: ''
    },
    validationSchema: Yup.object().shape({
      username: Yup.string()
        .required(t('validation.userid_required')),
      password: Yup.string()
        .required(t('validation.password_required'))
    }),
    onSubmit: values => {
      setLoading(true)
      auth.signin(values, 'admin', ({ data, error }) => {
        setLoading(false)
        if (error) {
          setAlert({
            isOpen: true,
            title: t("alert.name"),
            excerpt: (error.data && error.data.error_code)?t(error.data.error_code):error?.data?.message,
          });
        }
        if (data) {
          if (data.data.role == 'admin') {
            navigate("/admin/school-management", { replace: true });
          } else if (data.data.role == 'school_admin') {
            navigate("/admin/teacher-management", { replace: true });
          } else {
            navigate("/admin", { replace: true });
          }
        }
      });
    }
  });

  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
    confirm: {
      status: false,
      labelBtnTrue: "",
      labelBtnfalse: "",
    },
  });

  const handleResetAlert = () => {
    setAlert({
      isOpen: false,
      title: "",
      excerpt: "",
      confirm: {
        status: false,
        labelBtnTrue: "",
        labelBtnfalse: "",
      },
    });
  };
  return (
    <>
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-2xl sm:mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-teal-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">

              <div className="w-full max-w-lg">
                <h1 className="text-3xl font-medium py-6 text-center text-gray-900 font-bold">{t("admin.login.title")}</h1>
              </div>


              <form
                className="w-full max-w-lg"
                id="admin_login_form"
                onSubmit={formik.handleSubmit}
              >
                <div className="sm:w-full">

                  <div className="flex flex-wrap -mx-3 mb-6">
                    <div className="w-full px-3">
                      <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="username"
                      >
                        {t("admin.login.label.userid")}
                      </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="username"
                        type="text"
                        {...formik.getFieldProps('username')}
                      />
                      {formik.errors.username && formik.touched.username && (<i className="text-red-500">{formik.errors.username}</i>)}
                    </div>
                  </div>

                  <div className="flex flex-wrap -mx-3 mb-6">
                    <div className="w-full px-3">
                      <label
                        className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
                        htmlFor="password"
                      >
                        {t("admin.login.label.password")}
                      </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        id="password"
                        type="password"
                        {...formik.getFieldProps('password')}
                      />
                      {formik.errors.password && formik.touched.password && (<i className="text-red-500">{formik.errors.password}</i>)}

                    </div>
                  </div>

                </div>

                <div className="sm:w-full">
                  <button
                    id="login_btn"
                    className="shadow w-96 mb-3 bg-gradient-to-r from-teal-600 to-teal-400 bor focus:shadow-outline focus:outline-none text-white font-bold py-4 px-4 rounded-full"
                    type="submit"
                  >
                    {t("admin.login.btn.submit_login")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <Alert handleChange={handleResetAlert} alert={alert} />
    </>
  );
}

export default LoadingHoc(LoginAdmin);
