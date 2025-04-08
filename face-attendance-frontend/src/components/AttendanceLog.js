import React, { useState, useEffect } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import axios from 'axios';

function AttendanceLog({ setMessage }) {
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = () => {
    axios.get('/api/attendance_log')
      .then(response => setAttendance(response.data.attendance))
      .catch(error => setMessage('Error fetching attendance log'));
  };

  const handleClearLog = () => {
    axios.post('/api/clear_attendance')
      .then(response => {
        setMessage(response.data.message);
        if (response.data.success) {
          setAttendance([]);
          setFilter('');
        }
      })
      .catch(error => setMessage('Error clearing log'));
  };

  const filteredAttendance = attendance.filter(entry =>
    entry[0].toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-content">
        <h1 className="card-title">ATTENDANCE LOG</h1>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <Form.Control
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by name"
            style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#fff', border: '1px solid #00ffcc', width: '60%' }}
          />
          <Button variant="outline-primary" className="btn-custom ms-3" onClick={handleClearLog}>
            Clear Log
          </Button>
        </div>
        <ul className="list-group">
          {filteredAttendance.map((entry, index) => (
            <li key={index} className="list-group-item" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none' }}>
              {entry[0]} - {entry[1]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AttendanceLog;