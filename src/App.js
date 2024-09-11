import React, { useState } from "react";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";
import CategoryGrid from "./components/CategoryGrid";

// AVAILABLE STORE PRODUCTS
const storeProducts = [
  {
    productId: 1,
    productImg:
      "https://www.goodfruit.com/wp-content/uploads/snowflakeApple.jpg",
    productName: "Red Apples",
    productPrice: "19.00",
    productCategory: "Fruits",
  },
  {
    productId: 2,
    productImg:
      "https://media.istockphoto.com/id/1184345169/photo/banana.jpg?s=612x612&w=0&k=20&c=NdHyi6Jd9y1855Q5mLO2tV_ZRnaJGtZGCSMMT7oxdF4=",
    productName: "Bananas",
    productPrice: "24.00",
    productCategory: "Fruits",
  },
  {
    productId: 3,
    productImg:
      "https://st2.depositphotos.com/16122460/42446/i/450/depositphotos_424463870-stock-photo-jug-glass-fresh-milk-white.jpg",
    productName: "Milk",
    productPrice: "15.50",
    productCategory: "Dairy",
  },
  {
    productId: 4,
    productImg:
      "https://farmfreshontario.com/wp-content/uploads/2019/12/p9.jpg",
    productName: "Carrots",
    productPrice: "2.00",
    productCategory: "Vegetables",
  },
  {
    productId: 5,
    productImg:
      "https://img.freepik.com/premium-photo/potato-chips-white-background_55883-8452.jpg",
    productName: "Chips",
    productPrice: "5.50",
    productCategory: "Snacks",
  },
];

function App() {
  // ITEMS ADDED TO THE CART BY USER
  const [cartItems, setCartItems] = useState([]);

  function addItemToCart(id, itemQuantity) {
    // SEARCH FIRST IF THE PRODUCT IS ALREADY IN THE CART
    const existingProduct = cartItems.find((item) => item.productId === id);

    if (existingProduct) {
      // UPDATE QUANTITY IF ITEM EXISTS
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.productId === id
            ? {
                ...item,
                itemQuantity: item.itemQuantity + itemQuantity,
                totalItemPrice:
                  (item.itemQuantity + itemQuantity) * item.productPrice,
              }
            : item
        )
      );
    } else {
      // ADD NEW ITEM TO THE CART
      const productToAdd = storeProducts.find(
        (product) => product.productId === id
      );
      const newItem = {
        ...productToAdd,
        itemQuantity,
        totalItemPrice: productToAdd.productPrice * itemQuantity,
      };

      setCartItems((prevItems) => [...prevItems, newItem]);
    }
  }

  // REMOVE ITEMS SELECTED BY USER FROM CART
  function removeItemFromCart(cartItemId) {
    setCartItems((prevItems) =>
      prevItems.filter((_, index) => index !== cartItemId)
    );
  }

  // FILTER THE STORE PRODUCTS BY CATEGORY CHOSEN BY THE USER

  const [filteredStoreProducts, setFilteredStoreProducts] = useState(null);

  function filterStoreProducts(category) {
    setFilteredStoreProducts(
      storeProducts.filter(
        (storeProduct) => storeProduct.productCategory === category
      )
    );
  }

  return (
    <div>
      <NavBar cartItems={cartItems} removeItemFromCart={removeItemFromCart} />
      <CategoryGrid filterStoreProducts={filterStoreProducts} />
      <CardGrid storeProducts={storeProducts}>
        {/* CREATE A CARD FOR EACH STORE ITEM */}
        {filteredStoreProducts
          ? filteredStoreProducts.map((storeProduct, index) => (
              <div className="col" key={index}>
                <Card
                  storeProductId={storeProduct.productId}
                  storeProductImg={storeProduct.productImg}
                  storeProductName={storeProduct.productName}
                  storeProductPrice={storeProduct.productPrice}
                  addItemToCart={addItemToCart}
                />
              </div>
            ))
          : storeProducts.map((storeProduct, index) => (
              <div className="col" key={index}>
                <Card
                  storeProductId={storeProduct.productId}
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
