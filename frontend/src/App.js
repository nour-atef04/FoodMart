import React, { useEffect, useReducer } from "react";
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

// REDUCER FUNCTION FOR PRODUCTS DISPLAYED
const productsReducer = (state, action) => {
  switch (action.type) {
    case "setProducts":
      return {
        ...state,
        productsToDisplay: action.payLoad,
        backupProducts: action.payLoad,
        searched: null,
      };
    case "filterProducts":
      return {
        ...state,
        productsToDisplay: action.payLoad,
        backupProducts: action.payLoad,
        searched: false,
      };
    case "searchProducts":
      return {
        ...state,
        productsToDisplay: action.payLoad,
        backupProducts: action.payLoad,
        searched: action.search,
      };
    case "sortProducts":
      return {
        ...state,
        productsToDisplay: action.payLoad,
      };
    case "unsortProducts":
      return {
        ...state,
        productsToDisplay: state.backupProducts,
      };
    default:
      return new Error("unknown operation!");
  }
};

function App() {
  const { storeProducts } = useStoreProducts(); // CUSTOM HOOK TO GET STORE PRODUCTS FROM DATABASE
  const [cartItems, cartDispatch] = useReducer(cartReducer, []);
  const [{ productsToDisplay, searched }, productsDispatch] = useReducer(
    productsReducer,
    {
      productsToDisplay: storeProducts, // PRODUCTS CURRENTLY IN DISPLAY
      backupProducts: storeProducts, // BACKUP FOR UNSORTING
      searched: null, // CHECK IF USER ENTERED IN SEARCH
    }
  );

  // LOAD ALL STORE PRODUCTS
  useEffect(() => {
    if (storeProducts.length > 0) {
      productsDispatch({ type: "setProducts", payLoad: storeProducts });
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
    const filteredProducts = storeProducts.filter(
      (storeProduct) => storeProduct.product_category === category
    );

    productsDispatch({ type: "filterProducts", payLoad: filteredProducts });
  }

  function searchStoreProducts(search) {
    if (search) {
      const searchedProducts = storeProducts.filter(
        (storeProduct) =>
          storeProduct.product_category.toLowerCase() ===
            search.toLowerCase() ||
          storeProduct.product_name.toLowerCase() === search.toLowerCase()
      );
      productsDispatch({
        type: "searchProducts",
        payLoad: searchedProducts,
        search,
      });
    }
  }

  // SORT PRODUCTS BY USER'S CHOICE
  function unsortProducts() {
    productsDispatch({ type: "unsortProducts" });
  }

  function sortPricesHighToLow() {
    const sortedProducts = [...productsToDisplay].sort(
      (a, b) => b.product_price - a.product_price
    );
    productsDispatch({ type: "sortProducts", payLoad: sortedProducts });
  }

  function sortPricesLowToHigh() {
    const sortedProducts = [...productsToDisplay].sort(
      (a, b) => a.product_price - b.product_price
    );
    productsDispatch({ type: "sortProducts", payLoad: sortedProducts });
  }

  return (
    <div>
      <NavBar cartItems={cartItems} removeItemFromCart={removeItemFromCart}>
        <SearchBar searchStoreProducts={searchStoreProducts} />
        <Title
          handleTitleClick={() => {
            productsDispatch({ type: "setProducts", payLoad: storeProducts });
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
