import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import NavBar from "./NavBar";
import Footer from "./Footer";
import CardGrid from "./CardGrid";
import Card from "./Card";
import NavBarButton from "./MyButton";
import useCartItems from "../hooks/useCartItems";
import useStoreProducts from "../hooks/useStoreProducts";
import Title from "./Title";

const API_BASE_URL = "http://localhost:5000";

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { fetchedCartItems } = useCartItems();
  const { refetchStoreProducts } = useStoreProducts();
  const [cartItems, setCartItems] = useState([]);
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    setCartItems(fetchedCartItems);
  }, [fetchedCartItems]);

  async function removeItemFromCart(cartItemId) {
    try {
      await axios.delete(`${API_BASE_URL}/api/cartItems/${cartItemId}`);
      const refreshed = await axios.get(`${API_BASE_URL}/api/cartItems`);
      setCartItems(refreshed.data);
    } catch (requestError) {
      console.error("Error deleting item from cart database:", requestError);
    }
  }

  const loadProductData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError("");

      const [productResponse, similarResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/storeProducts/${productId}`),
        axios.get(`${API_BASE_URL}/api/recommendations/product/${productId}`),
      ]);

      setProduct(productResponse.data);
      setSimilarProducts(similarResponse.data || []);
    } catch (requestError) {
      console.error("Error loading product details:", requestError);
      setError("We could not load this product right now.");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadProductData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function addItemToCart(id, itemQuantity) {
    const targetProduct =
      product?.product_id === id
        ? product
        : similarProducts.find(
            (similarProduct) => similarProduct.product_id === id,
          );

    if (!targetProduct) {
      return;
    }

    const availableStock = Number(targetProduct.stock_quantity) || 0;
    const currentCartItem = cartItems.find((item) => item.product_id === id);
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

    const newItem = {
      product_img: targetProduct.product_img || targetProduct.image_url,
      product_name: targetProduct.product_name || targetProduct.name,
      product_price: targetProduct.product_price || targetProduct.price,
      product_id: id,
      item_quantity: requestedQuantity,
      total_item_price:
        Number(targetProduct.product_price || targetProduct.price) * requestedQuantity,
    };

    try {
      await axios.post(`${API_BASE_URL}/api/cartItems`, newItem);
      const refreshed = await axios.get(`${API_BASE_URL}/api/cartItems`);
      setCartItems(refreshed.data);
    } catch (requestError) {
      if (requestError.response?.status === 409) {
        alert(
          requestError.response.data.message || "Not enough stock available",
        );
        return;
      }
      console.error("Error saving item to cart database:", requestError);
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) {
      return;
    }

    try {
      setIsCheckingOut(true);
      await axios.post(`${API_BASE_URL}/api/checkout`);
      setCartItems([]);
      await refetchStoreProducts();
      await loadProductData(false);
      alert("Checkout complete. Your cart has been cleared.");
    } catch (error) {
      if (error.response?.status === 409) {
        alert(error.response.data.message || "Some products are out of stock");
        await refetchStoreProducts();
        await loadProductData(false);
        return;
      }

      console.error("Checkout error:", error);
      alert("Checkout failed. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  function handleQuantityChange(delta) {
    const maxQuantity = Math.max(0, stockLabel ?? 0);

    setQuantity((currentQuantity) => {
      if (maxQuantity <= 0) {
        return 0;
      }

      const nextQuantity = currentQuantity + delta;
      return Math.min(maxQuantity, Math.max(1, nextQuantity));
    });
  }

  const stockLabel = useMemo(() => {
    if (!product) {
      return null;
    }

    const stockValue = Number(product.stock_quantity);
    if (Number.isFinite(stockValue)) {
      return stockValue;
    }

    return null;
  }, [product]);

  const availableStock = Math.max(0, stockLabel ?? 0);

  useEffect(() => {
    setQuantity(stockLabel && stockLabel > 0 ? 1 : 0);
  }, [stockLabel]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F3F1EB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#7C8B54",
        }}
      >
        Loading product details...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#F3F1EB",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          color: "#58473C",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#7C8B54" }}>Product not available</h2>
        <p>{error || "We could not find that product."}</p>
        <NavBarButton
          handleClick={() => navigate("/store")}
          title={"Back to Store"}
          className={"btn"}
          color={"#adc178"}
          hoverColor={"#8B9A61"}
        />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#F3F1EB", minHeight: "100vh" }}>
      <NavBar
        cartItems={cartItems}
        removeItemFromCart={removeItemFromCart}
        handleCheckout={handleCheckout}
        checkoutLoading={isCheckingOut}
        role="customer"
        addItemToCart={addItemToCart}
      >
        <div />
        <Title handleTitleClick={() => navigate("/store")} />
      </NavBar>

      <div className="container py-5">
        <NavBarButton
          handleClick={() => navigate("/store")}
          title={"Back to Store"}
          className={"btn mb-4"}
          color={"#adc178"}
          hoverColor={"#8B9A61"}
        />

        <div
          className="row g-4 align-items-stretch"
          style={{ color: "#58473C" }}
        >
          <div className="col-lg-6">
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 18px 45px rgba(88, 71, 60, 0.12)",
                height: "100%",
              }}
            >
              <img
                src={product.product_img}
                alt={product.product_name}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "420px",
                    objectFit: "cover",
                  filter: availableStock === 0 ? "grayscale(100%)" : "none",
                  opacity: availableStock === 0 ? 0.5 : 1,
                  }}
              />
            </div>
          </div>

          <div className="col-lg-6">
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "20px",
                padding: "32px",
                boxShadow: "0 18px 45px rgba(88, 71, 60, 0.12)",
                height: "100%",
              }}
            >
              <p style={{ color: "#7C8B54", letterSpacing: "0.08em" }}>
                {product.product_category}
              </p>
              <h1
                style={{
                  fontFamily: '"Playwrite CU", cursive',
                  color: "#58473C",
                  marginBottom: "16px",
                }}
              >
                {product.product_name}
              </h1>
              <h2 style={{ color: "#adc178", marginBottom: "20px" }}>
                ${Number(product.product_price).toFixed(2)}
              </h2>
              <p style={{ lineHeight: 1.8, fontSize: "1.02rem" }}>
                {product.product_description || "No description available."}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginTop: "24px",
                  marginBottom: "24px",
                }}
              >
                <span
                  style={{
                    backgroundColor: "#F3F1EB",
                    color: "#58473C",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    fontWeight: 600,
                  }}
                >
                  {stockLabel === null
                    ? "Stock info unavailable"
                    : stockLabel > 0
                      ? `${stockLabel} in stock`
                      : "Out of stock"}
                </span>
                <span
                  style={{
                    backgroundColor: "#F3F1EB",
                    color: "#58473C",
                    padding: "10px 14px",
                    borderRadius: "999px",
                    fontWeight: 600,
                  }}
                >
                  Product ID: {product.product_id}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    border: "1px solid #d8dfc8",
                    borderRadius: "12px",
                    padding: "8px 12px",
                  }}
                >
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => handleQuantityChange(-1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#58473C",
                    }}
                    disabled={availableStock === 0}
                  >
                    -
                  </button>
                  <span style={{ minWidth: "24px", textAlign: "center" }}>
                    {availableStock === 0 ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => handleQuantityChange(1)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#58473C",
                    }}
                    disabled={availableStock === 0 || quantity >= availableStock}
                  >
                    +
                  </button>
                </div>

                <button
                  className="btn"
                  onClick={() => addItemToCart(product.product_id, quantity)}
                  style={{
                    backgroundColor: "#adc178",
                    
                    color: "white",
                    padding: "12px 20px",
                    borderRadius: "10px",
                  }}
                  disabled={availableStock === 0}
                >
                  {availableStock === 0 ? "Out of stock" : "Add To Cart"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: "48px",
            backgroundColor: "white",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 18px 45px rgba(88, 71, 60, 0.08)",
          }}
        >
          <h3 style={{ color: "#58473C", marginBottom: "18px" }}>
            Similar Products
          </h3>

          {similarProducts.length === 0 ? (
            <p style={{ color: "#7C8B54", marginBottom: 0 }}>
              No similar products available right now.
            </p>
          ) : (
            <CardGrid>
              {similarProducts.map((similarProduct) => {
                return (
                  <div className="col" key={similarProduct.product_id}>
                    <Card
                      storeProductId={similarProduct.product_id}
                      storeProductImg={
                        similarProduct.product_img || similarProduct.image_url
                      }
                      storeProductName={
                        similarProduct.product_name || similarProduct.name
                      }
                      storeProductPrice={
                        similarProduct.product_price || similarProduct.price
                      }
                      stockQuantity={similarProduct.stock_quantity}
                      addItemToCart={addItemToCart}
                    />
                  </div>
                );
              })}
            </CardGrid>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
