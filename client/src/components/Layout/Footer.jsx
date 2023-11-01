const Footer = (props) => {
  var hide = (!props.hide) ? {display:'none'}: {};
  const selectedLang = localStorage.getItem('language');
  const handleChangeLanguage = (lang) => {
    localStorage.setItem('language', lang);
    window.location.reload();
  }
  return (
    <div className={`flex justify-end fixed bottom-0 w-full h-8 bg-gray-100 shadow-md p-1 flex ${props.className ? props.className : ''}`} >
      <div className="w-14">
        <button onClick={() => handleChangeLanguage('en')} className={`${selectedLang === 'en' ? 'text-teal-500' : ''} hover:text-teal-500`}>EN</button>
        &nbsp;|&nbsp;
        <button onClick={() => handleChangeLanguage('jp')} className={`${selectedLang === 'jp' ? 'text-teal-500' : ''} hover:text-teal-500`}>JP</button>
      </div>
    </div>
  );
}

export default Footer;
