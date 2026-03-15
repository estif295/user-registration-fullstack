import React, { useState } from "react";
import API from "../api";

function Register() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [message,setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/auth/register", {
        name,
        email,
        password
      });

      setMessage(res.data.message);

    } catch (err) {
      setMessage(err.response.data.message);
    }
  };

  return (
    <div>

      <h2>Register</h2>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Name"
          onChange={(e)=>setName(e.target.value)}
        />

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

        <button type="submit">Register</button>

      </form>

      <p>{message}</p>

    </div>
  );
}

export default Register;