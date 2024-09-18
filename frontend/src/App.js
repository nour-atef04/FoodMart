import React, { useState, useEffect, useReducer } from "react";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";
import CategoryGrid from "./components/CategoryGrid";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import Title from "./components/Title";
import SortProductsButtons from "./components/SortProductsButtons";
import useStoreProducts from "./hooks/useStoreProducts";

// REDUCER FUNCTION FOR CART ITEMS
const cartReducer = (state, action) => {
  switch (action.type) {

    case "addItem":
      const existingProduct = state.find(
        (item) => item.product_id === action.payLoad.product_id
      );
      if (existingProduct) {
        return state.map((item) =>
          item.product_id === action.payLoad.product_id
            ? {
                ...item,
                itemQuantity: item.itemQuantity + action.payLoad.itemQuantity,
                totalItemPrice:
                  (item.itemQuantity + action.payLoad.itemQuantity) *
                  item.product_price,
              }
            : item
        );
      }
      return [...state, action.payLoad];

    case "removeItem":
      return state.filter((_, index) => index !== action.payLoad);
    default:
      return new Error("unknown operation!");
  }
};

function App() {
  const { storeProducts } = useStoreProducts(); // CUSTOM HOOK TO GET STORE PRODUCTS FROM DATABASE
  const [productsToDisplay, setProductsToDisplay] = useState(storeProducts); // PRODUCTS CURRENTLY IN DISPLAY
  const [backupProducts, setBackupProducts] = useState(storeProducts); // BACKUP FOR UNSORTING
  const [searched, setSearched] = useState(null);

  const [cartItems, cartDispatch] = useReducer(cartReducer, []); 

  useEffect(() => {
    if (storeProducts.length > 0) {
      setProductsToDisplay(storeProducts);
      setBackupProducts(storeProducts);
    }
  }, [storeProducts]);

  // HANDLING CART ITEMS
  function addItemToCart(id, itemQuantity) {
    const productToAdd = storeProducts.find(
      (product) => product.product_id === id
    );
    if (productToAdd) {
      const newItem = {
        ...productToAdd,
        itemQuantity,
        totalItemPrice: productToAdd.product_price * itemQuantity,
      };
      cartDispatch({ type: "addItem", payLoad: newItem });
    }

  }

  function removeItemFromCart(cartItemId) {
    cartDispatch({ type: "removeItem", payLoad: cartItemId });
  }

  //FILTER AND SEARCHING
  function filterStoreProducts(category) {
    setSearched(false);
    const filteredProducts = storeProducts.filter(
      (storeProduct) => storeProduct.product_category === category
    );
    setProductsToDisplay(filteredProducts);
    setBackupProducts(filteredProducts);
  }

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
