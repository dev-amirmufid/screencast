import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function Xselect(props) {
    const { t } = useTranslation()
    const [myValue, setMyValue] = useState(null);
    const [opt, setOpt] = useState(null);
    useEffect(() => {
        if (props.data && props.defaultValue && !props.formik.values[props.id])
            return props.onChange(props.data[0])
    }, [props.data])

    useEffect(() => {
        var defOpt = (props.data && props.data.length > 0) ? props.data : [];
        setOpt(defOpt)
        if(props.data && props.formik.values[props.id]){
            let i = props.data.findIndex(x=>x.id == props.formik.values[props.id]);
            setupData(props.data[i])
        }else if (props.data && props.defaultValue) {
            setupData(props.data[0])
        } else {
            setupData(null)
        }
    }, [props.data])

    const setupData = (data) => {
        var defval = (data) ? data : null;
        setMyValue(defval)
    }

    return (
        <>
            <div>
                <label htmlFor={props.id} className="block text-sm font-medium text-gray-700">{props.label}</label>
                {(opt) ?
                    <Autocomplete
                        disabled={props.disabled}
                        noOptionsText={t('placeholder.no_matching')}
                        getOptionLabel={(option) => {
                            if (option)
                                return (props.binding) ? option[props.binding] : option.name
                        }}
                        value={myValue}
                        options={opt}
                        onChange={(e, val) => {
                            setupData(val)
                            props.onChange(val)
                        }}
                        renderInput={(params) => (
                            <div className="mt-1" ref={params.InputProps.ref}>
                                <input
                                    type='text'
                                    {...params.inputProps}
                                    className={`
                  ${props.formik.errors.tenant_id && props.formik.touched.tenant_id ? `border-red-400` : `border-gray-200`}
                  border 
                  text-gray-700 
                  rounded 
                  py-2 px-2
                  focus:outline-none 
                  focus:bg-white 
                  block w-full 
                  focus:border-teal-500 focus:ring-teal-500 sm:text-sm
                  pr-6
                `}
                                    placeholder={props.placeholder}
                                />
                                <FontAwesomeIcon icon="fa-solid fa-chevron-down" style={{float: 'right', marginRight: 6, marginTop: -25, fontSize:10, position: 'relative', zIndex: 1350, color: '#616161'}} />
                            </div>
                        )}
                    /> :
                    <div className="mt-1" >
                        <input
                            type='text'
                            disabled
                            value=""
                            className={`
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
                            placeholder={t('placeholder.data_not_found')}
                        />
                    </div>
                }
                {props.formik.errors[props.id] && props.formik.touched[props.id] && (<i className="mt-2 text-sm text-red-500">{props.formik.errors[props.id]}</i>)}
        
            </div>
        </>
    );
}
