import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, RotateCw, ZoomIn, ZoomOut, Sun, Contrast, Play, Pause } from "lucide-react";

const ImageEditor = ({ src, onConfirm, onCancel }) => {
  const canvasRef = useRef(null);
  const imgEl = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const SIZE = 340;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgEl.current;
    if (!canvas || !img || !img.complete) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.save();
    ctx.translate(SIZE / 2 + offset.x, SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    const scale = Math.max(SIZE / img.width, SIZE / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
    ctx.filter = "none";
  }, [zoom, brightness, contrast, rotation, offset]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => { imgEl.current = img; draw(); };
  }, [src]);

  useEffect(() => { draw(); }, [draw]);

  const start = (x, y) => { dragging.current = true; lastPos.current = { x, y }; };
  const move = (x, y) => {
    if (!dragging.current) return;
    setOffset(p => ({ x: p.x + x - lastPos.current.x, y: p.y + y - lastPos.current.y }));
    lastPos.current = { x, y };
  };
  const stop = () => { dragging.current = false; };

  const handleConfirm = () => {
    canvasRef.current.toBlob(blob => onConfirm(blob), "image/jpeg", 0.88);
  };

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Ajuster la photo</h3>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100"><X size={20}/></button>
        </div>

        <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden border-2 border-brand-light" style={{ height: SIZE }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE}
            style={{ width: "100%", height: "100%", cursor: "grab", touchAction: "none" }}
            onMouseDown={e => start(e.clientX, e.clientY)}
            onMouseMove={e => move(e.clientX, e.clientY)}
            onMouseUp={stop} onMouseLeave={stop}
            onTouchStart={e => start(e.touches[0].clientX, e.touches[0].clientY)}
            onTouchMove={e => { e.preventDefault(); move(e.touches[0].clientX, e.touches[0].clientY); }}
            onTouchEnd={stop}
          />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-3 left-3 w-6 h-6 border-t-[3px] border-l-[3px] border-brand"/>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-[3px] border-r-[3px] border-brand"/>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-[3px] border-l-[3px] border-brand"/>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-[3px] border-r-[3px] border-brand"/>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-1">Glisse pour repositionner</p>

        <div className="px-4 pb-2 space-y-3 mt-3">
          {[
            { label: "Zoom", icon: <ZoomIn size={14}/>, min: 0.5, max: 3, step: 0.05, val: zoom, set: setZoom, fmt: v => `${Math.round(v*100)}%` },
            { label: "Luminosite", icon: <Sun size={14}/>, min: 50, max: 150, step: 1, val: brightness, set: setBrightness, fmt: v => `${v}%` },
            { label: "Contraste", icon: <Contrast size={14}/>, min: 50, max: 150, step: 1, val: contrast, set: setContrast, fmt: v => `${v}%` },
          ].map(({ label, icon, min, max, step, val, set, fmt }) => (
            <div key={label}>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="flex items-center gap-1">{icon} {label}</span>
                <span className="font-bold text-brand">{fmt(val)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={val}
                onChange={e => set(+e.target.value)} className="w-full h-2 accent-brand"/>
            </div>
          ))}

          <div className="flex gap-2 justify-center pt-1">
            {[90, 180, 270].map(deg => (
              <button key={deg} onClick={() => setRotation(deg)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${rotation===deg?"bg-brand text-white border-brand":"border-gray-200 text-gray-600"}`}>
                <RotateCw size={13}/>{deg}deg
              </button>
            ))}
            <button onClick={() => { setRotation(0); setOffset({x:0,y:0}); setZoom(1); setBrightness(100); setContrast(100); }}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 text-gray-500">
              Reset
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-4">
          <button onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-bold text-gray-600">Annuler</button>
          <button onClick={handleConfirm} className="flex-1 py-3 bg-brand text-white rounded-full font-bold shadow-lg">Utiliser</button>
        </div>
      </div>
    </div>
  );
};

const VideoEditor = ({ src, onConfirm, onCancel }) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const fmt = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}`;

  const handleLoaded = () => {
    const d = videoRef.current.duration;
    setDuration(d); setEndTime(d);
  };

  const preview = () => {
    const v = videoRef.current;
    v.currentTime = startTime; v.play(); setPlaying(true);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (v.currentTime >= endTime) { v.pause(); setPlaying(false); clearInterval(timer.current); }
    }, 100);
  };

  const stopPreview = () => { videoRef.current.pause(); setPlaying(false); clearInterval(timer.current); };
  useEffect(() => () => clearInterval(timer.current), []);

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Ajuster la video</h3>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100"><X size={20}/></button>
        </div>

        <div className="mx-4 mt-4 rounded-2xl overflow-hidden bg-black">
          <video ref={videoRef} src={src} className="w-full max-h-56 object-contain" onLoadedMetadata={handleLoaded}/>
        </div>

        {duration > 0 && (
          <div className="px-4 mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-brand-light rounded-xl p-2"><p className="text-xs text-gray-500">Debut</p><p className="font-bold text-brand">{fmt(startTime)}</p></div>
              <div className="bg-brand-light rounded-xl p-2"><p className="text-xs text-gray-500">Duree</p><p className="font-bold text-brand">{fmt(endTime-startTime)}</p></div>
              <div className="bg-brand-light rounded-xl p-2"><p className="text-xs text-gray-500">Fin</p><p className="font-bold text-brand">{fmt(endTime)}</p></div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Point de depart</label>
              <input type="range" min="0" max={endTime-0.5} step="0.1" value={startTime}
                onChange={e => { const v=+e.target.value; setStartTime(v); videoRef.current.currentTime=v; }}
                className="w-full h-2 accent-brand"/>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Point de fin</label>
              <input type="range" min={startTime+0.5} max={duration} step="0.1" value={endTime}
                onChange={e => setEndTime(+e.target.value)} className="w-full h-2 accent-brand"/>
            </div>

            <button onClick={playing ? stopPreview : preview}
              className="w-full py-2.5 bg-brand-light text-brand font-bold rounded-full flex items-center justify-center gap-2">
              {playing ? <><Pause size={16}/>Arreter</> : <><Play size={16}/>Apercu ({fmt(endTime-startTime)})</>}
            </button>
          </div>
        )}

        <div className="flex gap-3 p-4 mt-2">
          <button onClick={onCancel} className="flex-1 py-3 border-2 border-gray-200 rounded-full font-bold text-gray-600">Annuler</button>
          <button onClick={() => onConfirm({ startTime, endTime })} className="flex-1 py-3 bg-brand text-white rounded-full font-bold shadow-lg">Valider</button>
        </div>
      </div>
    </div>
  );
};

const MediaEditor = ({ file, localUrl, onConfirm, onCancel }) => {
  if (!file || !localUrl) return null;
  if (file.type.startsWith("video/"))
    return <VideoEditor src={localUrl} onConfirm={onConfirm} onCancel={onCancel}/>;
  return <ImageEditor src={localUrl} onConfirm={onConfirm} onCancel={onCancel}/>;
};

export default MediaEditor;
