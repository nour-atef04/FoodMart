import { useState, useEffect } from "react";
import axios from "axios";

const useStoreProducts = () => {
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await axios.get("http://localhost:5000/api/storeProducts");
        setStoreProducts(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return {storeProducts, loading, error};

};

export default useStoreProducts;
