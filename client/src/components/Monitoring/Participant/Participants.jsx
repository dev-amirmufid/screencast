import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Participant from "./Participant";
import { setUserCompare } from "../../../store/redux/watching/actions";
import ReactPaginate from "react-paginate";
import { pagination, rulePaginate } from "../../../constant/pagination";

import "./style.scss";

const Participants = ({ gridSize }) => {
  const allUser = useSelector((state) => state.monitoring.participants);
  const [participants, setParticipants] = useState([]);
  const isWatching = useSelector((state) => state.watching.isWatching);
  const dispatch = useDispatch();
  const copyParticipants = useRef([]);
  const [paginUser, setPaginUser] = useState();
  const [currentPage, setCurrentpage] = useState(0);

  useEffect(() => {
    if (isWatching) {
      copyParticipants.current = [...paginUser.data];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatching]);

  useEffect(() => {
    var participantFiltered = [];
    if (allUser) {
      //console.log(allUser,'allUser')
      participantFiltered = allUser.filter(x => x.user_type != 'teacher');


      participantFiltered.sort((a, b) => {
        if (a.username < b.username) {
          return -1;
        }
        if (a.username > b.username) {
          return 1;
        }
        return 0;
      });
    }
    setParticipants(participantFiltered)
  }, [allUser])

  useEffect(() => {
    dataParticipants();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, currentPage, gridSize]);

  useEffect(() => {
    if (paginUser?.data.length === 0) {
      setCurrentpage(0);
    }
  }, [paginUser, currentPage]);

  const onSelectedUser = (participantId) => {
    dispatch(setUserCompare(participantId));
  };

  const dataParticipants = () => {
    const paginUser = pagination(
      participants,
      currentPage + 1,
      rulePaginate[gridSize]
    );
    setPaginUser(paginUser);
  };

  const handlePageClick = (data) => {
    let selected = data.selected;
    setCurrentpage(selected);
    dataParticipants(selected);
  };

  return (
    <>
      <section className="px-4 sm:px-6 lg:px-4 xl:px-6 pt-4 pb-4 sm:pb-6 lg:pb-4 xl:pb-6 space-y-4">
        <ul id="screen_list" className={`grid grid-cols-${gridSize} gap-4`}>
          {paginUser?.data.length > 0 &&
            (isWatching ? copyParticipants.current : paginUser?.data).map(
              (user) => (
                <Participant
                  key={user.user_id}
                  participant={user}
                  onSelectedUser={onSelectedUser}
                />
              )
            )}
        </ul>
      </section>

      <div className="paginate-participant z-10">
        {participants.length !== 0 && (
          <ReactPaginate
            previousLabel={"<<<<"}
            nextLabel={">>>>"}
            breakLabel={"..."}
            breakClassName={"break-me"}
            pageCount={paginUser?.total_pages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            forcePage={currentPage}
            onPageChange={handlePageClick}
            containerClassName={"pagination"}
            activeClassName={"active"}
          />
        )}
      </div>
    </>
  );
};

export default Participants;
