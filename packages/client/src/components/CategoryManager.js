import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    next_course: 0,
    in_web_shop: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    categoryId: null,
    categoryName: ''
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/categories');
      const result = await response.json();
      setCategories(result.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Failed to load categories. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!categoryForm.name) {
      alert('Category name is required');
      return;
    }

    try {
      const url = editingCategory
        ? `http://localhost:5000/api/categories/${editingCategory.id}`
        : 'http://localhost:5000/api/categories';

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        fetchCategories();
        setShowAddCategory(false);
        setEditingCategory(null);
        setCategoryForm({ name: '', next_course: 0, in_web_shop: 0 });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      next_course: Number(category.next_course) || 0,
      in_web_shop: Number(category.in_web_shop) || 0
    });
    setShowAddCategory(true);
  };

  const handleDeleteCategory = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Error deleting category');
    }
  };

  const openDeleteConfirmation = (category) => {
    setDeleteConfirmation({
      isOpen: true,
      categoryId: category.id,
      categoryName: category.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      categoryId: null,
      categoryName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.categoryId) {
      handleDeleteCategory(deleteConfirmation.categoryId);
    }
  };

  const handleMoveUp = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}/move-up`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Cannot move up');
      }
    } catch (error) {
      console.error('Error moving category:', error);
      alert('Error moving category');
    }
  };

  const handleMoveDown = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/categories/${id}/move-down`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchCategories();
      } else {
        const error = await response.json();
        alert(error.error || 'Cannot move down');
      }
    } catch (error) {
      console.error('Error moving category:', error);
      alert('Error moving category');
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Categories</h2>
        <button className="add-btn" onClick={() => {
          setEditingCategory(null);
          setCategoryForm({ name: '', next_course: 0, in_web_shop: 0 });
          setShowAddCategory(true);
        }}>
          + Add Category
        </button>
      </div>

      <div className="categories-table">
        {loading ? (
          <div className="loading-state">Loading categories...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th className="order-header"></th>
                <th>Category Name</th>
                {/* <th>Next Course</th> */}
                {/* <th>Web Shop</th> */}
                <th className='actions-cell'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No categories found. Click "Add Category" to create your first category.
                  </td>
                </tr>
              ) : (
                categories.map((category, index) => (
                  <tr key={category.id}>
                    <td className="order-cell">
                      <button
                        className="arrow-btn"
                        onClick={() => handleMoveUp(category.id)}
                        disabled={index === 0}
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        className="arrow-btn"
                        onClick={() => handleMoveDown(category.id)}
                        disabled={index === categories.length - 1}
                        title="Move down"
                      >
                        ▼
                      </button>
                    </td>
                    <td className="">{category.name || 'Unnamed Category'}</td>
                    {/* <td className="">
                      <span className="">
                        {category.next_course || null}
                      </span>
                    </td> */}
                    {/* <td className="">
                      <span className="">
                        {category.in_web_shop}
                      </span>
                    </td> */}
                    <td className="actions-cell">
                      <IconButton
                        icon="✏️"
                        className="edit"
                        onClick={() => handleEditCategory(category)}
                        title="Edit category"
                      />
                      <IconButton
                        icon="🗑️"
                        className="delete"
                        onClick={() => openDeleteConfirmation(category)}
                        title="Delete category"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddCategory && (
        <div className="modal-overlay" onClick={() => setShowAddCategory(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>

            <div className="form-group">
              <label>Category Name</label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>

            {/* <div className="form-group">
              <label>
                Next Course
              </label>
              <input
                type="text"
                checked={categoryForm.next_course === 1}
                onChange={(e) => setCategoryForm({ ...categoryForm, next_course: e.target.checked ? 1 : 0 })}
              />

            </div> */}

            {/* <div className="form-group">
              <label>
                Available in Web Shop
              </label>
              <input
                type="text"
                checked={categoryForm.in_web_shop === 1}
                onChange={(e) => setCategoryForm({ ...categoryForm, in_web_shop: e.target.checked ? 1 : 0 })}
              />

            </div> */}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddCategory(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={handleAddCategory}>
                {editingCategory ? 'Update Category' : 'Add Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteConfirmation.categoryName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default CategoryManager;