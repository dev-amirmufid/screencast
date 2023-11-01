import React from 'react'

function Xbutton(props) {
    return (
        <div>
            <button
                className="
    bg-gradient-to-r from-teal-400 to-teal-600 shadow 
      hover:bg-gradient-to-r hover:from-teal-700 hover:to-teal-600
      shadow 
      focus:shadow-outline 
      focus:outline-none 
      text-white font-bold py-2 px-4 rounded
    "
                type="button"
                onClick={props.onClick}
            >{props.children}
            </button>
        </div>
    )
}

export default Xbutton