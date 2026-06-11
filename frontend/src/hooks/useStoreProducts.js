import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useStoreProducts = (search = "", category = "", page = 1) => {
  const [storeProducts, setStoreProducts] = useState([]);
  const [pagination, setPagination] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {
        search: search.trim(),
        category: category.trim(),
        page: page, 
        limit: 10, 
      };

      const response = await axios.get("http://localhost:5000/api/storeProducts", {
        params,
      });

      setStoreProducts(response.data.products);
      setPagination(response.data.pagination);

    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]); 

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { 
    storeProducts, 
    pagination, 
    loading, 
    error, 
    refetchStoreProducts: fetchProducts 
  };
};

export default useStoreProducts;