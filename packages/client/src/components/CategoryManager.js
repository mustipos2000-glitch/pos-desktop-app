import React, { useState, useEffect } from 'react';
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
    if (!window.confirm('Are you sure you want to delete this category?')) return;

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
                <th>ID</th>
                <th>Category Name</th>
                <th>Next Course</th>
                <th>Web Shop</th>
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
                categories.map(category => (
                  <tr key={category.id}>
                    <td className="id-cell">#{category.id}</td>
                    <td className="">{category.name || 'Unnamed Category'}</td>
                    <td className="">
                      <span className="">
                        {category.next_course || null}
                      </span>
                    </td>
                    <td className="">
                      {/* <span className={`status-badge ${category.in_web_shop ? 'active' : 'inactive'}`}> */}
                        {/* {category.in_web_shop ? 'Available' : 'Hidden'} */}
                      <span className="">
                        {category.in_web_shop}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="edit-btn"
                        onClick={() => handleEditCategory(category)}
                        title="Edit category"
                      >
                        Edit
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteCategory(category.id)}
                        title="Delete category"
                      >
                        Delete
                      </button>
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

            <div className="form-group">
              <label>
                  Next Course
              </label>
                <input
                  type="text"
                  checked={categoryForm.next_course === 1}
                  onChange={(e) => setCategoryForm({ ...categoryForm, next_course: e.target.checked ? 1 : 0 })}
                />
              
            </div>

            <div className="form-group">
              <label>
                 Available in Web Shop
              </label>
                <input
                  type="text"
                  checked={categoryForm.in_web_shop === 1}
                  onChange={(e) => setCategoryForm({ ...categoryForm, in_web_shop: e.target.checked ? 1 : 0 })}
                />
               
            </div>

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
    </div>
  );
};

export default CategoryManager;