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

    <div>

      <h2>Login</h2>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

      </form>

      <p>{message}</p>

    </div>

  );

}

export default Login;