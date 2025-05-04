import React from "react";
import Title from "./Title";

export default function Navbar() {
  const handleTitleClick = () => {
    window.location.href = "/";
  };

  return (
    <div className="navbar-cover">
      <nav className="navbar navbar-expand-lg py-4 bg-transparent position-absolute w-100">
        <div className="container-fluid">
          <div className="d-flex w-100">
            <Title handleTitleClick={handleTitleClick} />
          </div>
        </div>
      </nav>
    </div>
  );
}
