import ReactDatePicker, {registerLocale, setDefaultLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./style.scss"
import { ja, enUS} from "date-fns/locale"
registerLocale('ja', ja)

const DatePicker = (props) => {
  return (
  <ReactDatePicker
    locale="ja"
    popperPlacement="top-start"
    popperProps={{strategy: "fixed"}}
    {...props}
  />
  )
}

export default DatePicker
