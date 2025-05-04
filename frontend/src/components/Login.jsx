import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BasicNavbar from "./BasicNavbar";
import "./Login.css";

function Login({ setCurrentUser }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
      //console.log(data);
  
      if (response.ok) {
        navigate("/store");
        setCurrentUser(data);

      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleSignupClick = (e) => {
    e.preventDefault(); // Prevent default anchor behavior
    navigate("/signup"); // Navigate to signup page
  };

  return (
    <>
      <BasicNavbar />

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Welcome Back</h1>
            <p>Please enter your credentials to login</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                minLength="6"
              />
            </div>

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <a 
                href="/signup" 
                onClick={handleSignupClick}
                style={{ cursor: "pointer" }}
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
