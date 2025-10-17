import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserLoginScreen.css';

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

  const handlePincodeInput = (value) => {
    if (value === 'clear') {
      setPincode('');
      setError('');
    } else {
      setPincode(pincode + value);
    }
  };

  const handleVerifyPincode = async () => {
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
  };

  useEffect(() => {
    if (pincode.length === 4 && selectedUser) {
      handleVerifyPincode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  return (
    <div className="user-login-screen">
      <div className="login-header">
        <div className="time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

      {!selectedUser ? (
        <div className="users-grid">
          {users.map(user => (
            <div
              key={user.id}
              className="user-card"
              onClick={() => handleUserClick(user)}
            >
              <div className="user-avatar" style={{ backgroundColor: user.avatar_color }}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="user-name">{user.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pincode-modal">
          <div className="pincode-content">
            <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
            <div className="selected-user-avatar" style={{ backgroundColor: selectedUser.avatar_color }}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="user-name-large">{selectedUser.name}</div>
            
            <div className="pincode-display">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`pin-dot ${i < pincode.length ? 'filled' : ''}`}>
                  {i < pincode.length ? '•' : ''}
                </div>
              ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="numpad">
              <div className="numpad-row">
                <button onClick={() => handlePincodeInput('7')}>7</button>
                <button onClick={() => handlePincodeInput('8')}>8</button>
                <button onClick={() => handlePincodeInput('9')}>9</button>
              </div>
              <div className="numpad-row">
                <button onClick={() => handlePincodeInput('4')}>4</button>
                <button onClick={() => handlePincodeInput('5')}>5</button>
                <button onClick={() => handlePincodeInput('6')}>6</button>
              </div>
              <div className="numpad-row">
                <button onClick={() => handlePincodeInput('1')}>1</button>
                <button onClick={() => handlePincodeInput('2')}>2</button>
                <button onClick={() => handlePincodeInput('3')}>3</button>
              </div>
              <div className="numpad-row">
                <button onClick={() => handlePincodeInput('clear')} className="clear-btn">Clear</button>
                <button onClick={() => handlePincodeInput('0')}>0</button>
                <button className="empty-btn"></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoginScreen;
