import { useState } from 'react';
import ApiService from '../../services/api';

const AdminPasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      const data = await ApiService.verifyByNameAndPincode(username, password);
      
      // Store user info if needed
      if (data.user) {
        localStorage.setItem('adminUser', JSON.stringify(data.user));
      }
      setUsername('');
      setPassword('');
      setError('');
      onSuccess();
    } catch (error) {
      console.error('Error verifying credentials:', error);
      // Handle connection errors
      if (error.message && error.message.includes('Failed to fetch')) {
        setError('Cannot connect to server. Please make sure the server is running.');
      } else {
        setError(error.message || 'Invalid username or password');
      }
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-pos-bg-secondary rounded-xl p-8 w-full max-w-md border-2 border-pos-border-primary">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-pos-text-primary">Admin Access</h2>
          <button
            onClick={handleClose}
            className="text-pos-text-muted hover:text-pos-text-primary text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-pos-text-primary mb-2">
              Username (Name)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-lg text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary text-lg"
              autoFocus
              placeholder="Enter user name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-pos-text-primary mb-2">
              Password (Pincode)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-pos-bg-primary border-2 border-pos-border-secondary rounded-lg text-pos-text-primary focus:outline-none focus:border-pos-interactive-primary text-lg"
              placeholder="Enter pincode"
            />
          </div>

          {error && (
            <div className="bg-red-600 bg-opacity-20 border-2 border-red-600 rounded-lg p-3">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Login'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-3 bg-pos-bg-primary text-pos-text-primary border-2 border-pos-border-secondary rounded-lg hover:bg-pos-bg-tertiary transition-colors font-medium text-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminPasswordModal;

