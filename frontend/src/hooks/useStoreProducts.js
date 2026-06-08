import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useStoreProducts = (search = "", category = "") => {
  const [storeProducts, setStoreProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (category.trim()) {
        params.category = category.trim();
      }

      const response = await axios.get("http://localhost:5000/api/storeProducts", {
        params,
      });
      setStoreProducts(response.data);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { storeProducts, loading, error, refetchStoreProducts: fetchProducts };
};

export default useStoreProducts;
