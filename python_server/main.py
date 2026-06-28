import cv2
import mediapipe as mp
import numpy as np
import base64
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)

# --- ML Models ---
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=0,  # OPTIMIZED: 0=fastest, 1=balanced, 2=accurate (using fastest for low latency)
    enable_segmentation=False,
    min_detection_confidence=0.35,  # BALANCED: Works from close and long distance
    min_tracking_confidence=0.35    # BALANCED: Smooth tracking even from far
)

# Exercise Modules
from angle_calculator import get_exercise_angles
from rep_counter import RepCounter
from form_validator import validate_form

def decode_image(base64_string):
    try:
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None

# --- Endpoints ---

@app.before_request
def log_request_info():
    print(f"📡 Incoming {request.method} {request.path} from {request.remote_addr}")
    
    # Security Check (Non-blocking for Phase 3)
    api_key = request.headers.get('x-api-key')
    expected_key = "development_key_123"
    
    if api_key == expected_key:
         print(f"🔐 API Key Verified")
    else:
         print(f"⚠️ API Key Warning: Missing or Invalid (Received: {api_key})")
         # future: return jsonify({"error": "Unauthorized"}), 401

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "service": "opencv-enhanced-backend"})

# In-memory session storage for frames
# Format: { "workout_id_123": { "exercise_id": "push-ups", "frames": [...] } }
active_sessions = {}

@app.route('/stream-frame', methods=['POST'])
def stream_frame():
    """
    Receives a single frame quickly and stores it in memory.
    Returns immediately so the mobile app doesn't hang.
    """
    try:
        data = request.json
        if not data or 'image' not in data or 'sessionId' not in data:
            return jsonify({"error": "Missing image or sessionId"}), 400

        session_id = data['sessionId']
        exercise_id = data.get('exerciseId', 'push-ups')
        
        # Initialize session if it doesn't exist
        if session_id not in active_sessions:
            active_sessions[session_id] = {
                "exercise_id": exercise_id,
                "frames": [],
                "rep_counter": RepCounter(session_id)
            }
            print(f"🆕 Started new workout session: {session_id} for {exercise_id}")
            
        # Add frame to queue
        active_sessions[session_id]["frames"].append(data['image'])
        
        # Return tiny response immediately
        return jsonify({"status": "queued", "queued_frames": len(active_sessions[session_id]["frames"])}), 200

    except Exception as e:
        print(f"❌ Error queuing frame: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/finish', methods=['POST'])
def finish_workout():
    """
    Processes all queued frames for a session sequentially, running the Math/ML logic,
    and returns the final results.
    """
    t_start = time.time()
    try:
        data = request.json
        session_id = data.get('sessionId')
        
        if not session_id or session_id not in active_sessions:
            return jsonify({"error": "Invalid or missing sessionId"}), 404

        session = active_sessions[session_id]
        exercise_id = session['exercise_id']
        frames = session['frames']
        rep_counter = session['rep_counter']
        
        print(f"🏁 Finishing session {session_id}. Processing {len(frames)} frames...")
        
        # Reset the rep counter specifically for this new run
        rep_counter.reset(exercise_id)
        
        final_rep_count = 0
        all_feedback = set()
        total_form_score = 0
        valid_frames = 0
        
        # Process each frame sequentially (skip every other for speed)
        FRAME_SKIP = 2  # Process 1 out of every N frames (2 = 50% faster)
        for idx, base64_image in enumerate(frames):
            # Skip frames for speed — still accurate for rep counting
            if idx % FRAME_SKIP != 0:
                continue

            img = decode_image(base64_image)
            if img is None:
                continue
                
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = pose.process(img_rgb)
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # 1. Dynamic Angle Calculation
                angles = get_exercise_angles(landmarks, exercise_id)
                
                # 2. Form Validation
                feedback = validate_form(exercise_id, landmarks, angles)
                form_is_valid = len(feedback) == 0
                
                # 3. Stateful Rep Counting
                rep_stats = rep_counter.update(exercise_id, angles, form_is_valid)
                
                # Track ongoing stats
                final_rep_count = rep_stats['count']
                if rep_stats.get('score'):
                    total_form_score += rep_stats['score']
                    valid_frames += 1
                    
                # Collect unique feedback
                for f in feedback:
                    all_feedback.add(f)
                if rep_stats.get('rejection_reason'):
                    all_feedback.add(rep_stats['rejection_reason'])

        # Calculate final averages
        avg_score = 100
        if valid_frames > 0:
            avg_score = int(total_form_score / valid_frames)
            
        # Clean up memory
        
        # Try to delete the state file for this session
        state_file = getattr(rep_counter, 'state_file', f"reps_state_{session_id}.json")
        import os
        if os.path.exists(state_file):
            try:
                os.remove(state_file)
            except Exception as e:
                pass
                
        del active_sessions[session_id]
        
        t_end = time.time()
        print(f"✅ Finished {session_id} in {round(t_end - t_start, 2)}s. Reps: {final_rep_count}, Score: {avg_score}%")
        
        return jsonify({
            "status": "complete",
            "rep_count": final_rep_count,
            "form_score": avg_score,
            "feedback": list(all_feedback)[:3], # Return top 3 unique feedbacks
            "processed_frames": len(frames)
        }), 200

    except Exception as e:
        print(f"❌ Error finalizing workout: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/reset', methods=['POST'])
def reset_exercise():
    data = request.json
    exercise_id = data.get('exerciseId', 'push-ups')
    session_id = data.get('sessionId')
    
    print(f"🔄 Resetting rep counter for: {exercise_id} (Session: {session_id})")
    
    if session_id and session_id in active_sessions:
        active_sessions[session_id]['rep_counter'].reset(exercise_id)
        return jsonify({"status": "reset", "exerciseId": exercise_id, "sessionId": session_id})
    else:
        return jsonify({"error": "Session not found"}), 404

if __name__ == '__main__':
    print("\n\n" + "="*50)
    print("🚀 PYTHON SERVER STARTED/RESTARTED (STREAMING MODE)")
    print("="*50 + "\n")
    print("Starting OpenCV Enhanced Vision Backend on port 5001...")
    # Using 0.0.0.0 to be accessible from mobile device
    # debug=False is important for threading/camera stability
    app.run(host='0.0.0.0', port=5001, debug=False)
