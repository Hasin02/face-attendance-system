import React, { useState, useEffect } from 'react';
import { Container, Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import VideoFeed from './components/VideoFeed';
import RegisteredUsers from './components/RegisteredUsers';
import AttendanceLog from './components/AttendanceLog';
import AttendanceHistory from './components/AttendanceHistory';

function App() {
  const [message, setMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleString());
  const [activeView, setActiveView] = useState('video');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'video':
        return <VideoFeed setMessage={setMessage} />;
      case 'registeredUsers':
        return <RegisteredUsers setMessage={setMessage} />;
      case 'attendanceLog':
        return <AttendanceLog setMessage={setMessage} />;
      case 'attendanceHistory':
        return <AttendanceHistory setMessage={setMessage} />;
      default:
        return <VideoFeed setMessage={setMessage} />;
    }
  };

  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container>
          <Navbar.Brand href="#home" className="fs-4 fw-bold">Face Attendance System</Navbar.Brand>
          <Navbar.Text className="text-white ms-auto">
            <span>{currentTime}</span>
            <i className="fas fa-user-clock ms-2"></i>
          </Navbar.Text>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link onClick={() => setActiveView('video')} className={activeView === 'video' ? 'active' : ''}>Video Feed</Nav.Link>
              <Nav.Link onClick={() => setActiveView('registeredUsers')} className={activeView === 'registeredUsers' ? 'active' : ''}>Registered Users</Nav.Link>
              <Nav.Link onClick={() => setActiveView('attendanceLog')} className={activeView === 'attendanceLog' ? 'active' : ''}>Attendance Log</Nav.Link>
              <Nav.Link onClick={() => setActiveView('attendanceHistory')} className={activeView === 'attendanceHistory' ? 'active' : ''}>History</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container className="py-5 d-flex justify-content-center align-items-center min-vh-100">
        {renderView()}
        {message && (
          <div className="alert alert-info text-center position-fixed bottom-0 start-50 translate-middle-x mb-3" style={{ zIndex: 1000, width: '80%' }}>
            {message}
          </div>
        )}
      </Container>
    </div>
  );
}

export default App;