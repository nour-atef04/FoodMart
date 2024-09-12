import React, { useState } from "react";
import NavBarButton from "./MyButton";

export default function SearchBar({ searchStoreProducts }) {
  const [inputValue, setInputValue] = useState("");

  function handleClick() {
    searchStoreProducts(inputValue);
    setInputValue("");
  }

  function handleChange(event) {
    setInputValue(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleClick();
  }

  return (
    <form className="d-flex" onSubmit={handleSubmit}>
      <input
        className="form-control me-2"
        type="search"
        placeholder="Search Product"
        aria-label="Search"
        value={inputValue}
        onChange={handleChange}
      />
      <SearchButton handleClick={handleClick} />
    </form>
  );
}

function SearchButton({ handleClick }) {
  return (
    <NavBarButton
      title={"Search"}
      className={"btn mx-1"}
      handleClick={handleClick}
      color={"white"}
      hoverColor={"#8B9A61"}
    />
  );
}
