import os  
import face_recognition
import cv2
import pickle

def read_img(path):
    img = cv2.imread(path)
    (h, w) = img.shape[:2]
    width = 500
    ratio = width / float(w)
    height = int(h * ratio)
    return cv2.resize(img, (width, height))

# Path to the pickle file
pickle_file = 'known_faces.pkl'

# Initialize known face encodings and names
known_encodings = []
known_names = []

# Check if the pickle file exists
if os.path.exists(pickle_file):
    print("Loading existing known faces model...")
    with open(pickle_file, 'rb') as f:
        known_encodings, known_names = pickle.load(f)
else:
    print("Pickle file not found. Creating new model...")
    # Directory containing known face images
    known_dir = './Faces'  # Ensure this path is correct

    # Load known faces and their encodings
    for file in os.listdir(known_dir):
        if file.endswith(('jpg', 'png', 'jpeg')):  # Ensure valid image files
            img = read_img(os.path.join(known_dir, file))
            try:
                img_enc = face_recognition.face_encodings(img)[0]
                known_encodings.append(img_enc)
                known_names.append(file.split('.')[0])
            except IndexError:
                print(f"No face found in {file}. Skipping this file.")

    # Save the known encodings and names to the pickle file
    with open(pickle_file, 'wb') as f:
        pickle.dump((known_encodings, known_names), f)

    print("Known faces model created and saved successfully!")
  
# Confirm the known faces are loaded
print(f"Number of known faces: {len(known_names)}")
