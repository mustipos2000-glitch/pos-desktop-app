import { useState, useEffect } from 'react';
import ApiService from '../../services/api';

const MemberManager = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    member_id: '',
    full_name: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getMembers();
      setMembers(response || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      alert('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingMember) {
        await ApiService.updateMember(editingMember.id, formData);
        alert('Member updated successfully');
      } else {
        await ApiService.createMember(formData);
        alert('Member created successfully');
      }
      fetchMembers();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving member:', error);
      alert(error.message || 'Failed to save member');
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      member_id: member.member_id || '',
      full_name: member.full_name || '',
      phone: member.phone || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete member "${name}"?`)) {
      return;
    }

    try {
      await ApiService.deleteMember(id);
      alert('Member deleted successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingMember(null);
    setFormData({
      member_id: '',
      full_name: '',
      phone: ''
    });
    setErrors({});
  };

  const handleAddNew = async () => {
    try {
      const response = await ApiService.getNextMemberId();
      setFormData(prev => ({ ...prev, member_id: response.nextMemberId || '' }));
    } catch (error) {
      console.error('Error fetching next member ID:', error);
    }
    setShowForm(true);
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.member_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone?.includes(searchQuery)
  );

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-pos-text-primary">Member Management</h2>
        <button
          onClick={handleAddNew}
          className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-xl sm:text-2xl"
        >
          + Add New Member
        </button>
      </div>

      {/* Search */}
      <div className="bg-pos-bg-secondary rounded-lg p-4 sm:p-6">
        <input
          type="text"
          placeholder="Search by name, ID, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-pos-bg-secondary rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-pos-text-primary">
                {editingMember ? 'Edit Member' : 'Add New Member'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="text-pos-text-muted hover:text-pos-text-primary text-3xl sm:text-4xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                  Member ID
                </label>
                <input
                  type="text"
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
                  disabled={!!editingMember}
                />
              </div>

              <div>
                <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none ${
                    errors.full_name ? 'border-red-500' : 'border-pos-border-secondary focus:border-pos-interactive-primary'
                  }`}
                  required
                />
                {errors.full_name && (
                  <p className="text-red-500 text-base sm:text-lg mt-2 font-medium">{errors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-lg sm:text-xl font-bold text-pos-text-primary mb-2 sm:mb-3">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6">
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 sm:px-8 sm:py-5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold text-lg sm:text-xl"
                >
                  {editingMember ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-6 py-4 sm:px-8 sm:py-5 bg-pos-bg-primary text-pos-text-primary border-2 border-pos-border-secondary rounded-xl hover:bg-pos-bg-tertiary transition-colors font-bold text-lg sm:text-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members List */}
      {loading ? (
        <div className="text-center py-12 text-pos-text-muted text-xl sm:text-2xl">Loading...</div>
      ) : (
        <div className="bg-pos-bg-secondary rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-pos-bg-tertiary">
                <tr>
                  <th className="px-3 py-3 sm:px-6 sm:py-5 text-left text-lg sm:text-xl lg:text-2xl font-bold text-pos-text-primary">ID</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-5 text-left text-lg sm:text-xl lg:text-2xl font-bold text-pos-text-primary">Name</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-5 text-left text-lg sm:text-xl lg:text-2xl font-bold text-pos-text-primary">Phone</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-5 text-left text-lg sm:text-xl lg:text-2xl font-bold text-pos-text-primary hidden md:table-cell">Created</th>
                  <th className="px-3 py-3 sm:px-6 sm:py-5 text-left text-base sm:text-lg lg:text-xl font-bold text-pos-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border-primary">
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-pos-text-muted text-lg sm:text-xl">
                      No members found
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-pos-bg-tertiary">
                      <td className="px-3 py-3 sm:px-6 sm:py-5 text-lg sm:text-xl lg:text-2xl text-pos-text-primary">{member.member_id}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5 text-lg sm:text-xl lg:text-2xl font-semibold text-pos-text-primary">{member.full_name}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5 text-lg sm:text-xl lg:text-2xl text-pos-text-secondary">{member.phone || '-'}</td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5 text-lg sm:text-xl lg:text-2xl text-pos-text-secondary hidden md:table-cell">
                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-3 py-3 sm:px-6 sm:py-5 text-left">
                        <div className="flex flex-col sm:flex-row justify-start gap-2 sm:gap-3">
                          <button
                            onClick={() => handleEdit(member)}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-base sm:text-lg lg:text-2xl font-bold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(member.id, member.full_name)}
                            className="px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 text-base sm:text-lg lg:text-2xl font-bold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredMembers.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-pos-bg-secondary rounded-xl p-4 sm:p-6">
          <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-pos-text-primary text-center sm:text-left">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredMembers.length)} of {filteredMembers.length} members
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl font-bold text-pos-text-primary hover:bg-pos-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 sm:px-5 sm:py-3 rounded-xl text-lg sm:text-xl font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-green-600 text-white'
                          : 'bg-pos-bg-primary border-2 border-pos-border-secondary text-pos-text-primary hover:bg-pos-bg-tertiary'
                      }`}
                    >
                      {page}
                    </button>
                  );
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="px-2 sm:px-3 text-pos-text-muted text-lg sm:text-xl">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="w-full sm:w-auto px-4 py-3 sm:px-6 sm:py-4 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-xl text-lg sm:text-xl font-bold text-pos-text-primary hover:bg-pos-bg-tertiary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div className="text-lg sm:text-xl font-semibold text-pos-text-muted mt-4 text-center">
          No members found
        </div>
      )}
    </div>
  );
};

export default MemberManager;

