import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="bg-pos-interactive-primary text-pos-text-muted border-none px-4 py-2 cursor-pointer text-2xl flex items-center gap-2 transition-all duration-200 hover:bg-pos-bg-tertiary hover:text-white rounded-lg"
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
};

const UserLoginScreen = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setPincode('');
    setError('');
  };

  const handlePincodeInput = useCallback((value) => {
    if (value === 'clear') {
      setPincode('');
      setError('');
    } else if (pincode.length < 4) {
      setPincode(pincode + value);
    }
  }, [pincode]);

  const handleVerifyPincode = useCallback(async () => {
    if (!selectedUser || !pincode) return;

    try {
      const response = await fetch('http://localhost:5000/api/users/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, pincode })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        navigate('/pos');
      } else {
        setError('Invalid pincode');
        setPincode('');
      }
    } catch (error) {
      setError('Error verifying pincode');
      console.error('Error:', error);
    }
  }, [selectedUser, pincode, navigate]);

  // New useEffect for handling keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedUser) return;

      // Handle numeric keys (0-9)
      if (/[0-9]/.test(e.key)) {
        e.preventDefault();
        handlePincodeInput(e.key);
      }
      // Handle Backspace key
      else if (e.key === 'Backspace') {
        e.preventDefault();
        if (pincode.length > 0) {
          setPincode(pincode.slice(0, -1));
        }
      }
      // Handle Enter key for verification
      else if (e.key === 'Enter') {
        e.preventDefault();
        if (pincode.length === 4) {
          handleVerifyPincode();
        }
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup event listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedUser, pincode, handlePincodeInput, handleVerifyPincode]);

  useEffect(() => {
    if (pincode.length === 4 && selectedUser) {
      handleVerifyPincode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  return (
    <div className="h-screen bg-pos-bg-primary flex flex-col">
      <div className="flex justify-between items-center py-8 px-8">
        <div></div>
        <div className="text-4xl font-bold text-pos-text-primary">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
        <ThemeToggleButton />
      </div>

      {!selectedUser ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 p-8">
            {users.map(user => (
              <div
                key={user.id}
                className="card card-hover bg-pos-bg-secondary p-6 flex flex-col items-center gap-4 min-w-[150px] cursor-pointer"
                onClick={() => handleUserClick(user)}
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl" style={{ backgroundColor: user.avatar_color }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <div className="text-pos-text-primary text-lg font-medium text-center">{user.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-pos-bg-secondary rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button className="absolute top-4 right-4 text-pos-text-muted hover:text-pos-text-primary text-2xl" onClick={() => setSelectedUser(null)}>×</button>

            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl" style={{ backgroundColor: selectedUser.avatar_color }}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="text-pos-text-primary text-xl font-medium">{selectedUser.name}</div>

              <div className="flex gap-4 mb-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 border-pos-border-secondary flex items-center justify-center ${i < pincode.length ? 'bg-pos-text-primary' : 'bg-transparent'}`}>
                    {i < pincode.length ? <span className="text-pos-bg-primary text-xs">•</span> : ''}
                  </div>
                ))}
              </div>

              {error && <div className="text-pos-error text-sm mb-4">{error}</div>}

              <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('1')}>1</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('2')}>2</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('3')}>3</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('4')}>4</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('5')}>5</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('6')}>6</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('7')}>7</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('8')}>8</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('9')}>9</button>
                <button className="btn-danger h-12 text-sm" onClick={() => handlePincodeInput('clear')}>Clear</button>
                <button className="btn-primary h-12 text-lg" onClick={() => handlePincodeInput('0')}>0</button>
                <div className="h-12"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoginScreen;