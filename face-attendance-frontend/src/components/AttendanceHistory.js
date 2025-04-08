import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import axios from 'axios';

function AttendanceHistory({ setMessage }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    axios.get('/api/attendance_history')
      .then(response => setHistory(response.data.history))
      .catch(error => setMessage('Error fetching attendance history'));
  };

  return (
    <div className="card">
      <div className="card-content">
        <h1 className="card-title">ATTENDANCE HISTORY (LIFETIME)</h1>
        <div className="d-flex justify-content-center mb-3">
          <Button variant="outline-primary" className="btn-custom" onClick={fetchHistory}>
            View History
          </Button>
        </div>
        <ul className="list-group">
          {history.map((entry, index) => (
            <li key={index} className="list-group-item" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: 'none' }}>
              {entry[0]} - {entry[1]}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default AttendanceHistory;