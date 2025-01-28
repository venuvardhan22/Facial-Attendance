
# Facial Attendance System

This project is a facial attendance system that uses React with TypeScript for the frontend and Python Flask for the backend. It utilizes MongoDB Atlas for the database and allows you to upload faces to register attendance.

## Project Setup

### Prerequisites

- Node.js and npm (for the frontend)
- Python 3.x (for the backend)
- MongoDB Atlas account (for the database)

### Frontend Setup (React + TypeScript)

1. **Install Vite** (if you don’t have it installed already):

   ```bash
   npm install vite@latest project_name
   ```

2. **Install the required libraries**:
   
   Navigate to the frontend directory and install the required dependencies by using the `reqs.txt` file:

   ```bash
   cd project_folder
   npm install -r requirements.txt
   ```

3. **Run the frontend**:

   Start the Vite development server:

   ```bash
   npm run dev
   ```

   The frontend should now be running, typically accessible at `http://localhost:5714`.

### Backend Setup (Python Flask)

1. **Install required Python libraries**:
   
   Navigate to the backend directory and install the required dependencies:

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up the database**:

   - Create a MongoDB Atlas account and set up a database.
   - Copy your MongoDB connection URL and replace it in the `app.py, config.py, visualize.py` file.

3. **Upload faces**:

   - Upload the faces you want to use for attendance to the `Faces` folder.

4. **Run the facial recognition model**:

   Run the model to process the uploaded faces:

   ```bash
   python model.py
   ```

5. **Start the backend server**:

   Finally, start the backend server by running:

   ```bash
   python app.py
   ```

   The backend should now be running, typically accessible at `http://localhost:5000`.

## Usage

- The frontend will communicate with the backend to register and identify faces.
- Ensure both the frontend and backend servers are running simultaneously in separate terminals.



---
