
import React, { useState, useRef } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: File | string) => void;
  isProcessing: boolean;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload, isProcessing }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera access or upload a saved photo.");
      setMode('idle');
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      const video = videoRef.current;
      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;
      context?.drawImage(video, 0, 0);
      
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      setPreviewUrl(dataUrl);
      setMode('preview');
      stopCamera();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target?.result as string);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSubmit = () => {
    if (previewUrl) {
      onUpload(previewUrl);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-2xl overflow-hidden min-h-[500px] flex flex-col relative transition-all duration-500">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-in fade-in">
             <div className="relative mb-10">
                <div className="w-32 h-32 border-[12px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-4xl">🤖</div>
             </div>
             <h3 className="text-5xl font-black text-slate-900 tracking-tight">AI Reading...</h3>
             <p className="text-slate-500 text-2xl font-bold mt-6 leading-relaxed">
               I am carefully looking at your doctor's note.<br/>One moment please.
             </p>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8">
            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-2xl active:scale-95 group"
            >
              <div className="text-8xl group-hover:scale-110 transition-transform">📸</div>
              <div className="text-center">
                <span className="block text-4xl font-black">Open Camera</span>
                <span className="text-xl opacity-80 font-bold">Best for handwriting</span>
              </div>
            </button>
            
            <div className="flex items-center gap-6">
              <div className="flex-1 h-1 bg-slate-100"></div>
              <span className="text-slate-400 font-black uppercase tracking-widest text-lg">OR</span>
              <div className="flex-1 h-1 bg-slate-100"></div>
            </div>

            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-slate-50 text-slate-700 rounded-[2.5rem] font-black text-3xl border-4 border-slate-100 hover:border-blue-300 transition-all active:scale-95 flex items-center justify-center gap-6"
            >
              <span>📂</span> Choose from Gallery
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* High Contrast Guidelines */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
               <div className="w-[85%] h-[65%] border-4 border-white/40 border-dashed rounded-[3rem] relative shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]">
                  <div className="absolute top-0 left-0 w-12 h-12 border-t-8 border-l-8 border-blue-500 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-12 h-12 border-t-8 border-r-8 border-blue-500 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-12 h-12 border-b-8 border-l-8 border-blue-500 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-12 h-12 border-b-8 border-r-8 border-blue-500 rounded-br-2xl"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-white/60 font-black text-2xl uppercase tracking-[0.2em] text-center px-10">
                      Place paper inside this box
                    </p>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-12 left-0 right-0 flex justify-center items-center gap-12 px-10">
              <button 
                onClick={() => { stopCamera(); setMode('idle'); }} 
                className="w-24 h-24 bg-red-500/90 backdrop-blur-md text-white rounded-full flex items-center justify-center text-4xl shadow-2xl active:scale-90"
              >
                ✕
              </button>
              <button 
                onClick={capturePhoto} 
                className="w-32 h-32 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-all flex items-center justify-center"
              >
                <div className="w-20 h-20 bg-blue-600 rounded-full"></div>
              </button>
              <div className="w-24 h-24"></div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-10 bg-white">
            <div className="text-center mb-8">
               <h4 className="text-3xl font-black text-slate-800">Is this clear?</h4>
               <p className="text-slate-400 font-bold text-lg">Make sure all words are readable.</p>
            </div>
            
            <div className="flex-1 relative rounded-[3rem] overflow-hidden border-4 border-slate-100 shadow-inner group">
              <img src={previewUrl} className="w-full h-full object-contain bg-slate-50" />
            </div>

            <div className="mt-10 flex gap-6">
               <button 
                 onClick={() => setMode('idle')} 
                 className="flex-1 py-7 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-2xl hover:bg-slate-200 transition-all active:scale-95"
               >
                 Retake
               </button>
               <button 
                 onClick={handleFinalSubmit}
                 className="flex-[2] py-7 bg-blue-600 text-white rounded-[2rem] font-black text-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
               >
                 Yes, Read It
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="p-8 bg-emerald-50 rounded-[2.5rem] border-4 border-emerald-100 flex items-center gap-6 shadow-sm">
          <span className="text-5xl">🔦</span>
          <p className="text-emerald-800 font-black leading-tight text-xl">Use bright light for better reading.</p>
        </div>
        <div className="p-8 bg-amber-50 rounded-[2.5rem] border-4 border-amber-100 flex items-center gap-6 shadow-sm">
          <span className="text-5xl">📄</span>
          <p className="text-amber-800 font-black leading-tight text-xl">Keep the paper flat and steady.</p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;
