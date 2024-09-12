import React, { useState } from "react";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";
import CategoryGrid from "./components/CategoryGrid";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import Title from "./components/Title";
import SortProductsButtons from "./components/SortProductsButtons";

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
  const [cartItems, setCartItems] = useState([]);
  const [productsToDisplay, setProductsToDisplay] = useState(storeProducts); // Products currently displayed
  const [backupProducts, setBackupProducts] = useState([...storeProducts]); // Backup for unsorting

  function addItemToCart(id, itemQuantity) {
    const existingProduct = cartItems.find((item) => item.productId === id);

    if (existingProduct) {
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

  function removeItemFromCart(cartItemId) {
    setCartItems((prevItems) =>
      prevItems.filter((_, index) => index !== cartItemId)
    );
  }

  function filterStoreProducts(category) {
    setSearched(false);
    const filteredProducts = storeProducts.filter(
      (storeProduct) => storeProduct.productCategory === category
    );
    setProductsToDisplay(filteredProducts);
    setBackupProducts(filteredProducts);
  }

  const [searched, setSearched] = useState(null);

  function searchStoreProducts(search) {
    if (search) {
      setSearched(search);
      const searchedProducts = storeProducts.filter(
        (storeProduct) =>
          storeProduct.productCategory.toLowerCase() === search.toLowerCase() ||
          storeProduct.productName.toLowerCase() === search.toLowerCase()
      );
      setProductsToDisplay(searchedProducts);
      setBackupProducts(searchedProducts);
    }
  }

  // SORT PRODUCTS BY USER'S CHOICE
  function unsortProducts() {
    setProductsToDisplay([...backupProducts]);
  }

  function sortPricesHighToLow() {
    const sortedProducts = [...productsToDisplay].sort(
      (a, b) => b.productPrice - a.productPrice
    );
    setProductsToDisplay(sortedProducts);
  }

  function sortPricesLowToHigh() {
    const sortedProducts = [...productsToDisplay].sort(
      (a, b) => a.productPrice - b.productPrice
    );
    setProductsToDisplay(sortedProducts);
  }

  return (
    <div>
      <NavBar cartItems={cartItems} removeItemFromCart={removeItemFromCart}>
        <SearchBar searchStoreProducts={searchStoreProducts} />
        <Title
          handleTitleClick={() => {
            setSearched(false);
            setProductsToDisplay(storeProducts);
            setBackupProducts(storeProducts);
          }}
        />
      </NavBar>
      <CategoryGrid
        searched={searched}
        filterStoreProducts={filterStoreProducts}
      />
      <SortProductsButtons
        unsortProducts={unsortProducts}
        sortPricesLowToHigh={sortPricesLowToHigh}
        sortPricesHighToLow={sortPricesHighToLow}
      />
      <CardGrid storeProducts={storeProducts}>
        {productsToDisplay.map((storeProduct, index) => (
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
      <Footer />
    </div>
  );
}

export default App;
