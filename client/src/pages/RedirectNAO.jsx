import { useState } from "react"
import { useEffect } from "react"
import LoginTeacher from "./teacher/LoginTeacher"

const RedirectNao = () => {
    const [redirect, setredirect] = useState(true);
    useEffect(() => {
      if(window.location.hostname === 'kgwu.realcast-online.net'){
        window.location.href = 'https://kgwu-rc.uird.jp'
      } else if(window.location.hostname === 'tkhsitest.realcast-online.net'){
        window.location.href = 'https://tkhsitest-rc.uird.jp'
      } else if(window.location.hostname === 'demo.realcast-online.net'){
        window.location.href = 'https://realcast.uird.jp'
      } else if(window.location.hostname === 'demo2.realcast-online.net'){
        window.location.href = 'https://tkhsitest-rc.uird.jp'
      } else {
        setredirect(false)
      }
    }, []);
    return (
    <>
      {!redirect && (
        <LoginTeacher />
      )}
    </>
    )
}

export default RedirectNao
