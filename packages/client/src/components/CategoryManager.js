import { useState, useEffect } from "react";
import ConfirmationModal from "./ConfirmationModal";
import MessageModal from "./MessageModal";
import ProductFormModal from "./ProductFormModal";
import CategoryFormModal from "./CategoryFormModal";
import { useMessageModal } from "../hooks/useMessageModal";

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupProducts, setGroupProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingGroupProducts, setLoadingGroupProducts] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState("");
  const [attachedSubProducts, setAttachedSubProducts] = useState([]);
  const [loadingAttachedSubProducts, setLoadingAttachedSubProducts] = useState(false);
  const [selectedGroupSubProducts, setSelectedGroupSubProducts] = useState([]);
  const [selectedAttachedSubProducts, setSelectedAttachedSubProducts] = useState([]);

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: "",
    productId: null,
    productName: "",
  });
  const { messageModal, showError, showWarning, closeModal } =
    useMessageModal();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/categories");
      const result = await response.json();
      setCategories(result.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showError(
        "Failed to load categories. Please check your connection.",
        "Connection Error"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (categoryId) => {
    if (!categoryId) {
      setProducts([]);
      return;
    }

    try {
      setLoadingProducts(true);
      const response = await fetch(
        `http://localhost:5000/api/products?category_id=${categoryId}`
      );
      const result = await response.json();
      // Filter products by category_id on client side as well to ensure only category products are shown
      const filteredProducts = (result.data || []).filter(
        (product) => product.category_id === categoryId
      );
      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching products:", error);
      showError(
        "Failed to load products. Please check your connection.",
        "Connection Error"
      );
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      // Fetch groups from the groups API endpoint
      const response = await fetch("http://localhost:5000/api/groups");
      const result = await response.json();
      setGroups(result.data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
      showError(
        "Failed to load groups. Please check your connection.",
        "Connection Error"
      );
    } finally {
      setLoadingGroups(false);
    }
  };

  const fetchGroupProducts = async (groupId) => {
    try {
      setLoadingGroupProducts(true);
      // Fetch sub-products filtered by group_id, or all if no groupId
      const url = groupId && groupId !== "all"
        ? `http://localhost:5000/api/sub-products?group_id=${groupId}`
        : `http://localhost:5000/api/sub-products`;
      const response = await fetch(url);
      const result = await response.json();
      // Filter to show only unattached sub-products (those without a product_id)
      const unattachedSubProducts = (result.data || []).filter(sp => !sp.product_id);
      setGroupProducts(unattachedSubProducts);
    } catch (error) {
      console.error("Error fetching group products:", error);
      showError(
        "Failed to load group products. Please check your connection.",
        "Connection Error"
      );
    } finally {
      setLoadingGroupProducts(false);
    }
  };

  const fetchAttachedSubProducts = async (productId) => {
    if (!productId) {
      setAttachedSubProducts([]);
      return;
    }

    try {
      setLoadingAttachedSubProducts(true);
      const response = await fetch(
        `http://localhost:5000/api/products/${productId}/sub-products`
      );
      const result = await response.json();
      setAttachedSubProducts(result.data || []);
    } catch (error) {
      console.error("Error fetching attached sub-products:", error);
      showError(
        "Failed to load attached sub-products. Please check your connection.",
        "Connection Error"
      );
    } finally {
      setLoadingAttachedSubProducts(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchProducts(selectedCategory.id);
      setSelectedProduct(null);
    } else {
      setProducts([]);
      setSelectedProduct(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  useEffect(() => {
    fetchGroupProducts(selectedGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  useEffect(() => {
    if (selectedProduct) {
      fetchAttachedSubProducts(selectedProduct.id);
    } else {
      setAttachedSubProducts([]);
    }
    setSelectedGroupSubProducts([]);
    setSelectedAttachedSubProducts([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  const handleAddCategory = async (categoryFormData) => {
    if (!categoryFormData.name) {
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:5000/api/categories/${editingCategory.id}`
        : "http://localhost:5000/api/categories";

      const response = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryFormData),
      });

      if (response.ok) {
        fetchCategories();
        setShowAddCategory(false);
        setEditingCategory(null);
      } else {
        const error = await response.json();
        showError(error.error || "Failed to save category");
      }
    } catch (error) {
      console.error("Error saving category:", error);
      showError("Error saving category. Please try again.");
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchCategories();
        closeDeleteConfirmation();
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(
          error.error || "Failed to delete category",
          "Cannot Delete Category"
        );
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      closeDeleteConfirmation();
      showError("Error deleting category. Please try again.");
    }
  };

  const openDeleteConfirmation = (category) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name,
      productId: null,
      productName: "",
    });
  };

  const openDeleteProductConfirmation = (product) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: null,
      categoryName: "",
      productId: product.id,
      productName: product.name,
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      categoryId: null,
      categoryName: "",
      productId: null,
      productName: "",
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.categoryId) {
      handleDeleteCategory(deleteConfirmation.categoryId);
    } else if (deleteConfirmation.productId) {
      handleDeleteProduct(deleteConfirmation.productId);
    }
  };

  const handleMoveUp = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${id}/move-up`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        showWarning(error.error || "Cannot move up", "Cannot Move");
      }
    } catch (error) {
      console.error("Error moving category:", error);
      showError("Error moving category. Please try again.");
    }
  };

  const handleMoveDown = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/categories/${id}/move-down`,
        {
          method: "POST",
        }
      );

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        showWarning(error.error || "Cannot move down", "Cannot Move");
      }
    } catch (error) {
      console.error("Error moving category:", error);
      showError("Error moving category. Please try again.");
    }
  };

  const handleAddProduct = async (productFormData, imageFile) => {
    try {
      const url = editingProduct
        ? `http://localhost:5000/api/products/${editingProduct.id}`
        : "http://localhost:5000/api/products";

      // Create FormData object to handle file uploads
      const formData = new FormData();

      // Append all product data to FormData
      formData.append("name", productFormData.name);
      formData.append("button_name", productFormData.button_name || "");
      formData.append("production_name", productFormData.production_name || "");
      formData.append("price", parseFloat(productFormData.price) || 0);
      formData.append(
        "vat_takeout",
        parseFloat(productFormData.vat_takeout) || 0
      );
      formData.append(
        "vat_eat_in",
        parseFloat(productFormData.vat_eat_in) || 0
      );
      formData.append("barcode", productFormData.barcode || "");
      formData.append(
        "category_id",
        productFormData.category_id
          ? parseInt(productFormData.category_id)
          : selectedCategory.id
      );
      formData.append("addition_type", productFormData.addition_type || "");
      formData.append(
        "display_index",
        parseInt(productFormData.display_index) || 0
      );
      formData.append("in_web_shop", productFormData.in_web_shop ? 1 : 0);
      formData.append("printer1", productFormData.printer1 || "");
      formData.append("printer2", productFormData.printer2 || "");
      formData.append("printer3", productFormData.printer3 || "");
      formData.append("color", productFormData.color || "#3b82f6");
      formData.append(
        "price_vat_inc",
        parseFloat(productFormData.price_vat_inc) || 0
      );
      formData.append(
        "sub_product_group",
        productFormData.sub_product_group ? 1 : 0
      );

      // Append image file if selected
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        body: formData,
      });

      if (response.ok) {
        fetchProducts(selectedCategory.id);
        setShowAddProduct(false);
        setEditingProduct(null);
      } else {
        const error = await response.json();
        showError(error.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      showError("Error saving product. Please try again.");
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowAddProduct(true);
  };

  const handleDeleteProduct = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchProducts(selectedCategory.id);
        closeDeleteConfirmation();
        setSelectedProduct(null);
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(
          error.error || "Failed to delete product",
          "Cannot Delete Product"
        );
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      closeDeleteConfirmation();
      showError("Error deleting product. Please try again.");
    }
  };

  const handleAttachSubProducts = async () => {
    if (!selectedProduct || selectedGroupSubProducts.length === 0) {
      showWarning("Please select a product and sub-products to attach.", "Selection Required");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/sub-products/assign-to-product",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_id: selectedProduct.id,
            sub_product_ids: selectedGroupSubProducts,
          }),
        }
      );

      if (response.ok) {
        await fetchAttachedSubProducts(selectedProduct.id);
        await fetchGroupProducts(selectedGroup);
        setSelectedGroupSubProducts([]);
      } else {
        const error = await response.json();
        showError(error.error || "Failed to attach sub-products");
      }
    } catch (error) {
      console.error("Error attaching sub-products:", error);
      showError("Error attaching sub-products. Please try again.");
    }
  };

  const handleDetachSubProducts = async () => {
    if (selectedAttachedSubProducts.length === 0) {
      showWarning("Please select sub-products to detach.", "Selection Required");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/sub-products/unassign-from-product",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sub_product_ids: selectedAttachedSubProducts,
          }),
        }
      );

      if (response.ok) {
        await fetchAttachedSubProducts(selectedProduct.id);
        await fetchGroupProducts(selectedGroup);
        setSelectedAttachedSubProducts([]);
      } else {
        const error = await response.json();
        showError(error.error || "Failed to detach sub-products");
      }
    } catch (error) {
      console.error("Error detaching sub-products:", error);
      showError("Error detaching sub-products. Please try again.");
    }
  };

  const toggleGroupSubProductSelection = (subProductId) => {
    setSelectedGroupSubProducts((prev) =>
      prev.includes(subProductId)
        ? prev.filter((id) => id !== subProductId)
        : [...prev, subProductId]
    );
  };

  const toggleAttachedSubProductSelection = (subProductId) => {
    setSelectedAttachedSubProducts((prev) =>
      prev.includes(subProductId)
        ? prev.filter((id) => id !== subProductId)
        : [...prev, subProductId]
    );
  };

  return (
    <div className="p-2 overflow-y-auto scrollbar-custom">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-pos-text-primary text-xl font-semibold text-center flex-1">
          Products
        </h2>
      </div>
      <div className="flex gap-2">
        <button
          className="btn-primary"
          onClick={() => {
            setEditingCategory(null);
            setShowAddCategory(true);
          }}
        >
          Add Category
        </button>
        <button
          className={`btn-primary ${!selectedCategory
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
          onClick={() => handleEditCategory(selectedCategory)}
          disabled={!selectedCategory}
        >
          Edit Category
        </button>
        <button
          className={`btn-primary ${!selectedCategory
            ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            : ""
            }`}
          onClick={() => openDeleteConfirmation(selectedCategory)}
          disabled={!selectedCategory}
        >
          Delete Category
        </button>
        <div className="flex gap-2">
          <button
            className={`btn-primary ${!selectedCategory
              ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              : ""
              }`}
            onClick={() => {
              setEditingProduct(null);
              setShowAddProduct(true);
            }}
            disabled={!selectedCategory}
          >
            Add Product
          </button>
          <button
            className={`btn-primary ${!selectedProduct
              ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              : ""
              }`}
            onClick={() => handleEditProduct(selectedProduct)}
            disabled={!selectedProduct}
          >
            Edit Product
          </button>
          <button
            className={`btn-primary ${!selectedProduct
              ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
              : ""
              }`}
            onClick={() => openDeleteProductConfirmation(selectedProduct)}
            disabled={!selectedProduct}
          >
            Delete Product
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        {/* This is category Column  */}
        <div className="flex-1 max-w-[11rem]">
          <h3 className="text-sm font-medium text-pos-text-primary mb-2">
            Categories
          </h3>
          {loading ? (
            <div className="text-pos-text-muted text-sm p-4 text-center">
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="min-h-[300px] text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded">
              No categories found.
            </div>
          ) : (
            <div className="min-h-[300px] min-w-[160px] max-w-[200px] border border-pos-border-secondary p-2">
              {categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`flex text-sm mt-1 cursor-pointer transition-colors rounded ${selectedCategory?.id === category.id
                    ? "text-white bg-pos-bg-primary"
                    : "hover:bg-black/5"
                    }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  <div className="flex">
                    <button
                      className="text-xs px-1 py-0.5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveUp(category.id);
                      }}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      className="text-xs px-1 py-0.5 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveDown(category.id);
                      }}
                      disabled={index === categories.length - 1}
                      title="Move down"
                    >
                      ▼
                    </button>
                  </div>
                  <div className="px-1 py-1 flex-1">
                    {category.name || "Unnamed Category"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* This is product Column */}
        <div className="flex-[2] max-w-[13rem] min-w-[160px]">
          <h3 className="text-sm font-medium text-pos-text-primary mb-2">
            Products
          </h3>

          {!selectedCategory ? (
            <div className="min-h-[300px] text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded text-pos-error">
              Select a category to view its products
            </div>
          ) : loadingProducts ? (
            <div className="min-h-[300px] text-pos-text-muted text-sm p-4 text-center">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="min-h-[300px] text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded text-pos-error">
              No products
            </div>
          ) : (
            <div className="min-h-[300px] min-w-[160px] border border-pos-border-secondary p-2 rounded">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`flex justify-between items-center text-sm mt-1 cursor-pointer transition-colors rounded px-1 py-1 ${selectedProduct?.id === product.id
                    ? "bg-pos-bg-primary"
                    : "hover:bg-black/5"
                    }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex-1">
                    {product.name || "Unnamed Product"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* This is sub-product Column */}
        <div className="flex-1 min-w-[160px] max-w-[200px]">
          <h3 className="text-sm font-medium text-pos-text-primary mb-2 flex items-center justify-between">
            <span>Attached Sub Products</span>
            {attachedSubProducts.length > 0 && (
              <span className="text-xs bg-pos-bg-primary px-2 py-0.5 rounded">
                {attachedSubProducts.length}
              </span>
            )}
          </h3>
          {!selectedProduct ? (
            <div className="text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded text-pos-error min-h-[300px]">
              Select a product to view attached sub-products
            </div>
          ) : loadingAttachedSubProducts ? (
            <div className="text-pos-text-muted text-sm p-4 text-center min-h-[300px]">
              Loading attached sub-products...
            </div>
          ) : attachedSubProducts.length === 0 ? (
            <div className="text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded text-pos-error min-h-[300px]">
              No attached sub-products
            </div>
          ) : (
            <>
              <div className="flex gap-1 mb-1">
                <button
                  className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  onClick={() => setSelectedAttachedSubProducts(attachedSubProducts.map(sp => sp.id))}
                >
                  Select All
                </button>
                <button
                  className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                  onClick={() => setSelectedAttachedSubProducts([])}
                  disabled={selectedAttachedSubProducts.length === 0}
                >
                  Clear
                </button>
              </div>
              <div className="min-w-[100px] border border-pos-border-secondary min-h-[272px] rounded p-2">
                {attachedSubProducts.map((subProduct) => (
                  <div
                    key={subProduct.id}
                    className={`text-sm  cursor-pointer px-2 py-1 ${selectedAttachedSubProducts.includes(subProduct.id)
                      ? "bg-pos-bg-primary text-white font-medium shadow-md"
                      : "hover:bg-black/5 hover:shadow-sm"
                      }`}
                    onClick={() => toggleAttachedSubProductSelection(subProduct.id)}
                  >
                    <div className="flex-1">
                      {selectedAttachedSubProducts.includes(subProduct.id) && "✓ "}
                      {subProduct.name || "Unnamed Sub-Product"}
                    </div>
                    {/* {subProduct.price && (
                      <div className="text-xs ml-2 opacity-75">
                        ${parseFloat(subProduct.price).toFixed(2)}
                      </div>
                    )} */}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Attach and Detach Buttons */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col gap-3">
            <button
              className={`btn-primary px-2 py-1 text-lg font-bold transition-all ${!selectedProduct || selectedGroupSubProducts.length === 0
                ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                : "hover:bg-pos-interactive-primary hover:scale-105"
                }`}
              onClick={handleAttachSubProducts}
              disabled={!selectedProduct || selectedGroupSubProducts.length === 0}
              title={`Attach ${selectedGroupSubProducts.length} selected sub-product(s) to ${selectedProduct?.name || 'product'}`}
            >
             &lt;&lt;
            </button>
            <button
              className={`btn-primary px-2 py-1 text-lg font-bold transition-all ${selectedAttachedSubProducts.length === 0
                ? "disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                : "hover:bg-pos-interactive-primary hover:scale-105"
                }`}
              onClick={handleDetachSubProducts}
              disabled={selectedAttachedSubProducts.length === 0}
              title={`Detach ${selectedAttachedSubProducts.length} selected sub-product(s) from product`}
            >
              &gt;&gt;
            </button>
            {selectedProduct && (
              <div className="text-xs text-center text-pos-text-muted mt-2">
                <div className="font-semibold text-pos-text-primary mb-1">
                  {selectedProduct.name}
                </div>
                <div>
                  {selectedGroupSubProducts.length > 0 && (
                    <span className="text-pos-success">
                      {selectedGroupSubProducts.length} to attach
                    </span>
                  )}
                  {selectedGroupSubProducts.length > 0 && selectedAttachedSubProducts.length > 0 && " | "}
                  {selectedAttachedSubProducts.length > 0 && (
                    <span className="text-pos-warning">
                      {selectedAttachedSubProducts.length} to detach
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* This is Group of Subproduct */}
        <div className="flex-1 min-w-[160px] max-w-[200px]">
          <h3 className="text-sm font-medium text-pos-text-primary mb-2 flex items-center justify-between">
            <span>Sub Product Group</span>
            {groupProducts.length > 0 && (
              <span className="text-xs bg-pos-bg-primary px-2 py-0.5 rounded">
                {groupProducts.length}
              </span>
            )}
          </h3>

          <div className="mb-1 min-w-[100px]">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-0.5 text-sm rounded focus:outline-none focus:border-pos-info transition-colors"
            >
              <option value="">All Groups </option>
              {loadingGroups ? (
                <option disabled>Loading groups...</option>
              ) : (
                groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="mt-1">
            {loadingGroupProducts ? (
              <div className="min-h-[272px] text-pos-text-muted text-sm p-4 text-center">
                Loading sub-products...
              </div>
            ) : groupProducts.length === 0 ? (
              <div className="min-h-[272px] text-pos-text-muted text-sm border border-pos-border-secondary p-2 rounded text-pos-error">
                No sub-products {selectedGroup ? "in this group" : "available"}
              </div>
            ) : (
              <>
                <div className="flex gap-1 mb-1">
                  <button
                    className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                    onClick={() => setSelectedGroupSubProducts(groupProducts.map(sp => sp.id))}
                  >
                    Select All
                  </button>
                  <button
                    className="text-xs px-2 py-1 bg-pos-bg-primary hover:bg-pos-interactive-primary rounded transition-colors"
                    onClick={() => setSelectedGroupSubProducts([])}
                    disabled={selectedGroupSubProducts.length === 0}
                  >
                    Clear
                  </button>
                </div>
                <div className="min-h-[244px] min-w-[160px] border border-pos-border-secondary p-2 rounded">
                  {groupProducts.map((subProduct) => (
                    <div
                      key={subProduct.id}
                      className={`text-sm mt-1 min-w-[100px] cursor-pointer px-1 py-1 ${selectedGroupSubProducts.includes(subProduct.id)
                        ? "bg-pos-bg-primary text-white font-medium shadow-md"
                        : "hover:bg-black/5 hover:shadow-sm"
                        }`}
                      onClick={() => toggleGroupSubProductSelection(subProduct.id)}
                    >
                      <div className="flex-1">
                        {selectedGroupSubProducts.includes(subProduct.id) && "✓ "}
                        {subProduct.name || "Unnamed Sub-Product"}
                      </div>
                      {/* {subProduct.price && (
                        <div className="text-xs ml-2 opacity-75">
                          ${parseFloat(subProduct.price).toFixed(2)}
                        </div>
                      )} */}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <CategoryFormModal
        isOpen={showAddCategory}
        onClose={() => {
          setShowAddCategory(false);
          setEditingCategory(null);
        }}
        onSubmit={handleAddCategory}
        category={editingCategory}
      />

      <ProductFormModal
        isOpen={showAddProduct}
        onClose={() => {
          setShowAddProduct(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddProduct}
        product={editingProduct}
        categories={categories}
        selectedCategoryId={selectedCategory?.id}
      />

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title={
          deleteConfirmation.categoryId ? "Delete Category" : "Delete Product"
        }
        message={
          deleteConfirmation.categoryId
            ? `Are you sure you want to delete "${deleteConfirmation.categoryName}"? This action cannot be undone.`
            : `Are you sure you want to delete "${deleteConfirmation.productName}"? This action cannot be undone.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <MessageModal
        isOpen={messageModal.isOpen}
        onClose={closeModal}
        title={messageModal.title}
        message={messageModal.message}
        type={messageModal.type}
      />
    </div>
  );
};

export default CategoryManager;
