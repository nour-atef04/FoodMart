import React, { useState } from "react";

export default function Card({
  storeProductId,
  storeProductImg,
  storeProductName,
  storeProductPrice,
  addItemToCart,
}) {
  function AddItem(id, quantity) {
    addItemToCart(id, quantity);
  }

  return (
    <div className="card" style={{ width: "100%", height: "100%" }}>
      <img
        src={storeProductImg}
        className="card-img-top"
        alt={storeProductName}
        style={{
          width: "100%",
          height: "10rem",
          objectFit: "cover",
        }}
      />
      <div className="card-body" style={{color: "#58473C"}}>
        <h5 className="card-title">{storeProductName}</h5>
        <h5 className="card-text">${storeProductPrice}</h5>

        <AddToCart id={storeProductId} AddItem={AddItem} />
      </div>
    </div>
  );
}

function AddToCart({ id, AddItem }) {
  const [buttonColor, setButtonColor] = useState("grey");

  const [quantity, setQuantity] = useState(1);

  function incrementQuantity() {
    setQuantity((prevQuantity) => prevQuantity + 1);
  }

  function decrementQuantity() {
    setQuantity((prevQuantity) => (prevQuantity > 1 ? prevQuantity - 1 : 1));
  }

  function handleMouseOver() {
    setButtonColor("green");
  }

  function handleMouseOut() {
    setButtonColor("grey");
  }

  function handleClick() {
    AddItem(id, quantity);
    setQuantity(1);
  }

  const buttonStyle = {
    color: buttonColor,
    fontSize: "1rem",
  };

  return (
    <div>
      <QuantitySetter
        decrementQuantity={decrementQuantity}
        incrementQuantity={incrementQuantity}
        quantity={quantity}
      />
      <button
        type="button"
        className="btn"
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={handleClick}
        aria-label="Add to Cart"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          className="bi bi-cart3"
          viewBox="0 0 16 16"
        >
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .49.598l-1 5a.5.5 0 0 1-.465.401l-9.397.472L4.415 11H13a.5.5 0 0 1 0 1H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5M3.102 4l.84 4.479 9.144-.459L13.89 4zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4m7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4m-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2m7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
        </svg>{" "}
        Add To Cart
      </button>
    </div>
  );
}

function QuantitySetter({ decrementQuantity, incrementQuantity, quantity }) {
  const buttonStyle = {
    width: "2rem",
    height: "2rem",
  };

  return (
    <span>
      <button
        type="button"
        className="btn btn-light p-2"
        onClick={decrementQuantity}
        aria-label="Decrease quantity"
        style={buttonStyle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          fill="currentColor"
          className="bi bi-dash-lg"
          viewBox="0 0 30 30"
          style={{color:"#382E28"}}
        >
          <path
            fillRule="evenodd"
            d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8"
          />
        </svg>
      </button>

      <span style={{ margin: "10px" }}>{quantity}</span>

      <button
        type="button"
        className="btn btn-light p-2"
        onClick={incrementQuantity}
        aria-label="Increase quantity"
        style={buttonStyle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          fill="currentColor"
          className="bi bi-plus-lg"
          viewBox="0 0 30 30"
          style={{color:"#382E28"}}
        >
          <path
            fillRule="evenodd"
            d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
          />
        </svg>
      </button>
    </span>
  );
}
