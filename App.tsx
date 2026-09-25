import { useEffect, useState } from 'react';
import { Terminal, Code2, Layers, Cpu, Play, CheckCircle2, Camera } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'environment'>('overview');
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImagePreview((previousPreview) => {
      if (previousPreview) URL.revokeObjectURL(previousPreview);
      return URL.createObjectURL(file);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-base text-slate-100 tracking-tight">DevStudio</h1>
            <p className="text-xs text-slate-400">Environment Siap Pengembangan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Code2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">Frontend Stack</h2>
            </div>
            <p className="text-xs text-slate-400">React 19 + TypeScript + Tailwind CSS terpasang dan siap digunakan.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">AI & Services</h2>
            </div>
            <p className="text-xs text-slate-400">@google/genai SDK siap untuk backend/full-stack routing.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-200">Status Runtime</h2>
            </div>
            <p className="text-xs text-slate-400">Protokol token hemat aktif. Siap menerima instruksi fitur atau kode.</p>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-semibold text-slate-200">Instruksi Proyek</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1 rounded text-xs transition ${activeTab === 'overview' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Ringkasan
              </button>
              <button
                onClick={() => setActiveTab('environment')}
                className={`px-3 py-1 rounded text-xs transition ${activeTab === 'environment' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Konfigurasi
              </button>
            </div>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Lingkungan pengembang telah dikonfigurasi. Silakan berikan spesifikasi aplikasi, fitur, atau kode yang ingin dibuat.
              </p>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                <label htmlFor="itemPhotoInput" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-200">
                  <Camera className="h-4 w-4 text-amber-400" />
                  Foto Produk (Kamera HP)
                </label>
                <input
                  id="itemPhotoInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="block w-full cursor-pointer rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-amber-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-950 hover:border-slate-600"
                />
                {imagePreview && (
                  <div className="mt-3 text-center">
                    <img
                      src={imagePreview}
                      alt="Pratinjau Foto"
                      className="mx-auto h-[150px] w-[150px] rounded-lg border border-slate-700 object-cover"
                    />
                  </div>
                )}
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 flex items-center justify-between">
                <span>Siap menerima instruksi build berikutnya...</span>
                <Play className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
          ) : (
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-800/60 py-1.5 text-slate-400">
                <span>Vite Dev Server</span>
                <span className="text-slate-200">Port 3000</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/60 py-1.5 text-slate-400">
                <span>UI Library</span>
                <span className="text-slate-200">Tailwind CSS v4 + Lucide Icons</span>
              </div>
              <div className="flex justify-between py-1.5 text-slate-400">
                <span>Protokol Respons</span>
                <span className="text-slate-200">Hemat Token & Terfokus</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
