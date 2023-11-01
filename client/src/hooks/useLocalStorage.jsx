import { useState } from "react";

export const useLocalStorage = (keyName, defaultValue) => {
 const [storedValue, setStoredValue] = useState(()=>{
  try {
   const value = localStorage.getItem(keyName);
   if(value) {
    return JSON.parse(value);
   } else {
    localStorage.setItem(keyName, JSON.stringify(defaultValue));
    return defaultValue
   }
  } catch (err) {
   return defaultValue
  }
 });

 const setValue = (newValue) => {
  try {
    localStorage.setItem(keyName, JSON.stringify(newValue));
  } catch (err) {}
  setStoredValue(newValue)
 }

 const removeStorage = () => {
  try {
    localStorage.removeItem(keyName);
  } catch (err) {}
  setStoredValue(null)
 }

 return [storedValue,setValue,removeStorage]
}
