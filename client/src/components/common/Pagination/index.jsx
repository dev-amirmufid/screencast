import ReactPaginate from "react-paginate";
import './style.scss'

const Pagination = () => {
  return (
    <ReactPaginate
    previousLabel={"<<<<"}
            nextLabel={">>>>"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            pageCount={5}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            forcePage={3}
            onPageChange={()=>{console.log()}}
            containerClassName={"pagination"}
            activeClassName={"active"}
    ></ReactPaginate>
  );
}

export default Pagination;
