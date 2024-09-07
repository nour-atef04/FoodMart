import React, { useState, useEffect } from "react";
import { Children } from "react";

export default function NavBar({ cartItems, removeItemFromCart }) {
  function removeItem(cartItemId) {
    removeItemFromCart(cartItemId);
  }

  return (
    <nav className="navbar py-0">
      <div
        style={{ backgroundColor: "#adc178" }}
        className="container-fluid py-3"
      >
        <Title />
        <ViewCartButton cartItems={cartItems} removeItemFromCart={removeItem} />
      </div>
    </nav>
  );
}

function Title() {
  const titleDivStyle = {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "white",
  };

  return (
    <div style={titleDivStyle}>
      <h1
        style={{ fontFamily: '"Playwrite CU", cursive' }}
        className="mx-5 mb-0"
      >
        FoodMart
      </h1>
      <p className="mb-0">Groccery Store</p>
    </div>
  );
}

//WHEN CLICKED, VIEW THE ITEMS INSIDE THE CART

function ViewCartButton({ cartItems, removeItemFromCart }) {
  const [visibility, setVisibility] = useState("none");
  const [buttonBackground, setButtonBackground] = useState("transparent");
  const [totalCheckoutPrice, setTotalCheckoutPrice] = useState(0);

  function handleClick() {
    setVisibility(visibility === "none" ? "block" : "none");
  }

  function handleMouseOver() {
    setButtonBackground("#8B9A61");
  }

  function handleMouseOut() {
    setButtonBackground("transparent");
  }

  function calculateCheckoutPrice() {
    const totalPrice = cartItems.reduce((accumulator, item) => {
      return accumulator + item.totalItemPrice;
    }, 0);
    setTotalCheckoutPrice(totalPrice);
  }

  useEffect(() => {
    calculateCheckoutPrice();
  }, [cartItems]);

  return (
    <>
      <button
        className="btn mx-5"
        type="button"
        style={{
          color: "white",
          border: "2px solid white",
          background: buttonBackground,
        }}
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      >
        View Your Cart
      </button>
      <CartList
        cartItemsLength={cartItems.length}
        visibility={visibility}
        handleClick={handleClick}
        totalCheckoutPrice={totalCheckoutPrice}
      >
        {cartItems.map((cartItem, index) => (
          <CardListItem
            key={index}
            cartItemId={index}
            cartItemImg={cartItem.productImg}
            cartItemName={cartItem.productName}
            cartItemQuantity={cartItem.itemQuantity}
            cartItemTotalPrice={cartItem.totalItemPrice}
            removeItemFromCart={removeItemFromCart}
          />
        ))}
      </CartList>
    </>
  );
}

function CartList({
  cartItemsLength,
  visibility,
  handleClick,
  totalCheckoutPrice,
  children,
}) {
  const cartListDivStyle = {
    display: visibility,
    height: "100vh",
    position: "absolute",
    right: "0",
    top: "0",
    zIndex: "1",
    backgroundColor: "white",
    boxShadow: "0px 100px 100px rgba(0, 0, 0, 0.5)",
    overflowY: "auto",
  };

  const cartListTitleStyle = {
    display: "inline",
    position: "absolute",
    color: "grey",
    letterSpacing: "4px",
  };

  const closeCartListButtonStyle = {
    position: "absolute",
    right: "0",
    color: "grey",
  };

  const checkoutPriceDisplayerStyle = {
    position: "absolute",
    color: "grey",
    letterSpacing: "4px",
  };

  return (
    <div className="col-lg-5 col-md-6 col-12" style={cartListDivStyle}>
      <h2 style={cartListTitleStyle} className="my-2 mx-5">
        YOUR CART
      </h2>
      <p className="my-5 mx-5" style={checkoutPriceDisplayerStyle}>
        Total price: ${totalCheckoutPrice.toFixed(2)}
      </p>
      <button
        className="btn m-2"
        style={closeCartListButtonStyle}
        onClick={handleClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          fill="currentColor"
          className="bi bi-x-lg"
          viewBox="0 0 16 16"
        >
          <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
        </svg>
      </button>
      {children}

      {cartItemsLength > 0 ? (
        <button
          className="btn mt-0 m-5"
          style={{
            backgroundColor: "orange",
            color: "white",
            fontWeight: "bold",
          }}
        >
          Continue To Checkout
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "grey",
            letterSpacing: "4px",
            marginTop: "300px",
          }}
        >
          <p>No items in cart</p>
        </div>
      )}
    </div>
  );
}

function CardListItem({
  cartItemId,
  cartItemImg,
  cartItemName,
  cartItemQuantity,
  cartItemTotalPrice,
  removeItemFromCart,
}) {
  function handleClick() {
    removeItemFromCart(cartItemId);
  }

  return (
    <div
      className="card"
      style={{
        maxWidth: "80%",
        position: "relative",
        margin: "10%",
        marginTop: "100px",
      }}
    >
      <div className="row g-0">
        <div className="col-md-4">
          <img
            style={{
              width: "100%",
              height: "10rem",
              objectFit: "cover",
            }}
            src={cartItemImg}
            className="img-fluid rounded-start"
            alt={cartItemName}
          />
        </div>
        <div className="col-md-8">
          <div
            className="card-body"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <h5 className="card-title">{cartItemName}</h5>
            <p className="card-text">Quantity: {cartItemQuantity}</p>
            <p className="card-text">
              Total product price: ${cartItemTotalPrice}
            </p>

            <div
              style={{
                marginBottom: "auto",
                alignSelf: "flex-end",
                position: "absolute",
                top: "0",
                right: "0",
                margin: "0.5rem",
              }}
            >
              <button className="btn btn-danger p-1" onClick={handleClick}>
                <svg
                  className="w-16px h-16px text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M6 18 17.94 6M18 18 6.06 6"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
