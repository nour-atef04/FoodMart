import React, { useState, useEffect } from "react";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";
import CategoryGrid from "./components/CategoryGrid";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import Title from "./components/Title";
import SortProductsButtons from "./components/SortProductsButtons";
import useStoreProducts from "./hooks/useStoreProducts";

function App() {
  const { storeProducts, loading, error } = useStoreProducts();
  const [cartItems, setCartItems] = useState([]);
  const [productsToDisplay, setProductsToDisplay] = useState(storeProducts); // Products currently displayed
  const [backupProducts, setBackupProducts] = useState(storeProducts); // Backup for unsorting

  useEffect(() => {
    if (storeProducts.length > 0) {
      setProductsToDisplay(storeProducts);
      setBackupProducts(storeProducts);
    }
  }, [storeProducts]);


  function addItemToCart(id, itemQuantity) {
    const existingProduct = cartItems.find((item) => item.product_id === id);

    if (existingProduct) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.product_id === id
            ? {
                ...item,
                itemQuantity: item.itemQuantity + itemQuantity,
                totalItemPrice:
                  (item.itemQuantity + itemQuantity) * item.product_price,
              }
            : item
        )
      );
    } else {
      const productToAdd = storeProducts.find(
        (product) => product.product_id === id
      );
      
      const newItem = {
        ...productToAdd,
        itemQuantity,
        totalItemPrice: productToAdd.product_price * itemQuantity,
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
      (storeProduct) => storeProduct.product_category === category
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
          storeProduct.product_category.toLowerCase() ===
            search.toLowerCase() ||
          storeProduct.product_name.toLowerCase() === search.toLowerCase()
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
      (a, b) => b.product_price - a.product_price
    );
    setProductsToDisplay(sortedProducts);
  }

  function sortPricesLowToHigh() {
    const sortedProducts = [...productsToDisplay].sort(
      (a, b) => a.product_price - b.product_price
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
              storeProductId={storeProduct.product_id}
              storeProductImg={storeProduct.product_img}
              storeProductName={storeProduct.product_name}
              storeProductPrice={storeProduct.product_price}
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
