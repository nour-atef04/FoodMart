import React, { useState, useEffect } from "react";
import NavBarButton from "./MyButton";
import backgroundImg from "../images/diagonal-striped-brick.png";

export default function NavBar({ cartItems, removeItemFromCart, children }) {
  function removeItem(cartItemId) {
    removeItemFromCart(cartItemId);
  }

  return (
    <>
      <nav className="navbar navbar-expand-lg py-0">
        <div
          className="container-fluid py-3"
          style={{
            backgroundColor: "#adc178",
            backgroundImage: `url(${backgroundImg})`,
          }}
        >
          <div className="navbar-brand">{children[1]}</div>
          <NavBarButton
            className={"navbar-toggler me-5"}
            dataBsToggle={"collapse"}
            dataBsTarget={"#navbarSupportedContent"}
            ariaLabel={"Toggle navigation"}
            color={"white"}
            hoverColor={"#8B9A61"}
            title={
              <svg
                className="w-6 h-6 text-gray-800 dark:text-white"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M5 7h14M5 12h14M5 17h14"
                />
              </svg>
            }
          />
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav w-100 d-flex justify-content-between align-items-center">
              <li className="nav-item m-4 mx-auto">{children[0]}</li>
              <li className="nav-item">
                <ViewCart
                  cartItems={cartItems}
                  removeItemFromCart={removeItem}
                />
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}

//WHEN CLICKED, VIEW THE ITEMS INSIDE THE CART

function ViewCart({ cartItems, removeItemFromCart }) {
  const [visibility, setVisibility] = useState("none");
  const [totalCheckoutPrice, setTotalCheckoutPrice] = useState(0);

  function handleClick() {
    setVisibility(visibility === "none" ? "block" : "none");
  }

  function calculateCheckoutPrice() {
    const totalPrice = cartItems.reduce((accumulator, item) => {
      return accumulator + Number(item.total_item_price);
    }, 0);
    setTotalCheckoutPrice(totalPrice);
  }

  useEffect(() => {
    calculateCheckoutPrice();
  }, [cartItems]);

  return (
    <>
      <NavBarButton
        handleClick={handleClick}
        title={"View your cart"}
        className={"btn mx-5"}
        color={"white"}
        hoverColor={"#8B9A61"}
      />
      <CartList
        cartItemsLength={cartItems.length}
        visibility={visibility}
        handleClick={handleClick}
        totalCheckoutPrice={totalCheckoutPrice}
      >
        {cartItems.map((cartItem, index) => (
          <CardListItem
            key={index}
            cartItemId={cartItem.product_id}
            cartItemImg={cartItem.product_img}
            cartItemName={cartItem.product_name}
            cartItemQuantity={cartItem.item_quantity}
            cartItemTotalPrice={cartItem.total_item_price}
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
    position: "fixed",
    right: "0",
    top: "0",
    zIndex: "1",
    backgroundColor: "white",
    boxShadow: "0px 100px 100px rgba(0, 0, 0, 0.5)",
    overflowY: "auto",
    color: "#adc178",
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
