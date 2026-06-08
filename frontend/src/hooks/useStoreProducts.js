import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useStoreProducts = () => {
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        "http://localhost:5000/api/storeProducts",
      );
      setStoreProducts(response.data);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { storeProducts, loading, error, refetchStoreProducts: fetchProducts };

};

export default useStoreProducts;
