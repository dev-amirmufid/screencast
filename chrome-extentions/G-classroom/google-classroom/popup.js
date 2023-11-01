$(document).ready(function () {
  loadCourse();
});

$(document).on("click", ".course-card", function () {
  let dataCourse = JSON.parse(decodeURIComponent($(this).attr("data-course")));
  $('.overlay').show();
  chrome.runtime.sendMessage(
    { message: "check_user", data: dataCourse },
    async function (response) {
      $('.overlay').hide();
      if (response?.error) {
        window.open(`https://www.infinitecdev.com/realcast/g-classroom/${dataCourse.id}?user_type=student`, '_blank');
      } else {
        window.open(`https://www.infinitecdev.com/realcast/g-classroom/${dataCourse.id}?user_type=teacher`, '_blank');
      }
    }
  );
});

$(document).on("click", "#logout", function () {
  $('.overlay').show();
  chrome.runtime.sendMessage(
    { message: "logout" },
    async function (response) {
      $('.overlay').hide();
      window.close();
    }
  );
});

async function getUser() {
  chrome.runtime.sendMessage(
    { message: "get_profile" },
    async function (response) {
      console.log(response);
    }
  );
}

async function loadCourse() {
  chrome.runtime.sendMessage(
    { message: "get_courses" },
    async function (response) {
      $(".preloader").hide();
      let courses = response.courses;

      let html = ``;
      if (Object.keys(response).length > 0 && courses.length > 0) {
        html += '<h6 class="my-3 w-100">あなたの教室</h6>';
        courses.forEach((course) => {
          let dataCourse = encodeURIComponent(JSON.stringify(course));
          html += `<div class="card course-card mb-2" id="ucing" data-course="${dataCourse}">
            <div class="card-body px-3 py-2">
            <h6 class="card-title mb-2">${course.name}</h6>
            <p class="card-subtitle mb-2 text-muted" style="font-size: 12px !important">${course.descriptionHeading}</p>
            <div class="text-muted card-subtitle d-flex justify-content-between mt-2">
            <p class="mb-0" style="font-size: 12px">room: ${course.room}</p>
            <p class="mb-0" style="font-size: 12px">course id: ${course.id}</p>
            </div>
            </div>
            </div>
            `;
        });
        html += '<button id="logout">ログアウト</button>';
      } else {
        html += `<div class="text-muted w-100 text-center my-3">No Classroom available</div>`;
      }

      $(".courses").html(html);
    }
  );
}
