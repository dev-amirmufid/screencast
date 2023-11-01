import {
    WATCHING_SET_START,
    WATCHING_USER_RESET,
    WATCHING_SET_TYPE,
    WATCHING_SET_LOADING,
    WATCHING_SET_USER,
    WATCHING_SET_USER_STATUS,
  } from "../../actions";
  
  /* 
    users state contain data property:
    userStatus (ready, is_watching, disconnect, not_ready)
    isUserWatching (true, false)
    isUserLoading (true, false)
  */
  
  const initState = {
    users: [],
    type: "watching", //(watching, compare, split)
    isWatching: false,
  };
  
  export const watchingReducer = (state = initState, action) => {
    switch (action.type) {
      case WATCHING_SET_START:
        return { ...state, isWatching: action.payload };
      case WATCHING_SET_TYPE:
        return { ...state, type: action.payload };
  
      case WATCHING_SET_USER:
        const appendData = action.payload.map(user => ({...user, userStatus: "ready", isUserWatching: false, isUserLoading: false}));
        return {...state, users: appendData };
        
      case WATCHING_SET_USER_STATUS:
        let users = state.users.map((user) =>
          user.user_id === action.payload?.user_id
            ? { ...user, userStatus: action.payload?.status }
            : user
        );
        return { ...state, users: users };
      case WATCHING_SET_LOADING:
        let usersLoading = state.users.map((user) => user.user_id === action.payload?.user_id ? { ...user, isUserLoading: action.payload?.loading } : user);
        return { ...state, users: usersLoading };
      case WATCHING_USER_RESET:
        return { ...state, users: [] }
      default:
        return state;
    }
  };
  