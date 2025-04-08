import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, InputGroup } from 'react-bootstrap';
import axios from 'axios';

function VideoFeed({ setMessage }) {
  const [videoSrc, setVideoSrc] = useState('');
  const [mode, setMode] = useState(null);
  const [name, setName] = useState('');
  const [newName, setNewName] = useState('');
  const [oldName, setOldName] = useState('');
  const [updateImage, setUpdateImage] = useState(false);
  const [users, setUsers] = useState([]);
  const [recognitionData, setRecognitionData] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!videoSrc && mode === null) {
      setVideoSrc('/api/static/placeholder.jpg');
    } else if (mode) {
      const source = new EventSource(`/api/video_feed/${mode}`);
      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setVideoSrc(`data:image/jpeg;base64,${data.image}`);
        if (mode === 'attendance') setRecognitionData(data.results);
        drawFaceOverlay(data.results);
      };
      source.onerror = () => {
        setMessage('Error streaming video feed');
        source.close();
      };
      return () => source.close();
    }
    fetchUsers();
  }, [videoSrc, mode]);

  const fetchUsers = () => {
    axios.get('/api/registered_users')
      .then(response => setUsers(response.data.users))
      .catch(error => setMessage('Error fetching users'));
  };

  const startRegistration = () => {
    setMode('register');
    setVideoSrc('/api/video_feed/register');
    setMessage('Position your face and click Save');
  };

  const startAttendance = () => {
    setMode('attendance');
    setVideoSrc('/api/video_feed/attendance');
    setMessage('Attendance tracking started');
  };

  const stopFeed = () => {
    setMode(null);
    setVideoSrc('');
    setMessage('Video feed stopped');
  };

  const startEdit = () => {
    setMode('edit');
    setVideoSrc('/api/video_feed/edit');
    setMessage('Select a user and update details');
  };

  const saveRegistration = () => {
    if (!name) {
      setMessage('Error: Please enter a name');
      return;
    }
    axios.post('/api/register', `name=${encodeURIComponent(name)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => {
      setMessage(response.data.message);
      if (response.data.success) {
        stopFeed();
        setName('');
        fetchUsers();
      }
    })
    .catch(error => setMessage('Error: Registration failed'));
  };

  const saveEdit = () => {
    if (!oldName || !newName) {
      setMessage('Error: Both old and new names are required');
      return;
    }
    const data = `old_name=${encodeURIComponent(oldName)}&new_name=${encodeURIComponent(newName)}&update_image=${updateImage}`;
    axios.post('/api/edit', data, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(response => {
      setMessage(response.data.message);
      if (response.data.success) {
        stopFeed();
        setNewName('');
        setUpdateImage(false);
        fetchUsers();
      }
    })
    .catch(error => setMessage('Error: Edit failed'));
  };

  const drawFaceOverlay = (results) => {
    if (!canvasRef.current || !results) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const video = videoRef.current;
    if (video) {
      canvas.width = video.width;
      canvas.height = video.height;
      results.forEach(result => {
        if (result.identity !== 'Unknown') {
          ctx.beginPath();
          ctx.rect(result.x, result.y, result.w, result.h);
          ctx.strokeStyle = '#00ffcc';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.font = '1rem Poppins';
          ctx.fillStyle = '#00ffcc';
          ctx.fillText(`${result.identity} (${(result.confidence * 100).toFixed(1)}%)`, result.x, result.y - 10);
        }
      });
    }
  };

  return (
    <div className="card">
      <div className="card-content">
        <h1 className="card-title">AI Face Recognition</h1>
        <div className="position-relative text-center mb-4">
          <img id="video" ref={videoRef} src={videoSrc} alt="Video Feed" />
          <canvas ref={canvasRef} className="face-overlay" />
          {recognitionData && recognitionData.length > 0 && (
            <>
              <div className="stats-badge top-right">
                Accuracy: {(recognitionData[0].confidence * 100).toFixed(1)}%
              </div>
              <div className="stats-badge bottom-left">
                Recognitions: {recognitionData.length}
              </div>
            </>
          )}
        </div>
        <div className="d-flex justify-content-center gap-2">
          <Button variant="outline-primary" className="btn-custom" onClick={startRegistration}>
            Register
          </Button>
          <Button variant="outline-primary" className="btn-custom" onClick={startAttendance}>
            Start Attendance
          </Button>
          <Button variant="outline-primary" className="btn-custom" onClick={stopFeed}>
            Stop
          </Button>
          <Button variant="outline-primary" className="btn-custom" onClick={startEdit}>
            Edit
          </Button>
        </div>
        {mode === 'register' && (
          <InputGroup className="input-group-custom mt-4">
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="custom-input"
            />
            <Button variant="outline-primary" className="btn-custom" onClick={saveRegistration}>
              Save
            </Button>
          </InputGroup>
        )}
        {mode === 'edit' && (
          <div className="edit-container mt-4">
            <Form.Select
              value={oldName}
              onChange={(e) => setOldName(e.target.value)}
              className="custom-select"
              style={{ width: '20%' }}
            >
              <option value="">Select</option>
              {users.map(user => (
                <option key={user} value={user}>{user}</option>
              ))}
            </Form.Select>
            <Form.Control
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New name"
              className="custom-input"
              style={{ width: '20%', marginLeft: '1rem' }}
            />
            <Form.Check
              type="checkbox"
              label="Update Image"
              checked={updateImage}
              onChange={(e) => setUpdateImage(e.target.checked)}
              className="custom-checkbox"
              style={{ marginLeft: '1rem', color: '#fff' }}
            />
            <Button variant="outline-primary" className="btn-custom" onClick={saveEdit} style={{ marginLeft: '1rem' }}>
              Save Edit
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoFeed;