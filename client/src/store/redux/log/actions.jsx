import * as api from "../../../api";;

export const storeLog = async (logData) => {
    const { data } = await api.storeLog(logData);
};
