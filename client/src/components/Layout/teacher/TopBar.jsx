import parse from 'html-react-parser';

const TopBar = ({title,children}) => {
  return (
    
   <div className="bg-gray-100 shadow-md">
      <div className="p-2 items-center">
        <div className="flex justify-between items-center">
          <div className="width-rtitle-teacher">
            <h1 className="text-2xl truncate max-w-lg">{title}</h1>
          </div>
          
          <div className="width-topbarbtn-teacher">
            {children}
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default TopBar;
