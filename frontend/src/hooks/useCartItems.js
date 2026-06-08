import { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { AuthContext } from "../components/AuthContext";

const useCartItems = () => {
  const { currentUser } = useContext(AuthContext);

  const [fetchedCartItems, setFetchedCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCartItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!currentUser || currentUser.role !== "customer") {
      setFetchedCartItems([]);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/api/cartItems");
      setFetchedCartItems(response.data);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  return { fetchedCartItems, loading, error, refetchCartItems: fetchCartItems };
};

export default useCartItems;
