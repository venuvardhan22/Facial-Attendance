import  { useState } from 'react';
import { Camera, CameraOff, User } from 'lucide-react';

const TakeAttendance = () => {
    const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
    const [recognizedFaces, setRecognizedFaces] = useState<any[]>([]);
    const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
    

    // Start camera and recognition
    const startCameraAndRecognition = () => {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                setVideoStream(stream);
                const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
                videoElement.srcObject = stream;
                setIsWebcamEnabled(true);
                startFaceRecognition(videoElement);
            })
            .catch((err) => {
                console.error("Error accessing camera:", err);
            });
    };

    // Start face recognition every second
    const startFaceRecognition = (videoElement: HTMLVideoElement) => {
        const intervalId = setInterval(async () => {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

            const imageData = canvas.toDataURL('image/jpeg');  // Base64 image

            try {
                const response = await fetch('http://localhost:5000/recognize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ image: imageData.split(',')[1] })  // Send base64 data
                });

                if (!response.ok) {
                    throw new Error('Server error: ' + response.statusText);
                }

                const data = await response.json();

                // Update recognized faces with student_id and time from backend
                setRecognizedFaces(data.recognized_faces.map((face: any) => ({
                    student_id: face.student_id,
                    time: face.time,
                })));
            } catch (error) {
                console.error("Error during face recognition:", error);
            }
        }, 1000);  // Every second

        return intervalId;
    };

    // Stop camera and recognition
    const stopCamera = () => {
        const videoElement = document.getElementById('videoElement') as HTMLVideoElement;
        if (videoStream) {
            const tracks = videoStream.getTracks();
            tracks.forEach(track => track.stop());
        }
        videoElement.srcObject = null;
        setIsWebcamEnabled(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Face Recognition Camera</h1>

            

            <div className="aspect-video w-full max-w-2xl mx-auto bg-gray-100 rounded-lg overflow-hidden">
                <video
                    id="videoElement"
                    width="100%"
                    height="100%"
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                ></video>
            </div>
 

            <div className="flex space-x-6 gap-20">
                <button
                    onClick={startCameraAndRecognition}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-[415px]"
                    disabled={isWebcamEnabled}
                >
                    <Camera className="mr-2 h-5 w-5" />
                    Start Camera
                </button>
                <button
                    onClick={stopCamera}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    disabled={!isWebcamEnabled}
                >
                    <CameraOff className="mr-2 h-5 w-5" />
                    Stop Camera
                </button>
            </div>


            <div className="mt-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Recognized Faces</h2>
                <div className="bg-white shadow rounded-lg p-6">
                    <ul className="space-y-3">
                        {recognizedFaces.map((face, index) => (
                            <li
                                key={index}
                                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                            >
                                <User className="h-5 w-5 text-gray-600" />
                                <span className="text-gray-700">Student ID: {face.student_id} - Time: {face.time}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default TakeAttendance;
