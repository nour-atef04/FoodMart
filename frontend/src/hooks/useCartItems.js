import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../components/AuthContext";

const useCartItems = () => {

  const { currentUser } = useContext(AuthContext);
  const user_id = currentUser?.user_id;

  const [fetchedCartItems, setFetchedCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user_id) {
    async function fetchProducts() {
      try {
        const response = await axios.get(`http://localhost:5000/api/cartItems/${user_id}`);
        setFetchedCartItems(response.data);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }
  }, [user_id]);

  return {fetchedCartItems, loading, error};

};

export default useCartItems;