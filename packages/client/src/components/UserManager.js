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

  const handleAddUser = async () => {
    if (!userForm.name || !userForm.pincode) {
      alert('Name and pincode are required');
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
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
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
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
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
          setShowUserModal(true);
        }}>
          + Add User
        </button>
      </div>
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Name</th>
              <th>Role</th>
              <th>Pincode</th>
              <th>SSN</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>
                  <div className="user-avatar-small" style={{ backgroundColor: user.avatar_color }}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </td>
                <td>{user.name}</td>
                <td>{user.role}</td>
                <td>••••</td>
                <td>{user.social_security || '-'}</td>
                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal user-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            
            <div className="modal-tabs">
              <div className="tab active">General</div>
              {/* <div className="tab">Privileges</div> */}
            </div>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="password"
                maxLength="4"
                value={userForm.pincode}
                onChange={(e) => setUserForm({ ...userForm, pincode: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Social Security Number</label>
              <input
                type="text"
                value={userForm.social_security}
                onChange={(e) => setUserForm({ ...userForm, social_security: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Identification</label>
              <input
                type="text"
                value={userForm.identification}
                onChange={(e) => setUserForm({ ...userForm, identification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            <div className="form-group">
              <label>Avatar Color</label>
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

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowUserModal(false)}>Cancel</button>
              <button className="add-btn" onClick={handleAddUser}>
                {editingUser ? 'Update User' : 'Add User'}
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