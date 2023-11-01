import { useContext } from "react"
import { AuthContext } from "../router/Provider/AuthProvider"

export const useAuth = () => {
  return useContext(AuthContext);
}
