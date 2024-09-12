import React from "react";

export default function Title({handleTitleClick}) {
    const titleDivStyle = {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      color: "white",
      cursor : "pointer"
    };
  
    return (
      <div style={titleDivStyle}>
        <h1
          style={{ fontFamily: '"Playwrite CU", cursive' }}
          className="ms-5 mb-0"
          onClick={handleTitleClick}
        >
          FoodMart
        </h1>
        <p className="ms-5 mb-0">Groccery Store</p>
      </div>
    );
  }