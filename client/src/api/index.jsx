import axios from "redaxios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL });

export const teacherCreateRoom = (roomData) => API.post("/teachers/createRoom", roomData);
export const generateStudentURL = (roomData) => API.post("/teachers/generateStudentURL", roomData);
export const generateAssistantURL = (roomData) => API.post("/teachers/generateAssistantURL", roomData);

export const authStudent = (authData) => API.post("/auth/student", authData);
export const authAssistant = (authData) => API.post("/auth/assistant", authData);

export const storeLog = (logData) => API.post("/log/store", logData);
