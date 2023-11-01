import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;
import { NavLink } from "react-router-dom";
import Alert from "../../common/Alert";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth";
import "./style.scss"

const Navbar = ({ title, logoutAction }) => {
  const { t } = useTranslation()
  const auth = useAuth();
  const [alert, setAlert] = useState({
    isOpen: false,
    title: "",
    excerpt: "",
  });

  const classNavButton = {
    active: "bg-teal-700 mr-3 shadow focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded",
    normal: "bg-gradient-to-r from-white to-gray-200 mr-3 shadow focus:shadow-outline focus:outline-none text-teal-600 font-bold py-2 px-4 rounded"
  }

  const handleLogout = () => {
    setAlert({
      ...alert,
      isOpen: true,
      title: t('alert.name'),
      excerpt: t('alert.text.logout_confirm'),
      confirm: {
        status: true,
        labelBtnTrue: t('btn.btn_logout'),
        labelBtnfalse: t('btn.btn_cancel'),
      },
    });
  }

  const handleCloseAlert = () => {
    setAlert({
      isOpen: false,
      title: "",
      excerpt: "",
      confirm: {
        status: false, 
        labelBtnTrue: "", 
        labelBtnfalse: ""
      }
    });
  };


  return (
    <>
      <nav
        className="bg-gradient-to-r from-teal-600 to-teal-400 shadow"
        role="navigation"
      >
        <div className="p-2 flex flex-wrap items-center md:flex-no-wrap">
          <div className="mr-4 md:mr-8 text-2xl text-white truncate admin-title">
            {title}
          </div>
          <div className="w-full md:w-auto md:flex-grow md:flex md:items-center">
            <ul className="flex flex-col mt-4 -mx-4 pt-4 border-t md:flex-row md:items-center md:mx-0 md:ml-auto md:mt-0 md:pt-0 md:border-0">
              {(auth.user.data.role == 'superadmin') &&
                <li>
                  <NavLink to="admin/tenant-management"
                    className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-map-location" className="mr-3" />
                    {t('navigation.tenants')}
                  </NavLink>
                </li>
              }
              
              {(['superadmin','admin'].includes(auth.user.data.role)) &&
              <li>
                <NavLink to="admin/school-management"
                  className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-solid fa-school" className="mr-3" />
                  {t('navigation.schools')}
                </NavLink>
              </li>
              }
              <li>
                <NavLink to="/admin/teacher-management"
                  className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-solid fa-user" className="mr-3" />
                  {t('navigation.teachers')}
                </NavLink>
              </li>
              <li>
                <NavLink to="/admin/room-management"
                  className={({isActive})=> isActive ? classNavButton.active:classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-brands fa-chromecast" className="mr-3"/>
                  {t('navigation.rooms')}
                </NavLink>
              </li>
              {(['superadmin','admin'].includes(auth.user.data.role)) &&
                <li>
                  <NavLink to="admin/admin-management"
                    className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                  >
                    <FontAwesomeIcon icon="fa-solid fa-users" className="mr-3" />
                    {t('navigation.admin')}
                  </NavLink>
                </li>
              }
              <li>
                <NavLink to="admin/log-management"
                  className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-solid fa-file" className="mr-3" />
                  {t('navigation.logs')}
                </NavLink>
              </li>
              {(auth.user.data.role == 'superadmin') &&
              <li>
                <NavLink to="admin/sync-log-management"
                  className={({ isActive }) => isActive ? classNavButton.active : classNavButton.normal}
                >
                  <FontAwesomeIcon icon="fa-solid fa-rotate " className="mr-3" />
                  {t('navigation.sync_logs')}
                </NavLink>
              </li>
              }
              <li>
                <button
                  className={classNavButton.normal}
                  type="button"
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" className="mr-3 text-teal-500" />
                  {t('navigation.logout')}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <Alert
        handleChange={handleCloseAlert}
        onBtnTrueHandler={logoutAction}
        alert={alert}
      />
    </>
  )
}

export default Navbar;
