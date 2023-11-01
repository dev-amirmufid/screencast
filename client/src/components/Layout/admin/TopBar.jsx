import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";;

const TopBar = ({title,children}) => {
  return (
    
   <div className="bg-gray-100 shadow-md">
      <div className="p-2 items-center">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl truncate">{title}</h1>
          </div>
          
          <div>
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default TopBar;
