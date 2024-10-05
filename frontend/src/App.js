import React, { useEffect, useReducer } from "react";
import axios from "axios";
import CardGrid from "./components/CardGrid";
import Card from "./components/Card";
import NavBar from "./components/NavBar";
import CategoryGrid from "./components/CategoryGrid";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import Title from "./components/Title";
import SortProductsButtons from "./components/SortProductsButtons";
import useStoreProducts from "./hooks/useStoreProducts";
import useCartItems from "./hooks/useCartItems";

// REDUCER FUNCTION FOR CART ITEMS
const cartReducer = (state, action) => {
  switch (action.type) {
    case "setCartItems":
      return action.payLoad;
    case "addItem":
      const existingProduct = state.find(
        (item) => item.product_id === action.payLoad.product_id
      );
      if (existingProduct) {
        return state.map((item) =>
          item.product_id === action.payLoad.product_id
            ? {
                ...item,
                item_quantity: item.item_quantity + action.payLoad.item_quantity,
                total_item_price:
                  (item.item_quantity + action.payLoad.item_quantity) *
                  item.product_price,
              }
            : item
        );
      }

      return [...state, action.payLoad];

    case "removeItem":
      return state.filter((item) => item.product_id !== action.payLoad);
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
  const { fetchedCartItems } = useCartItems();

  const [cartItems, cartDispatch] = useReducer(cartReducer, fetchedCartItems);
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

  // LOAD ALL CART ITEMS
  useEffect(() => {
    if (fetchedCartItems.length > 0) {
      cartDispatch({ type: "setCartItems", payLoad: fetchedCartItems });
      console.log(cartItems);
    }
  }, [fetchedCartItems]);

  // HANDLING CART ITEMS
  async function addItemToCart(id, itemQuantity) {
    const productToAdd = storeProducts.find(
      (product) => product.product_id === id
    );
    if (productToAdd) {

      const product_img = productToAdd.product_img;
      const product_name = productToAdd.product_name;
      const product_price = productToAdd.product_price;

      const newItem = {
        product_img,
        product_name,
        product_price,
        product_id: productToAdd.product_id,
        item_quantity : itemQuantity,
        total_item_price: productToAdd.product_price * itemQuantity,
      };

      cartDispatch({ type: "addItem", payLoad: newItem });

      try{
        await axios.post("http://localhost:5000/api/cartItems", newItem);
        console.log("Saved to database successfully!");
      }
      catch(error){
        console.error("Error saving item to cart database: ", error);
      }
    }
  }

  async function removeItemFromCart(cartItemId) {
    cartDispatch({ type: "removeItem", payLoad: cartItemId });
    try{
      await axios.delete(`http://localhost:5000/api/cartItems/${cartItemId}`);
    }
    catch(error){
      console.error("Error deleting item from cart database: ", error);
    }
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
