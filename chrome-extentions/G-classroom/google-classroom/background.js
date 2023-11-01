const API_KEY = "AIzaSyCA-gYWcDjpQ3_-i5efJFCVZFEDATpV5YU";
let user_signed_in = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "get_auth_token") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      console.log(token);
    });
    sendResponse(true);
  } else if (request.message === "get_profile") {
    chrome.identity.getProfileUserInfo(
      { accountStatus: "ANY" },
      function (user_info) {
        console.log(user_info);
      }
    );
    sendResponse(true);
  } else if (request.message === "get_courses") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      let fetch_url = `https://classroom.googleapis.com/v1/courses?key=${API_KEY}`;
      let fetch_options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      fetch(fetch_url, fetch_options)
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          sendResponse(res);
        });
    });

    return true;
  } else if (request.message === "check_user") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      chrome.identity.getProfileUserInfo(
        { accountStatus: "ANY" },
        function (user) {
          let course = request.data;
          let fetch_url = `https://classroom.googleapis.com/v1/courses/${course.id}/teachers/${user.id}`;
          let fetch_options = {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          };

          fetch(fetch_url, fetch_options)
            .then((res) => res.json())
            .then((res) => {
              sendResponse(res);
            });
        }
      );
    });

    return true;
  } else if (request.message === "logout") {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      var url = 'https://accounts.google.com/o/oauth2/revoke?token=' + token;
      window.fetch(url);
      chrome.identity.removeCachedAuthToken({token: token}, function (){
        sendResponse(token);
      });
    });

    return true;
  }
});
