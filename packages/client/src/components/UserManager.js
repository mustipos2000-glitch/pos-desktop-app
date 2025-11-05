import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    pincode: '',
    social_security: '',
    identification: '',
    role: 'User',
    avatar_color: '#3b82f6'
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    userId: null,
    userName: ''
  });
  const [showPincode, setShowPincode] = useState(false);
  const [errors, setErrors] = useState({});

  const avatarColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4'
  ];

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear form when modal opens for new user
  useEffect(() => {
    if (showUserModal && !editingUser) {
      setUserForm({
        name: '',
        pincode: '',
        social_security: '',
        identification: '',
        role: 'Admin',
        avatar_color: '#3b82f6'
      });
      setShowPincode(false);
      setErrors({});
    }
  }, [showUserModal, editingUser]);

  const validateForm = () => {
    const newErrors = {};

    if (!userForm.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userForm.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (userForm.pincode.length !== 4) {
      newErrors.pincode = 'Pincode must be 4 digits';
    } else if (!/^\d+$/.test(userForm.pincode)) {
      newErrors.pincode = 'Pincode must contain only numbers';
    }

    if (userForm.social_security && !/^\d{3}-?\d{2}-?\d{4}$/.test(userForm.social_security)) {
      newErrors.social_security = 'Invalid SSN format (XXX-XX-XXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const url = editingUser
        ? `http://localhost:5000/api/users/${editingUser.id}`
        : 'http://localhost:5000/api/users';

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      if (response.ok) {
        fetchUsers();
        closeUserModal();
      } else {
        const error = await response.json();
        setErrors({ general: error.error || 'Failed to save user' });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setErrors({ general: 'Error saving user' });
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      pincode: user.pincode,
      social_security: user.social_security || '',
      identification: user.identification || '',
      role: user.role,
      avatar_color: user.avatar_color
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const error = await response.json();
        console.error('Failed to delete user:', error.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const openDeleteConfirmation = (user) => {
    setDeleteConfirmation({
      isOpen: true,
      userId: user.id,
      userName: user.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      userId: null,
      userName: ''
    });
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({
      name: '',
      pincode: '',
      social_security: '',
      identification: '',
      role: 'User',
      avatar_color: '#3b82f6'
    });
    setShowPincode(false);
    setErrors({});
  };

  const confirmDelete = () => {
    if (deleteConfirmation.userId) {
      handleDeleteUser(deleteConfirmation.userId);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Users</h2>
        <button className="add-btn" onClick={() => {
          setEditingUser(null);
          setUserForm({
            name: '',
            pincode: '',
            social_security: '',
            identification: '',
            role: 'User',
            avatar_color: '#3b82f6'
          });
          setErrors({});
          setShowUserModal(true);
        }}>
          + Add User
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-16">Avatar</th>
              <th className="w-48">Name</th>
              <th className="w-32">Role</th>
              <th className="w-24">Pincode</th>
              <th className="w-40">SSN</th>
              <th className="w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-pos-text-muted">
                  No users found. Click "Add User" to create one.
                </td>
              </tr>
            ) : (
              users
                .sort((a, b) => a.id - b.id)
                .map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md"
                        style={{ backgroundColor: user.avatar_color }}
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    </td>
                    <td className="font-medium text-pos-text-primary">{user.name}</td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'Admin' 
                          ? 'bg-pos-error bg-opacity-20 text-pos-error' 
                          : user.role === 'Manager'
                          ? 'bg-pos-warning bg-opacity-20 text-pos-warning'
                          : 'bg-pos-info bg-opacity-20 text-pos-info'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-pos-text-muted font-mono">••••</td>
                    <td className="text-pos-text-secondary">{user.social_security || '-'}</td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        <IconButton
                          icon="✏️"
                          className="edit"
                          onClick={() => handleEditUser(user)}
                          title="Edit user"
                        />
                        {index !== 0 && (
                          <IconButton
                            icon="🗑️"
                            className="delete"
                            onClick={() => openDeleteConfirmation(user)}
                            title="Delete user"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={closeUserModal}>
          <div className="bg-pos-bg-tertiary rounded-lg shadow-2xl w-[600px] max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} key={editingUser ? editingUser.id : 'new-user'}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-pos-bg-tertiary border-b border-pos-border-secondary px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-semibold text-pos-text-primary">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button 
                onClick={closeUserModal}
                className="text-pos-text-muted hover:text-pos-text-primary transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4">
              {errors.general && (
                <div className="bg-pos-error bg-opacity-10 border border-pos-error text-pos-error px-4 py-3 rounded-lg mb-4 text-sm">
                  {errors.general}
                </div>
              )}

              <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">
                      Name <span className="text-pos-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={userForm.name}
                      onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                      className={`w-full bg-pos-bg-primary border ${errors.name ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      placeholder="Enter user name"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {errors.name && <p className="text-pos-error text-xs mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">
                      Pincode <span className="text-pos-error">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPincode ? "text" : "password"}
                        maxLength="4"
                        placeholder="4-digit code"
                        value={userForm.pincode}
                        onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
                        className={`w-full bg-pos-bg-primary border ${errors.pincode ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors pr-10`}
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text-primary transition-colors"
                        onClick={() => setShowPincode(!showPincode)}
                        title={showPincode ? "Hide pincode" : "Show pincode"}
                      >
                        {showPincode ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.pincode && <p className="text-pos-error text-xs mt-1">{errors.pincode}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Role</label>
                    <select
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                      className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                    >
                      <option value="User">User</option>
                      <option value="Admin">Admin</option>
                      <option value="Manager">Manager</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Social Security Number</label>
                    <input
                      type="number"
                      placeholder="XXX-XX-XXXX"
                      value={userForm.social_security}
                      onChange={(e) => setUserForm({ ...userForm, social_security: e.target.value })}
                      className={`w-full bg-pos-bg-primary border ${errors.social_security ? 'border-pos-error' : 'border-pos-border-secondary'} text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors`}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                    {errors.social_security && <p className="text-pos-error text-xs mt-1">{errors.social_security}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Identification</label>
                    <input
                      type="text"
                      value={userForm.identification}
                      onChange={(e) => setUserForm({ ...userForm, identification: e.target.value })}
                      className="w-full bg-pos-bg-primary border border-pos-border-secondary text-pos-text-primary px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:border-pos-info transition-colors"
                      placeholder="ID number"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-pos-text-muted mb-2">Avatar Color</label>
                    <div className="color-picker">
                      {avatarColors.map(color => (
                        <div
                          key={color}
                          className={`color-option ${userForm.avatar_color === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setUserForm({ ...userForm, avatar_color: color })}
                        >
                          {userForm.avatar_color === color && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-pos-bg-tertiary border-t border-pos-border-secondary px-6 py-4 flex items-center justify-end gap-3">
              <button 
                onClick={closeUserModal}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddUser}
                className="px-6 py-2.5 bg-pos-bg-primary text-pos-text-primary border border-pos-border-secondary rounded-lg text-sm font-medium hover:bg-pos-interactive-primary transition-colors"
              >
                {editingUser ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteConfirmation.userName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default UserManager;