
import React, { useState, useRef, useEffect } from 'react';

interface PrescriptionUploadProps {
  onUpload: (file: File | string) => void;
  isProcessing: boolean;
}

const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({ onUpload, isProcessing }) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stages = [
    "Capturing high-definition frames...",
    "Scanning handwriting patterns...",
    "Decoding doctor's medical script...",
    "Cross-referencing drug databases...",
    "Validating clinical dosages...",
    "Translating instructions..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const startCamera = async () => {
    try {
      setMode('camera');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 4096 }, 
          height: { ideal: 2160 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Please allow camera access for high-accuracy medical scanning.");
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
      <div className="bg-white rounded-[4rem] border-8 border-slate-100 shadow-2xl overflow-hidden min-h-[550px] flex flex-col relative">
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
             <div className="relative mb-12">
                <div className="w-36 h-36 border-[12px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-5xl">🔬</div>
             </div>
             <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Analyzing Script</h3>
             <p className="text-slate-400 font-bold mb-8">AI is correcting handwriting ambiguities...</p>
             <div className="mt-4 space-y-4 w-full max-w-sm">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600 transition-all duration-700" style={{ width: `${((loadingStage + 1) / stages.length) * 100}%` }}></div>
                </div>
                <p className="text-blue-600 text-xl font-black italic animate-pulse h-8">
                   {stages[loadingStage]}
                </p>
             </div>
          </div>
        )}

        {mode === 'idle' && (
          <div className="flex-1 flex flex-col p-12 space-y-8">
            <div className="text-center mb-4">
               <h3 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Scan</h3>
               <p className="text-slate-500 font-bold text-lg mt-2 italic">Place prescription on a flat, well-lit surface</p>
            </div>

            <button 
              onClick={startCamera}
              className="flex-1 bg-blue-600 text-white rounded-[3.5rem] flex flex-col items-center justify-center space-y-6 hover:bg-blue-700 transition-all shadow-xl active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="text-8xl group-hover:scale-110 transition-transform relative z-10">📸</div>
              <div className="text-center relative z-10">
                <span className="block text-4xl font-black tracking-tight">Start Scan</span>
                <span className="text-lg opacity-80 font-black uppercase tracking-widest mt-1">HD Focus Enabled</span>
              </div>
            </button>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-8 bg-slate-50 text-slate-700 rounded-[2.5rem] font-black text-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-white transition-all active:scale-95 flex items-center justify-center gap-4"
            >
              <span>🖼️</span> Import from Photos
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
        )}

        {mode === 'camera' && (
          <div className="relative flex-1 bg-black overflow-hidden flex flex-col">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Focus Guard Visual Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10">
               <div className="w-full h-full border-4 border-white/40 border-dashed rounded-[3rem] relative">
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-blue-500 rounded-tl-3xl"></div>
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-blue-500 rounded-tr-3xl"></div>
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-blue-500 rounded-bl-3xl"></div>
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-blue-500 rounded-br-3xl"></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
                       <p className="text-white font-black text-xs uppercase tracking-[0.2em] text-center">
                         Keep Text within Frame
                       </p>
                    </div>
                  </div>
               </div>
            </div>

            <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-10 px-10">
              <button 
                onClick={() => { stopCamera(); setMode('idle'); }} 
                className="w-16 h-16 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center text-2xl shadow-lg"
              >
                ✕
              </button>
              <button 
                onClick={capturePhoto} 
                className="w-24 h-24 bg-white rounded-full border-8 border-blue-600 shadow-2xl active:scale-90 transition-all flex items-center justify-center"
              >
                <div className="w-14 h-14 bg-blue-600 rounded-full animate-pulse"></div>
              </button>
              <div className="w-16 h-16"></div>
            </div>
          </div>
        )}

        {mode === 'preview' && previewUrl && (
          <div className="flex-1 flex flex-col p-8 bg-white">
            <div className="text-center mb-6">
               <h4 className="text-3xl font-black text-slate-800 tracking-tight">Confirm Details</h4>
               <p className="text-slate-400 font-bold">Ensure medicine names are clearly visible</p>
            </div>
            
            <div className="flex-1 relative rounded-[2.5rem] overflow-hidden border-4 border-slate-100 shadow-inner">
              <img src={previewUrl} className="w-full h-full object-contain bg-slate-50" />
            </div>

            <div className="mt-8 flex gap-4">
               <button 
                 onClick={() => setMode('idle')} 
                 className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xl hover:bg-slate-200 transition-all"
               >
                 Retake
               </button>
               <button 
                 onClick={handleFinalSubmit}
                 className="flex-[2] py-6 bg-blue-600 text-white rounded-[2rem] font-black text-2xl shadow-xl hover:bg-blue-700 transition-all"
               >
                 Confirm Scan
               </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-slate-900 rounded-[2.5rem] text-white shadow-xl flex items-center gap-6 border-4 border-slate-800">
         <div className="text-4xl">🎓</div>
         <div>
            <h4 className="text-lg font-black mb-0.5">Clinical Recognition</h4>
            <p className="text-slate-400 font-bold text-sm leading-snug">
               Our AI uses a medical database to cross-reference common doctor's handwriting patterns.
            </p>
         </div>
      </div>
    </div>
  );
};

export default PrescriptionUpload;
