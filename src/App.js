import React, { useState } from "react";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";

// AVAILABLE STORE PRODUCTS
const storeProducts = [
  {
    productImg:
      "https://www.goodfruit.com/wp-content/uploads/snowflakeApple.jpg",
    productName: "Red Apples",
    productPrice: "19.00",
  },
  {
    productImg:
      "https://media.istockphoto.com/id/1184345169/photo/banana.jpg?s=612x612&w=0&k=20&c=NdHyi6Jd9y1855Q5mLO2tV_ZRnaJGtZGCSMMT7oxdF4=",
    productName: "Bananas",
    productPrice: "24.00",
  },
  {
    productImg:
      "https://st2.depositphotos.com/16122460/42446/i/450/depositphotos_424463870-stock-photo-jug-glass-fresh-milk-white.jpg",
    productName: "Milk",
    productPrice: "15.50",
  },
  {
    productImg:
      "https://img.freepik.com/premium-photo/eggs-with-white-background-high-quality-ultra-hd_670382-89857.jpg",
    productName: "Eggs",
    productPrice: "2.00",
  },
  {
    productImg:
      "https://img.freepik.com/premium-photo/potato-chips-white-background_55883-8452.jpg",
    productName: "Chips",
    productPrice: "5.50",
  },
];

function App() {
  // ITEMS ADDED TO THE CART BY USER
  const [cartItems, setCartItems] = useState([]);

  // ADD ITEMS SELECTED BY USER TO CART
  function addItemToCart(id, itemQuantity) {
    const item = {
      ...storeProducts[id],
      itemQuantity,
      totalItemPrice: storeProducts[id].productPrice * itemQuantity,
    };
    setCartItems((prevItems) => [...prevItems, item]);
  }

  function removeItemFromCart(cartItemId) {
    setCartItems((prevItems) =>
      prevItems.filter((_, index) => index !== cartItemId)
    );
  }

  return (
    <div>
      <NavBar cartItems={cartItems} removeItemFromCart={removeItemFromCart} />

      <CardGrid storeProducts={storeProducts}>
        {/* CREATE A CARD FOR EACH STORE ITEM */}
        {storeProducts.map((storeProduct, index) => (
          <div className="col" key={index}>
            <Card
              storeProductId={index}
              storeProductImg={storeProduct.productImg}
              storeProductName={storeProduct.productName}
              storeProductPrice={storeProduct.productPrice}
              addItemToCart={addItemToCart}
            />
          </div>
        ))}
      </CardGrid>
    </div>
  );
}

export default App;
