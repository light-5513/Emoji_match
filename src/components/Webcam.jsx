import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

const Webcam = forwardRef(function Webcam({ frozenImage }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720, facingMode: 'user' },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        attachStream();
        setReady(true);
      } catch (err) {
        setError(err?.message || 'Unable to access webcam.');
      }
    }

    start();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Re-attach the stream every time the video element re-appears (e.g. after a frozen
  // image is cleared for the next round). Without this, a fresh <video> node renders
  // without srcObject set and the user sees a black box.
  function attachStream() {
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.play().catch(() => {});
  }

  useEffect(() => {
    if (!frozenImage) attachStream();
  }, [frozenImage, ready]);

  useImperativeHandle(ref, () => ({
    capture() {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return null;
      const canvas = document.createElement('canvas');
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.85);
    }
  }));

  return (
    <div className="relative w-full h-full overflow-hidden rounded-2xl bg-slate-900">
      {/* Always keep the video mounted so the stream stays attached across rounds. */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {frozenImage ? (
        <img
          src={frozenImage}
          alt="Captured frame"
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center text-white text-center px-6 bg-slate-900/90">
          <div>
            <div className="text-4xl mb-3">📷</div>
            <div className="font-semibold">Camera unavailable</div>
            <div className="text-sm opacity-80 mt-1">{error}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default Webcam;
