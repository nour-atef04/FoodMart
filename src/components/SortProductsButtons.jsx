import React from "react";
import SortButton from "./MyButton";

export default function SortProductsButtons({
  unsortProducts,
  sortPricesLowToHigh,
  sortPricesHighToLow,
}) {
  return (
    <div className="d-flex justify-content-end me-5">
      <SortButton
        color={"#58473C"}
        hoverColor={"#dde5b6"}
        className={"btn ms-5"}
        title={"Prices high to low"}
        handleClick={sortPricesHighToLow}
      />
      <SortButton
        color={"#58473C"}
        hoverColor={"#dde5b6"}
        className={"btn mx-1"}
        title={"Prices low to high"}
        handleClick={sortPricesLowToHigh}
      />
      <SortButton
        color={"#58473C"}
        hoverColor={"#dde5b6"}
        className={"btn me-5"}
        title={"Unsorted"}
        handleClick={unsortProducts}
      />
    </div>
  );
}
