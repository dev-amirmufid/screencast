import React from 'react'

const Xselect = (props) => {
    return (
        <div>
            <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">{props.label}</label>
            <div className="mt-1">
                <select
                    id={props.id}
                    className={`
            ${props.formik.errors[props.id] && props.formik.touched[props.id] ? `border-red-400` : `border-gray-200`}
      border 
      text-gray-700 
      rounded 
      py-2 px-2
      focus:outline-none 
      focus:bg-white 
      focus:border-gray-500
      block w-full 
      focus:border-teal-500 focus:ring-teal-500 sm:text-sm
    `}
    disabled={(props.disabled)?props.disabled:false}
                    {...props.formik.getFieldProps(props.id)}
                >
                    {props.defaultValue && <option value=''>{props.defaultValue}</option>}
                    {props.data && props.data.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                </select>
            </div>
            {props.formik.errors[props.id] && props.formik.touched[props.id] && (<i className="mt-2 text-sm text-red-500">{props.formik.errors[props.id]}</i>)}
        </div>
    )
}

export default Xselect