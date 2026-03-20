'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import './SelfieCapture.css';

export default function SelfieCapture({ onCapture, label }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOpen, setCameraOpen] = useState(false);
    const [photoData, setPhotoData] = useState(null);
    const [error, setError] = useState('');
    const [facingMode, setFacingMode] = useState('user'); // 'user' = front camera

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    async function startCamera(facing) {
        setError('');
        try {
            stopCamera();
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing || facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false,
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraOpen(true);
        } catch (err) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.');
            } else if (err.name === 'NotFoundError') {
                setError('Kamera tidak ditemukan pada perangkat ini.');
            } else {
                setError('Gagal mengakses kamera. Pastikan perangkat memiliki kamera.');
            }
        }
    }

    function takePhoto() {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        // Mirror for front camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0);
        const data = canvas.toDataURL('image/jpeg', 0.8);
        setPhotoData(data);
        stopCamera();
        setCameraOpen(false);
        if (onCapture) onCapture(data);
    }

    function retakePhoto() {
        setPhotoData(null);
        if (onCapture) onCapture(null);
        startCamera();
    }

    function switchCamera() {
        const newMode = facingMode === 'user' ? 'environment' : 'user';
        setFacingMode(newMode);
        startCamera(newMode);
    }

    return (
        <div className="selfie-capture">
            <label className="form-label">{label || 'Selfie'} *</label>

            {photoData ? (
                <div className="selfie-preview">
                    <img src={photoData} alt="Selfie preview" className="selfie-img" />
                    <button type="button" onClick={retakePhoto} className="selfie-retake-btn">
                        🔄 Ulangi Foto
                    </button>
                </div>
            ) : cameraOpen ? (
                <div className="selfie-camera">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="selfie-video"
                        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                    />
                    <div className="selfie-controls">
                        <button type="button" onClick={switchCamera} className="selfie-switch-btn" title="Ganti Kamera">
                            🔄
                        </button>
                        <button type="button" onClick={takePhoto} className="selfie-snap-btn" title="Ambil Foto">
                            📸
                        </button>
                        <button type="button" onClick={() => { stopCamera(); setCameraOpen(false); }} className="selfie-cancel-btn" title="Batal">
                            ✕
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    {error && <p className="selfie-error">{error}</p>}
                    <button type="button" onClick={() => startCamera()} className="selfie-open-btn">
                        📷 Buka Kamera
                    </button>
                </div>
            )}

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}
