// TO LOGIN AS AN EMPLOYEE TO THE CONTROL PANEL, USE THIS ACCOUNT:
// email address: test@test.com
// password: 123456

import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import BasicNavbar from "./BasicNavbar";
import "./CSS/Login.css";
import { AuthContext } from "./AuthContext";
import bgImage from "../images/Blog-Post-Featured-Images.webp";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(""); // clear any previous errors

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      //console.log(data);

      if (response.ok) {
        if (data.role === "employee") {
          login(data);
          navigate("/control"); // Navigate to control panel for employees
        } else if (data.role === "customer") {
          login(data);
          navigate("/store"); // Navigate to store for customers
        } else {
          setError("Invalid role returned by server.");
        }
      } else {
        setError(data.message || "Login failed, please try again.");
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

      <div
        className="login-container"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
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

            {/* USER TYPE */}
            <div className="d-flex justify-content-center align-items-center">
              <div className="form-check me-4">
                <input
                  className="form-check-input"
                  type="radio"
                  id="employee"
                  name="role"
                  value="employee"
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
                <label className="form-check-label" htmlFor="employee">
                  Employee
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  id="customer"
                  name="role"
                  value="customer"
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
                <label className="form-check-label" htmlFor="customer">
                  Customer
                </label>
              </div>
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
