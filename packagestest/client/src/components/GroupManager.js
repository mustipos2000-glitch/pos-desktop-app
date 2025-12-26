import { useState, useEffect } from 'react';
import IconButton from './IconButton';
import ConfirmationModal from './ConfirmationModal';
import MessageModal from './MessageModal';
import GroupFormModal from './GroupFormModal';
import SearchBar from './SearchBar';
import { useMessageModal } from '../hooks/useMessageModal';

const GroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    groupId: null,
    groupName: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleAddGroup = async (groupFormData) => {
    if (!groupFormData.name) {
      return;
    }

    try {
      const url = editingGroup
        ? `http://localhost:5000/api/groups/${editingGroup.id}`
        : 'http://localhost:5000/api/groups';

      const response = await fetch(url, {
        method: editingGroup ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupFormData)
      });

      if (response.ok) {
        fetchGroups();
        setShowAddGroup(false);
        setEditingGroup(null);
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
        <div className="flex gap-2 items-center">
          <SearchBar 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            placeholder="Search groups..."
          />
          <button className="add-btn" onClick={() => {
            setEditingGroup(null);
            setShowAddGroup(true);
          }}>
            + Add Group
          </button>
        </div>
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
              {groups.filter(group =>
                !searchQuery || group.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty-state">
                    {searchQuery ? 'No groups match your search.' : 'No groups found. Click "Add Group" to create your first group.'}
                  </td>
                </tr>
              ) : (
                groups.filter(group =>
                  !searchQuery || group.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((group) => (
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

      <GroupFormModal
        isOpen={showAddGroup}
        onClose={() => {
          setShowAddGroup(false);
          setEditingGroup(null);
        }}
        onSubmit={handleAddGroup}
        group={editingGroup}
      />

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
