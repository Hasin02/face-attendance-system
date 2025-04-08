import cv2
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import os
from datetime import datetime
import csv
from flask import Flask, Response, request, jsonify
import pickle
import base64

app = Flask(__name__)

class FaceDetectorRecognizer:
    def __init__(self):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        if not os.path.exists(cascade_path):
            raise FileNotFoundError("Haar Cascade file not found!")
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        self.known_faces = {}
        self.embedding_size = 128
        self.attendance_log = set()
        self.save_dir = "registered_faces"
        self.data_file = "face_data.pkl"
        os.makedirs(self.save_dir, exist_ok=True)
        self.cap = None
        self.load_known_faces()
    
    def start_webcam(self):
        if self.cap is None or not self.cap.isOpened():
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                raise ValueError("Could not open webcam. Check camera connection or permissions.")
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            print("Webcam initialized successfully")

    def stop_webcam(self):
        if self.cap is not None and self.cap.isOpened():
            self.cap.release()
            self.cap = None
            print("Webcam released")

    def detect_faces(self, image):
        if image is None or image.size == 0:
            return []
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=3, minSize=(30, 30))
        return faces
    
    def generate_embedding(self, face_image):
        face_resized = cv2.resize(face_image, (32, 32))
        embedding = face_resized.flatten().astype(np.float32)
        embedding = embedding / np.linalg.norm(embedding)
        if len(embedding) < self.embedding_size:
            embedding = np.pad(embedding, (0, self.embedding_size - len(embedding)))
        else:
            embedding = embedding[:self.embedding_size]
        return embedding
    
    def save_known_faces(self):
        with open(self.data_file, 'wb') as f:
            pickle.dump(self.known_faces, f)
    
    def load_known_faces(self):
        if os.path.exists(self.data_file):
            with open(self.data_file, 'rb') as f:
                self.known_faces = pickle.load(f)
            print(f"Loaded {len(self.known_faces)} known faces")
        else:
            self.known_faces = {}
            print("No saved face data found")
    
    def register_face(self, name, frame):
        faces = self.detect_faces(frame)
        if len(faces) > 0:
            x, y, w, h = faces[0]
            face = frame[y:y+h, x:x+w]
            image_path = os.path.join(self.save_dir, f"{name}.jpg")
            cv2.imwrite(image_path, frame)
            embedding = self.generate_embedding(face)
            self.known_faces[name] = embedding
            self.save_known_faces()
            return True, f"Registered {name} successfully"
        return False, "No face detected"
    
    def edit_face(self, old_name, new_name, frame=None):
        if old_name not in self.known_faces:
            return False, f"{old_name} not found"
        
        if frame is None:
            self.known_faces[new_name] = self.known_faces.pop(old_name)
            old_path = os.path.join(self.save_dir, f"{old_name}.jpg")
            new_path = os.path.join(self.save_dir, f"{new_name}.jpg")
            if os.path.exists(old_path):
                os.rename(old_path, new_path)
            self.save_known_faces()
            return True, f"Updated name to {new_name}"
        
        faces = self.detect_faces(frame)
        if len(faces) > 0:
            x, y, w, h = faces[0]
            face = frame[y:y+h, x:x+w]
            image_path = os.path.join(self.save_dir, f"{new_name}.jpg")
            cv2.imwrite(image_path, frame)
            embedding = self.generate_embedding(face)
            self.known_faces.pop(old_name)
            self.known_faces[new_name] = embedding
            old_path = os.path.join(self.save_dir, f"{old_name}.jpg")
            if os.path.exists(old_path):
                os.remove(old_path)
            self.save_known_faces()
            return True, f"Updated {old_name} to {new_name} with new face"
        return False, "No face detected in new image"
    
    def delete_face(self, name):
        if name not in self.known_faces:
            return False, f"{name} not found"
        
        del self.known_faces[name]
        image_path = os.path.join(self.save_dir, f"{name}.jpg")
        if os.path.exists(image_path):
            os.remove(image_path)
        self.save_known_faces()
        return True, f"Deleted {name} successfully"
    
    def recognize_and_mark_attendance(self, image):
        faces = self.detect_faces(image)
        results = []
        
        for (x, y, w, h) in faces:
            face = image[y:y+h, x:x+w]
            embedding = self.generate_embedding(face)
            
            best_match = "Unknown"
            best_score = -1
            
            for identity, known_embedding in self.known_faces.items():
                similarity = cosine_similarity(embedding.reshape(1, -1), known_embedding.reshape(1, -1))[0][0]
                if similarity > best_score and similarity > 0.7:
                    best_score = similarity
                    best_match = identity
            
            if best_match != "Unknown" and best_match not in self.attendance_log:
                self.mark_attendance(best_match)
            
            results.append({'identity': best_match, 'confidence': best_score if best_score > -1 else 0})
            
            cv2.rectangle(image, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(image, f"{best_match} ({best_score:.2f})", (x, y-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
        
        return image, results
    
    def mark_attendance(self, identity):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.attendance_log.add(identity)
        with open('attendance.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([identity, timestamp])
    
    def clear_attendance_log(self):
        if os.path.exists('attendance.csv'):
            with open('attendance.csv', 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(["Name", "Timestamp"])
            self.attendance_log.clear()
            return True, "Attendance log cleared successfully"
        return False, "No attendance log to clear"
    
    def generate_frames(self, mode="attendance"):
        self.start_webcam()
        try:
            while True:
                ret, frame = self.cap.read()
                if not ret:
                    print("Failed to grab frame")
                    break
                
                if mode == "attendance":
                    frame, results = self.recognize_and_mark_attendance(frame)
                else:  # registration or edit mode
                    faces = self.detect_faces(frame)
                    for (x, y, w, h) in faces:
                        cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                        cv2.putText(frame, "Face Detected", (x, y-10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                
                ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
                frame_data = base64.b64encode(buffer.tobytes()).decode('utf-8')
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + base64.b64decode(frame_data) + b'\r\n')
        finally:
            self.stop_webcam()

fr = FaceDetectorRecognizer()

if not os.path.exists('attendance.csv'):
    with open('attendance.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Name", "Timestamp"])

@app.route('/api/video_feed/<mode>')
def video_feed(mode):
    return Response(fr.generate_frames(mode), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/register', methods=['POST'])
def register():
    name = request.form.get('name')
    if not name:
        return jsonify({'success': False, 'message': 'Name is required'})
    
    fr.start_webcam()
    ret, frame = fr.cap.read()
    if ret:
        success, message = fr.register_face(name, frame)
        fr.stop_webcam()
        return jsonify({'success': success, 'message': message})
    fr.stop_webcam()
    return jsonify({'success': False, 'message': 'Failed to capture image'})

@app.route('/api/edit', methods=['POST'])
def edit():
    old_name = request.form.get('old_name')
    new_name = request.form.get('new_name')
    update_image = request.form.get('update_image') == 'true'
    
    if not old_name or not new_name:
        return jsonify({'success': False, 'message': 'Both old and new names are required'})
    
    if update_image:
        fr.start_webcam()
        ret, frame = fr.cap.read()
        if ret:
            success, message = fr.edit_face(old_name, new_name, frame)
            fr.stop_webcam()
            return jsonify({'success': success, 'message': message})
        fr.stop_webcam()
        return jsonify({'success': False, 'message': 'Failed to capture image'})
    else:
        success, message = fr.edit_face(old_name, new_name)
        return jsonify({'success': success, 'message': message})

@app.route('/api/delete', methods=['POST'])
def delete():
    name = request.form.get('name')
    if not name:
        return jsonify({'success': False, 'message': 'Name is required'})
    
    success, message = fr.delete_face(name)
    return jsonify({'success': success, 'message': message})

@app.route('/api/clear_attendance', methods=['POST'])
def clear_attendance():
    success, message = fr.clear_attendance_log()
    return jsonify({'success': success, 'message': message})

@app.route('/api/registered_users')
def registered_users():
    return jsonify({'users': list(fr.known_faces.keys())})

@app.route('/api/attendance_log')
def attendance_log():
    log = []
    if os.path.exists('attendance.csv'):
        with open('attendance.csv', 'r') as f:
            reader = csv.reader(f)
            next(reader)
            log = [row for row in reader]
    return jsonify({'attendance': log})

@app.route('/api/attendance_history')
def attendance_history():
    history = []
    if os.path.exists('attendance.csv'):
        with open('attendance.csv', 'r') as f:
            reader = csv.reader(f)
            history = [row for row in reader]
    return jsonify({'history': history})

@app.route('/api/static/placeholder.jpg')
def serve_placeholder():
    return app.send_static_file('placeholder.jpg')

if __name__ == "__main__":
    try:
        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        fr.stop_webcam()