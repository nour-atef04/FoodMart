import React, { useEffect, useReducer } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "";
  const activeFilter = searchQuery || categoryQuery;

  const { storeProducts, refetchStoreProducts } = useStoreProducts(
    searchQuery,
    categoryQuery,
  ); // CUSTOM HOOK TO GET STORE PRODUCTS FROM DATABASE
  const { fetchedCartItems } = useCartItems();

  const [cartItems, cartDispatch] = useReducer(cartReducer, fetchedCartItems);
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);
  const [{ productsToDisplay }, productsDispatch] = useReducer(
    productsReducer,
    {
      productsToDisplay: storeProducts, // PRODUCTS CURRENTLY IN DISPLAY
      backupProducts: storeProducts, // BACKUP FOR UNSORTING
    }
  );

  // LOAD ALL STORE PRODUCTS
  useEffect(() => {
    productsDispatch({ type: "setProducts", payLoad: storeProducts });
  }, [storeProducts]);

  // LOAD ALL CART ITEMS
  useEffect(() => {
    cartDispatch({ type: "setCartItems", payLoad: fetchedCartItems });
  }, [fetchedCartItems]);

  // HANDLING CART ITEMS
  async function addItemToCart(id, itemQuantity) {
    const productToAdd = storeProducts.find(
      (product) => product.product_id === id
    );
    if (productToAdd) {
      const availableStock = Number(productToAdd.stock_quantity) || 0;
      const currentCartItem = cartItems.find(
        (item) => item.product_id === productToAdd.product_id
      );
      const currentCartQuantity = currentCartItem
        ? Number(currentCartItem.item_quantity) || 0
        : 0;
      const requestedQuantity = Number(itemQuantity) || 0;
      const remainingStock = availableStock - currentCartQuantity;

      if (availableStock <= 0) {
        alert("This product is out of stock.");
        return;
      }

      if (requestedQuantity > remainingStock) {
        alert("You cannot add more than the available stock.");
        return;
      }

      const product_img = productToAdd.product_img;
      const product_name = productToAdd.product_name;
      const product_price = productToAdd.product_price;

      const newItem = {
        product_img,
        product_name,
        product_price,
        product_id: productToAdd.product_id,
        item_quantity: requestedQuantity,
        total_item_price: productToAdd.product_price * requestedQuantity,
      };

      try {
        await axios.post("http://localhost:5000/api/cartItems", newItem);
        cartDispatch({ type: "addItem", payLoad: newItem });
        console.log("Saved to database successfully!");
      } catch (error) {
        if (error.response?.status === 409) {
          alert(error.response.data.message || "Not enough stock available");
          return;
        }
        console.error("Error saving item to cart database: ", error);
      }
    }
  }

  async function removeItemFromCart(cartItemId) {
    try {
      await axios.delete(`http://localhost:5000/api/cartItems/${cartItemId}`);
      cartDispatch({ type: "removeItem", payLoad: cartItemId });
    } catch (error) {
      console.error("Error deleting item from cart database: ", error);
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    try {
      setIsCheckingOut(true);
      await axios.post("http://localhost:5000/api/checkout");
      cartDispatch({ type: "setCartItems", payLoad: [] });
      await refetchStoreProducts();
      alert("Checkout complete. Your cart has been cleared.");
    } catch (error) {
      if (error.response?.status === 409) {
        alert(error.response.data.message || "Some products are out of stock");
        await refetchStoreProducts();
        return;
      }

      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  // FILTER AND SEARCHING
  function updateQueryParams(nextParams) {
    const nextSearchParams = new URLSearchParams(searchParams);

    Object.entries(nextParams).forEach(([key, value]) => {
      if (value && value.trim()) {
        nextSearchParams.set(key, value.trim());
      } else {
        nextSearchParams.delete(key);
      }
    });

    setSearchParams(nextSearchParams, { replace: true });
  }

  function searchStoreProducts(search) {
    updateQueryParams({ search, category: "" });
  }

  function filterStoreProducts(category) {
    updateQueryParams({ category, search: "" });
  }

  function clearFilters() {
    setSearchParams({}, { replace: true });
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
      <NavBar
        cartItems={cartItems}
        removeItemFromCart={removeItemFromCart}
        handleCheckout={handleCheckout}
        checkoutLoading={isCheckingOut}
        role="customer"
        addItemToCart={addItemToCart}
      >
        <SearchBar
          searchValue={searchQuery}
          onSearch={searchStoreProducts}
        />
        <Title
          handleTitleClick={() => {
            clearFilters();
          }}
        />
      </NavBar>
      <CategoryGrid
        activeFilter={activeFilter}
        filterStoreProducts={filterStoreProducts}
      />
      <SortProductsButtons
        unsortProducts={unsortProducts}
        sortPricesLowToHigh={sortPricesLowToHigh}
        sortPricesHighToLow={sortPricesHighToLow}
      />
      <CardGrid storeProducts={storeProducts}>
        {productsToDisplay.map((storeProduct, index) => (
          <div className="col" key={storeProduct.product_id}>
            <Card
              storeProductId={storeProduct.product_id}
              storeProductImg={storeProduct.product_img}
              storeProductName={storeProduct.product_name}
              storeProductPrice={storeProduct.product_price}
              stockQuantity={storeProduct.stock_quantity}
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
