import { useEffect, useRef } from "react";
import Hls from "hls.js";

interface Props {
  streamUrl: string;
  vehicleId: string;
}

export function VideoPlayer({ streamUrl, vehicleId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => hls.destroy();
    }

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => {});
    }
  }, [streamUrl]);

  return (
    <div
      className="relative bg-black rounded-2xl overflow-hidden aspect-video w-full"
      style={{ boxShadow: "0 8px 32px rgba(0,0,0,.5)" }}
    >
      {/* LIVE badge */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>

      {/* Vehicle HUD badge */}
      <div
        className="absolute top-2.5 right-2.5 z-10 text-white text-xs font-semibold px-2.5 py-1 rounded-full"
        style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      >
        {vehicleId}
      </div>

      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline controls />
    </div>
  );
}
