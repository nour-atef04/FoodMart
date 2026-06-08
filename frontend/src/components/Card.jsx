import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Card({
  storeProductId,
  storeProductImg,
  storeProductName,
  storeProductPrice,
  stockQuantity,
  addItemToCart,
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const isOutOfStock = Number(stockQuantity) <= 0;
  const cardImageStyle = {
    width: "100%",
    height: "10rem",
    objectFit: "cover",
    filter: isOutOfStock ? "grayscale(100%)" : "none",
    opacity: isOutOfStock ? 0.5 : 1,
  };

  function AddItem(id, quantity) {
    addItemToCart(id, quantity);
  }

  function handleCardClick() {
    navigate(`/store/product/${storeProductId}`);
  }

  function handleCardKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/store/product/${storeProductId}`);
    }
  }

  return (
    <div
      className="card"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        height: "100%",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        boxShadow: isHovered ? "0 14px 28px rgba(88, 71, 60, 0.14)" : "none",
      }}
    >
      <img
        src={storeProductImg}
        className="card-img-top"
        alt={storeProductName}
        style={cardImageStyle}
      />
      <div className="card-body" style={{ color: "#58473C" }}>
        <h5 className="card-title">{storeProductName}</h5>
        <h5 className="card-text">${storeProductPrice}</h5>
        <p
          style={{
            color: isOutOfStock ? "#8A7D70" : "#7C8B54",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          {isOutOfStock ? "Out of stock" : `${Number(stockQuantity)} in stock`}
        </p>

        <AddToCart id={storeProductId} AddItem={AddItem} stockQuantity={stockQuantity} />
      </div>
    </div>
  );
}

function AddToCart({ id, AddItem, stockQuantity }) {
  const [buttonColor, setButtonColor] = useState("grey");
  const maxQuantity = Math.max(0, Number(stockQuantity) || 0);
  const [quantity, setQuantity] = useState(maxQuantity > 0 ? 1 : 0);

  useEffect(() => {
    setQuantity(maxQuantity > 0 ? 1 : 0);
  }, [maxQuantity]);

  function incrementQuantity() {
    setQuantity((prevQuantity) => Math.min(prevQuantity + 1, maxQuantity));
  }

  function decrementQuantity() {
    setQuantity((prevQuantity) =>
      maxQuantity <= 0 ? 0 : prevQuantity > 1 ? prevQuantity - 1 : 1,
    );
  }

  function handleMouseOver() {
    setButtonColor("green");
  }

  function handleMouseOut() {
    setButtonColor("grey");
  }

  function handleClick() {
    if (maxQuantity <= 0) {
      return;
    }

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
        disabled={maxQuantity <= 0}
        isOutOfStock={maxQuantity <= 0}
      />
      <button
        type="button"
        className="btn"
        style={buttonStyle}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onClick={(event) => {
          event.stopPropagation();
          handleClick();
        }}
        aria-label="Add to Cart"
        disabled={maxQuantity <= 0}
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

function QuantitySetter({
  decrementQuantity,
  incrementQuantity,
  quantity,
  disabled,
  isOutOfStock,
}) {
  const buttonStyle = {
    width: "2rem",
    height: "2rem",
  };

  return (
    <span>
      <button
        type="button"
        className="btn btn-light p-2"
        onClick={(event) => {
          event.stopPropagation();
          decrementQuantity();
        }}
        aria-label="Decrease quantity"
        style={buttonStyle}
        disabled={disabled}
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

      <span style={{ margin: "10px" }}>{isOutOfStock ? 0 : quantity}</span>

      <button
        type="button"
        className="btn btn-light p-2"
        onClick={(event) => {
          event.stopPropagation();
          incrementQuantity();
        }}
        aria-label="Increase quantity"
        style={buttonStyle}
        disabled={disabled}
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
