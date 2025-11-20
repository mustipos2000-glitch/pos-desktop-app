import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import UserFormModal from './UserFormModal';
import SearchBar from './SearchBar';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    userId: null,
    userName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get current logged-in user to check permissions
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const isAdmin = currentUser.role === 'Admin';

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

  const validateForm = (userForm) => {
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

    return newErrors;
  };

  const handleSaveUser = async (userForm) => {
    const errors = validateForm(userForm);

    if (Object.keys(errors).length > 0) {
      // You could pass errors back to modal if needed
      console.error('Validation errors:', errors);
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
        console.error('Failed to save user:', error.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEditUser = (user) => {
    // Admin cannot edit Super Admin users
    if (isAdmin && user.role === 'Super Admin') {
      return;
    }
    setEditingUser(user);
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
    // Admin cannot delete Super Admin users
    if (isAdmin && user.role === 'Super Admin') {
      return;
    }
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
  };

  const confirmDelete = () => {
    if (deleteConfirmation.userId) {
      handleDeleteUser(deleteConfirmation.userId);
    }
  };

  return (
    <div className="p-2 overflow-y-auto scrollbar-custom">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-pos-text-primary text-xl font-semibold text-center flex-1">
          Manage Users</h2>
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          placeholder="Search users..."
        />
      </div>
      <div className="flex gap-2 mb-4">
        <button className="add-btn" onClick={() => {
          setEditingUser(null);
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
            {users.filter(user =>
              !searchQuery ||
              user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
              (user.social_security && user.social_security.includes(searchQuery))
            ).length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-pos-text-muted">
                  {searchQuery ? 'No users match your search.' : 'No users found. Click "Add User" to create one.'}
                </td>
              </tr>
            ) : (
              users
                .filter(user =>
                  !searchQuery ||
                  user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (user.role && user.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
                  (user.social_security && user.social_security.includes(searchQuery))
                )
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
                        user.role === 'Super Admin'
                          ? 'bg-purple-500 bg-opacity-20 text-purple-400'
                          : user.role === 'Admin'
                            ? 'bg-pos-error bg-opacity-20 text-pos-error'
                            : 'bg-pos-info bg-opacity-20 text-pos-info'
                        }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="text-pos-text-muted font-mono">••••</td>
                    <td className="text-pos-text-secondary">{user.social_security || '-'}</td>
                    <td>
                      <div className="flex items-center justify-center gap-2">
                        {/* Admin cannot edit Super Admin users */}
                        {!(isAdmin && user.role === 'Super Admin') && (
                          <IconButton
                            icon="✏️"
                            className="edit"
                            onClick={() => handleEditUser(user)}
                            title="Edit user"
                          />
                        )}
                        {/* Cannot delete first user, and Admin cannot delete Super Admin users */}
                        {index !== 0 && !(isAdmin && user.role === 'Super Admin') && (
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

      <UserFormModal
        isOpen={showUserModal}
        onClose={closeUserModal}
        onSubmit={handleSaveUser}
        user={editingUser}
      />

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