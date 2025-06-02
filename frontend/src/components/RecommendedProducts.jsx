import React, { useState, useEffect } from "react";

export default function RecommendedProducts({ cartItems, addToCart }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        //console.log("Fetching recommendations for cart items:", cartItems);

        const response = await fetch(
          "http://localhost:5000/api/recommendations/cart-recommendations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cartItems }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch recommendations");
        }

        const data = await response.json();
        //console.log("Received recommendations:", data);
        setRecommendations(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have cart items
    if (cartItems && cartItems.length > 0) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [cartItems]);

  const recommendationStyle = {
    maxWidth: "80%",
    marginLeft: "10%",
    marginTop: "20px",
    marginBottom: "20px",
  };

  if (loading) {
    return (
      <div style={recommendationStyle}>
        <h3 style={{ color: "grey", marginBottom: "15px" }}>
          Recommended For You
        </h3>
        <div style={{ textAlign: "center", color: "grey" }}>
          Loading recommendations...
        </div>
      </div>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div style={recommendationStyle}>
      <h3 style={{ color: "grey", marginBottom: "15px" }}>
        Recommended For You
      </h3>
      <div
        style={{
          display: "flex",
          gap: "15px",
          overflowX: "auto",
          paddingBottom: "10px",
        }}
      >
        {recommendations.map((product) => (
          <div
            key={product.product_id}
            style={{
              minWidth: "150px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              backgroundColor: "white",
            }}
          >
            <img
              src={product.image_url}
              alt={product.name}
              style={{
                width: "100%",
                height: "100px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
            <h5
              style={{ fontSize: "0.9rem", margin: "8px 0", color: "#adc178" }}
            >
              {product.name}
            </h5>
            <p style={{ fontSize: "0.8rem", color: "grey", margin: "0" }}>
              ${Number(product.price).toFixed(2)}
            </p>
            <button
              className="btn btn-sm"
              style={{
                backgroundColor: "#adc178",
                color: "white",
                width: "100%",
                marginTop: "8px",
                fontSize: "0.8rem",
              }}
              onClick={() => addToCart(product.product_id, 1)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
