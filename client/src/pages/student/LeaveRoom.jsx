import React, { useState } from "react";
import Alert from "../../components/common/Alert";
import { useTranslation } from "react-i18next";

const LeaveRoom = ({force}) => {
  const { t } = useTranslation();

  const [alert, setAlert] = useState({
    isOpen: true,
    excerpt: force ? t("alert.text.leave_room_student_force") : t("alert.text.leave_room_student") ,
    hideBtnOk: true,
    hideTitle: true,
  });

  return (
    <>
      <Alert handleChange={() => {}} alert={alert} />
    </>
  );
};

export default LeaveRoom;
