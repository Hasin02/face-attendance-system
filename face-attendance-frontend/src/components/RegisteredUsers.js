import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import axios from 'axios';

function RegisteredUsers({ setMessage }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    axios.get('/api/registered_users')
      .then(response => setUsers(response.data.users))
      .catch(error => setMessage('Error fetching users'));
  };

  const handleDelete = () => {
    if (!selectedUser) {
      setMessage('Please select a user to delete');
      return;
    }
    axios.post('/api/delete', `name=${encodeURIComponent(selectedUser)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => {
      setMessage(response.data.message);
      if (response.data.success) {
        setSelectedUser('');
        fetchUsers();
      }
    })
    .catch(error => setMessage('Error deleting user'));
  };

  return (
    <div className="card">
      <div className="card-content">
        <h1 className="card-title">REGISTERED USERS</h1>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Form.Select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="custom-select"
            style={{ width: '60%' }}
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </Form.Select>
          <Button variant="outline-primary" className="btn-custom ms-3" onClick={handleDelete}>
            Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RegisteredUsers;