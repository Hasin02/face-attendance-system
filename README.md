# Face Recognition Attendance System

## Overview
This is an AI-powered attendance system designed to automate attendance tracking using facial recognition. The system features a web-based interface with real-time video feed, user registration, attendance logging, and history tracking. Developed as a personal project, it demonstrates expertise in computer vision, web development, and backend integration, and serves as a foundation for skills to be applied during my upcoming internship at Encryptix.

## Features
- Real-time face detection and recognition using OpenCV.
- Responsive web interface built with React and Bootstrap, featuring a dark-themed, glassmorphism design.
- Backend API with Flask and Flask-SocketIO for video streaming and data management.
- User registration, editing, and deletion capabilities.
- Attendance log with filtering and lifetime history viewing.
- Efficient storage and retrieval of user data using a CSV database.

## Technologies Used
- **Languages**: Python, JavaScript
- **Libraries/Frameworks**:
  - OpenCV (face recognition and detection)
  - React (frontend development)
  - Flask (backend development)
  - Bootstrap (UI styling)
  - Flask-SocketIO (real-time communication)
- **Tools**: Git, VS Code, Postman
- **Database**: CSV file for user and attendance data

## Installation
### Prerequisites
- Python 3.x
- Node.js and npm
- OpenCV (install via `pip install opencv-python`)
- A webcam for real-time video feed

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/Hasin02/face-attendance-system.git
   cd face-attendance-system
