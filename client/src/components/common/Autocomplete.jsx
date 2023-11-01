import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function CustomInputAutocomplete(props) {
  const { t } = useTranslation()
  const [myValue, setMyValue] = useState(null);
  const [opt, setOpt] = useState(null);

  useEffect(() => {
    if (props.data && props.defaultValue && !props.value)
      return props.onChange(props.data[0])
  }, [props.data])

  useEffect(() => {
    var defOpt = (props.data && props.data.length > 0) ? props.data : [];
    setOpt(defOpt)
    if(props.data && props.value){
        let i = props.data.findIndex(x=>x.id == props.value);
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
            noOptionsText={t('placeholder.no_matching')}
            value={myValue}
            options={opt}
            getOptionLabel={(option) => option.name}
            openOnFocus={true}
            onChange={(e, val) => {
              setMyValue(val)
              props.onChange(val)
            }}
            renderInput={(params) => (
              <div className="mt-1" ref={params.InputProps.ref}>
                <input
                  type='text'
                  {...params.inputProps}
                  className={`
    border 
    text-gray-700 
    rounded 
    py-2.5 pl-2 pr-5
    focus:outline-none 
    focus:bg-white 
    focus:border-gray-500
    block w-full 
    focus:border-teal-500 focus:ring-teal-500 sm:text-sm
  `}
                  placeholder={(props.placeholder) ? props.placeholder : props.label}
                />
                <FontAwesomeIcon icon="fa-solid fa-chevron-down" style={{float: 'right', marginRight: 6, marginTop: -25, fontSize:10, position: 'relative', zIndex: 1350, color: '#616161'}} />
              </div>
            )}
          /> :
          <div className="mt-1" ><input
            type='text'
            disabled
            value=""
            className={`
border 
text-gray-700 
rounded 
py-2.5 px-2
focus:outline-none 
focus:bg-white 
focus:border-gray-500
block w-full 
focus:border-teal-500 focus:ring-teal-500 sm:text-sm
`}
            placeholder={t('placeholder.data_not_found')}
          /></div>
        }
      </div>
    </>
  );
}
