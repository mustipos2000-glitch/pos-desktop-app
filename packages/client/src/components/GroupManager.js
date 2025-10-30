import React, { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import { useMessageModal } from '../hooks/useMessageModal';

const GroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    is_visible: 0
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    groupId: null,
    groupName: ''
  });
  const { messageModal, showError, showWarning, closeModal } = useMessageModal();

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/groups');
      const result = await response.json();
      setGroups(result.data || []);
    } catch (error) {
      console.error('Error fetching groups:', error);
      showError('Failed to load groups. Please check your connection.', 'Connection Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddGroup = async () => {
    if (!groupForm.name) {
      return;
    }

    try {
      const url = editingGroup
        ? `http://localhost:5000/api/groups/${editingGroup.id}`
        : 'http://localhost:5000/api/groups';

      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm)
      });

      if (response.ok) {
        fetchGroups();
        setShowAddGroup(false);
        setEditingGroup(null);
        setGroupForm({ name: '', is_visible: 0 });
      } else {
        const error = await response.json();
        showError(error.error || 'Failed to save group');
      }
    } catch (error) {
      console.error('Error saving group:', error);
      showError('Error saving group. Please try again.');
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name || '',
      is_visible: Number(group.is_visible) || 0
    });
    setShowAddGroup(true);
  };

  const handleDeleteGroup = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchGroups();
        closeDeleteConfirmation();
      } else {
        const error = await response.json();
        closeDeleteConfirmation();
        showWarning(error.error || 'Failed to delete group', 'Cannot Delete Group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      closeDeleteConfirmation();
      showError('Error deleting group. Please try again.');
    }
  };

  const openDeleteConfirmation = (group) => {
    setDeleteConfirmation({
      isOpen: true,
      groupId: group.id,
      groupName: group.name
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteConfirmation({
      isOpen: false,
      groupId: null,
      groupName: ''
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.groupId) {
      handleDeleteGroup(deleteConfirmation.groupId);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Manage Groups</h2>
        <button className="add-btn" onClick={() => {
          setEditingGroup(null);
          setGroupForm({ name: '', is_visible: 0 });
          setShowAddGroup(true);
        }}>
          + Add Group
        </button>
      </div>

      <div className="categories-table">
        {loading ? (
          <div className="loading-state">Loading groups...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Visible</th>
                <th className='actions-cell'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    No groups found. Click "Add Group" to create your first group.
                  </td>
                </tr>
              ) : (
                groups.map((group) => (
                  <tr key={group.id}>
                    <td className="">{group.name || 'Unnamed Group'}</td>
                    <td className="">
                      <span className="">
                        {group.is_visible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <IconButton
                        icon="✏️"
                        className="edit"
                        onClick={() => handleEditGroup(group)}
                        title="Edit group"
                      />
                      <IconButton
                        icon="🗑️"
                        className="delete"
                        onClick={() => openDeleteConfirmation(group)}
                        title="Delete group"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showAddGroup && (
        <div className="modal-overlay" onClick={() => setShowAddGroup(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingGroup ? 'Edit Group' : 'Add New Group'}</h3>

            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={groupForm.is_visible === 1}
                  onChange={(e) => setGroupForm({ ...groupForm, is_visible: e.target.checked ? 1 : 0 })}
                />
                {' '}Visible
              </label>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowAddGroup(false)}>
                Cancel
              </button>
              <button className="add-btn" onClick={handleAddGroup}>
                {editingGroup ? 'Update Group' : 'Add Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={confirmDelete}
        title="Delete Group"
        message={`Are you sure you want to delete "${deleteConfirmation.groupName}"? This action cannot be undone.`}
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

export default GroupManager;
