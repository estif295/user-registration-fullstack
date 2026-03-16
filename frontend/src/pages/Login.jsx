import React,{useState} from "react";
import API from "../api";

function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");

  const handleLogin = async (e) => {

    e.preventDefault();

    try {

      const res = await API.post("/auth/login",{
        email,
        password
      });

      setMessage("Login Successful");

      localStorage.setItem("token",res.data.token);

    } catch(err){

      setMessage(err.response.data.message);

    }

  };

  return(
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p className={message.includes("Successful") ? "message" : "error"}>{message}</p>
      <div className="link">
        <a href="/">Don't have an account? Register</a>
      </div>
    </div>
  );

}

export default Login;