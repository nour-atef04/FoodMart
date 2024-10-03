import { useState, useEffect } from "react";
import axios from "axios";

const useCartItems = () => {
  const [fetchedCartItems, setFetchedCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await axios.get("http://localhost:5000/api/cartItems");
        setFetchedCartItems(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return {fetchedCartItems, loading, error};

};

export default useCartItems;