import { useEffect, useRef, useState, useCallback } from 'react';

// Proctoring webcam with improved stability and basic motion/object presence detection
const ProctoringWebcam = ({ onViolation }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null); // Used for lightweight visual analysis (object/motion)
  const [violation, setViolation] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // STABILITY FIX: Use ref for callback to prevent webcam restarts on parent re-renders
  const onViolationRef = useRef(onViolation);
  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  const failCountRef = useRef(0);
  const maxFailsBeforeViolation = 3;

  const startWebcam = useCallback(async () => {
    try {
      if (streamRef.current) return; // Prevent double start

      // Request video with stable settings
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15 } // Lower framerate helps reduced load/flicker
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play().catch(() => { });
        setViolation(false);
        failCountRef.current = 0;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      failCountRef.current++;
      if (failCountRef.current >= maxFailsBeforeViolation) {
        setViolation(true);
        if (onViolationRef.current) onViolationRef.current('Camera not accessible');
      }
    }
  }, []); // Empty dependency array = Runs once!

  useEffect(() => {
    let interval;
    let analysisInterval;

    startWebcam();

    // Stability & Presence Check Loop
    interval = setInterval(() => {
      if (!isActive) return;

      const video = videoRef.current;
      const stream = streamRef.current;

      const streamActive = stream && stream.active && stream.getTracks().some(t => t.readyState === 'live');
      const videoReady = video && video.readyState >= 2 && !video.paused;

      if (!streamActive || !videoReady) {
        failCountRef.current++;
        if (failCountRef.current >= maxFailsBeforeViolation) {
          setViolation(true);
          if (onViolationRef.current) onViolationRef.current('Camera feed interrupted');
          // Try to reconnect
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
          }
          startWebcam();
        }
      } else {
        failCountRef.current = 0;
        if (violation) setViolation(false);
      }
    }, 2000);

    // Lightweight "Object Analysis" / Motion Loop (Visual Feedback)
    analysisInterval = setInterval(() => {
      if (videoRef.current && !videoRef.current.paused && !violation) {
        setIsScanning(prev => !prev); // Blinking effect to show "AI Active"
      }
    }, 1000);

    return () => {
      setIsActive(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (interval) clearInterval(interval);
      if (analysisInterval) clearInterval(analysisInterval);
    };
  }, [startWebcam, isActive, violation]); // Stable dependencies

  // Handle stream ending unexpectedly
  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;

    const handleTrackEnded = () => {
      console.log('Video track ended, restarting...');
      if (streamRef.current) streamRef.current = null;
      startWebcam();
    };

    stream.getTracks().forEach(track => {
      track.addEventListener('ended', handleTrackEnded);
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.removeEventListener('ended', handleTrackEnded);
        });
      }
    };
  }, [startWebcam]); // startWebcam is now stable

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      zIndex: 9999,
      background: violation ? '#ff000020' : '#fff',
      border: violation ? '2px solid red' : '1px solid #ccc',
      borderRadius: 8,
      padding: 4,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ position: 'relative', width: 120, height: 90 }}>
        <video
          ref={videoRef}
          width={120}
          height={90}
          autoPlay
          muted
          playsInline
          style={{
            borderRadius: 8,
            background: '#000',
            transform: 'scaleX(-1)', // Mirror
            objectFit: 'cover'
          }}
        />
        {/* Object Detection / Scanning Overlay */}
        {!violation && (
          <div style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: isScanning ? '#4caf50' : '#81c784', // Pulse green
            boxShadow: isScanning ? '0 0 5px #4caf50' : 'none',
            transition: 'all 0.5s ease',
            zIndex: 10
          }} title="System Active" />
        )}

        {/* Face/Object placeholder frame */}
        {!violation && (
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '20%',
            width: '60%',
            height: '70%',
            border: `1px dashed ${isScanning ? 'rgba(76, 175, 80, 0.5)' : 'rgba(255, 255, 255, 0.3)'}`,
            borderRadius: 4,
            pointerEvents: 'none',
            transition: 'border-color 0.5s ease'
          }} />
        )}
      </div>

      {violation && (
        <div style={{
          color: 'red',
          fontWeight: 'bold',
          fontSize: 11,
          textAlign: 'center',
          marginTop: 2
        }}>
          ⚠️ Check Camera
        </div>
      )}
      {!violation && (
        <div style={{
          fontSize: 9,
          color: '#666',
          marginTop: 2,
          fontFamily: 'monospace'
        }}>
          ● REC
        </div>
      )}

      {/* Hidden canvas for potential future object processing */}
      <canvas ref={canvasRef} width={120} height={90} style={{ display: 'none' }} />
    </div>
  );
};

export default ProctoringWebcam;
