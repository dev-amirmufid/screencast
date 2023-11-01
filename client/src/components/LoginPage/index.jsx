import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export const LoginPage = () => {
  let navigate = useNavigate();
  let location = useLocation();
  let auth = useAuth();

  let from = location.state?.from?.pathname || "/";

  function handleSubmit(event) {
    event.preventDefault();

    let formData = new FormData(event.currentTarget);
    let username = formData.get("username");
    let password = formData.get("password");

    auth.signin({username,password}, 'admin', () => {
      navigate(from, { replace: true });
    });
  }

  return (
    <div>
      <p>You must log in to view the page at {from}</p>

      <form onSubmit={handleSubmit}>
        <label>
          Username: <input name="username" type="text" />
          password: <input name="password" type="text" />
        </label>{" "}
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
