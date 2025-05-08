import React, { useEffect, useReducer, useContext } from "react";
import axios from "axios";
import CardGrid from "./CardGrid";
import Card from "./Card";
import NavBar from "./NavBar";
import CategoryGrid from "./CategoryGrid";
import Footer from "./Footer";
import SearchBar from "./SearchBar";
import Title from "./Title";
import SortProductsButtons from "./SortProductsButtons";
import useStoreProducts from "../hooks/useStoreProducts";
import useCartItems from "../hooks/useCartItems";
import { AuthContext } from "./AuthContext";

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
                item_quantity:
                  item.item_quantity + action.payLoad.item_quantity,
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
      throw new Error(`Unknown action type: ${action.type}`);
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
      throw new Error("Invalid operation!");
  }
};

function Store() {
  //console.log("id: " + user_id);

  const { currentUser } = useContext(AuthContext); // Get currentUser from context
  const user_id = currentUser?.user_id;

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
    }
  }, [fetchedCartItems]);

  // HANDLING CART ITEMS
  async function addItemToCart(id, itemQuantity) {

    if (!user_id) {
      alert("Please login to add items to cart");
      return;
    }

    const productToAdd = storeProducts.find(
      (product) => product.product_id === id
    );
    if (productToAdd) {
      const product_img = productToAdd.product_img;
      const product_name = productToAdd.product_name;
      const product_price = productToAdd.product_price;

      const newItem = {
        user_id,
        product_img,
        product_name,
        product_price,
        product_id: productToAdd.product_id,
        item_quantity: itemQuantity,
        total_item_price: productToAdd.product_price * itemQuantity,
      };

      cartDispatch({ type: "addItem", payLoad: newItem });

      try {
        await axios.post("http://localhost:5000/api/cartItems", newItem);
        console.log("Saved to database successfully!");
      } catch (error) {
        console.error("Error saving item to cart database: ", error);
      }
    }
  }

  async function removeItemFromCart(cartItemId) {

    if (!user_id) return;

    cartDispatch({ type: "removeItem", payLoad: cartItemId });
    try {
      await axios.delete(`http://localhost:5000/api/cartItems/${user_id}/${cartItemId}`);
    } catch (error) {
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

export default Store;
