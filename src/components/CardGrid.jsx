import React from "react";

//GRID FOR ALL STORE PRODUCTS
export default function CardGrid({ children }) {
  return (
    <>
      <div className="container text-center mt-5">
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-4">
          {children}
        </div>
      </div>
    </>
  );
}

