import React from "react";
import backgroundImg from "../images/diagonal-striped-brick.png";

export default function Footer() {
  const d = new Date();

  return (
    <footer>
      <nav className="navbar pt-5 pb-0">
        <div
          style={{
            backgroundColor: "#adc178",
            backgroundImage: `url(${backgroundImg})`,
          }}
          className="container-fluid py-3"
        >
          <small
            style={{ color: "white", fontWeight: "400" }}
            className="mx-auto"
          >
            FoodMart {d.getFullYear()}
          </small>
        </div>
      </nav>
    </footer>
  );
}
