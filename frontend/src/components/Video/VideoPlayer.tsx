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

    // Safari: native HLS support
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = streamUrl;
      video.play().catch(() => {});
    }
  }, [streamUrl]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden aspect-video w-full">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        LIVE
      </div>
      <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded font-mono">
        {vehicleId}
      </div>
      <video ref={videoRef} className="w-full h-full object-cover" muted playsInline controls />
    </div>
  );
}
