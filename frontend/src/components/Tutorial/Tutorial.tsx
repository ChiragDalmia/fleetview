import { useState } from "react";

const STEPS = [
  { title: "Welcome to FleetView",    body: "Live fleet camera monitoring in real time. Here's a 30-second tour." },
  { title: "Your vehicles",           body: "The left panel lists every vehicle and its live status — moving or idle." },
  { title: "Live map",                body: "Each dot is a vehicle driving its route. The dashed blue box is a geofence zone." },
  { title: "Cameras & telemetry",     body: "Click any vehicle to open its dashcam feed plus live speed and status." },
  { title: "Alerts & settings",       body: "Speeding, geofence and hard-braking alerts appear automatically. Add a map key in Settings for premium tiles." },
];

export function Tutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-sm p-6">
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, n) => (
            <div key={n} className={`h-1 flex-1 rounded-full ${n <= i ? "bg-blue-500" : "bg-gray-700"}`} />
          ))}
        </div>

        <h2 className="font-bold text-white text-lg mb-2">{step.title}</h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">{step.body}</p>

        <div className="flex items-center justify-between">
          <button onClick={onDone} className="text-gray-500 hover:text-gray-300 text-sm">Skip</button>
          <button
            onClick={() => (last ? onDone() : setI(i + 1))}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg px-5 py-2 transition-colors"
          >
            {last ? "Get started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
