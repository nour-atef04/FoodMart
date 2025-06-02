import React, { useState, useEffect } from "react";
import "../components/CSS/ControlPanel.css";
import axios from "axios";

export default function ControlPanel() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    product_name: "",
    product_description: "",
    product_price: "",
    product_category: "",
    product_img: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/storeProducts")
      .then((response) => {
        setProducts(response.data);
      })
      .catch((error) => {
        console.error("Error fetching products", error);
      });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Submitting form data:", formData);

    const apiUrl = editingId
      ? `http://localhost:5000/api/storeProducts/${editingId}`
      : "http://localhost:5000/api/storeProducts";
    const method = editingId ? "PUT" : "POST";

    axios({
      method,
      url: apiUrl,
      data: formData,
    })
      .then((response) => {
        if (editingId) {
          // Update existing product in the list
          setProducts(
            products.map((product) =>
              product.product_id === editingId ? response.data.product : product
            )
          );
        } else {
          // Add new product to the list
          setProducts([...products, response.data.product]);
        }

        // Reset form and show success message
        resetForm();
        setSuccessMessage(
          editingId
            ? "Product updated successfully!"
            : "Product added successfully!"
        );

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      })
      .catch((error) => {
        console.error("Error submitting product data", error);
        alert(
          "An error occurred while submitting the product. Please try again."
        );
      });
  };

  const handleEdit = (product) => {
    setFormData({
      product_name: product.product_name,
      product_description: product.product_description,
      product_price: product.product_price.toString(),
      product_category: product.product_category,
      product_img: product.product_img,
    });
    setEditingId(product.product_id);
  };

  const handleDelete = (id) => {
    axios
      .delete(`http://localhost:5000/api/storeProducts/${id}`)
      .then(() => {
        setProducts(products.filter((product) => product.product_id !== id));
      })
      .catch((error) => {
        console.error("Error deleting product", error);
      });
  };

  const resetForm = () => {
    setFormData({
      product_name: "",
      product_description: "",
      product_price: "",
      product_category: "",
      product_img: "",
    });
    setEditingId(null);
  };

  return (
    <div className="employee-panel">
      <header className="panel-header">
        <h1>Inventory Management</h1>
        <p className="subtitle">Employee Control Panel</p>
      </header>

      <div className="panel-content">
        <section className="product-form">
          <h2>{editingId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name</label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Product Description</label>
              <input
                type="text"
                name="product_description"
                value={formData.product_description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Price ($)</label>
              <input
                type="number"
                name="product_price"
                value={formData.product_price}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                name="product_category"
                value={formData.product_category}
                onChange={handleInputChange}
                required
              >
                <option value="" disabled>
                  Select a category
                </option>{" "}
                {/* Default option */}
                <option value="Fruits">Fruits</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Dairy">Dairy</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>

            <div className="form-group">
              <label>Product Image URL</label>
              <input
                type="text"
                name="product_img"
                value={formData.product_img}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn primary">
                {editingId ? "Update" : "Add"} Product
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn secondary"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        <section className="product-list">
          <h2>Current Inventory ({products.length} items)</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <td>{product.product_name}</td>
                    <td>{product.product_category}</td>
                    <td>
                      {!isNaN(parseFloat(product.product_price)) &&
                      parseFloat(product.product_price) !== 0
                        ? "$" + parseFloat(product.product_price).toFixed(2)
                        : "N/A"}
                    </td>
                    <td>
                      <img
                        src={product.product_img}
                        alt={product.product_name}
                        width="40"
                        height="40"
                      />
                    </td>
                    <td className="actions">
                      <button
                        onClick={() => handleEdit(product)}
                        className="btn edit"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.product_id)}
                        className="btn delete"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
