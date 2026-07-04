import { useEffect, useState } from 'react';
import { useJobStore } from './store/useJobStore';
import { setupSocketListeners } from './api/socket';
import { fetchJobs, createJob } from './api/jobs';
import { Loader2, Plus, Film, Clock, MonitorPlay, Download } from 'lucide-react';

function App() {
  const { jobs, setJobs } = useJobStore();
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setupSocketListeners();
    fetchJobs().then(setJobs).catch(console.error);
  }, [setJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsSubmitting(true);
    try {
      await createJob(prompt);
      setPrompt('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'WAITING': return 'bg-yellow-500/20 text-yellow-500';
      case 'RUNNING': 
      case 'GENERATING':
      case 'RENDERING': return 'bg-blue-500/20 text-blue-400 animate-pulse';
      case 'COMPLETED': return 'bg-green-500/20 text-green-400';
      case 'FAILED': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4 font-sans">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Google Flow Ultra Farm
        </h1>
        <p className="text-gray-400 mt-2">Generate high-quality AI videos remotely</p>
      </header>

      {/* Input Form */}
      <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700/50 mb-10">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-300">Prompt</label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none h-32"
          />
          <button 
            type="submit" 
            disabled={isSubmitting || !prompt.trim()}
            className="self-end bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-xl flex items-center gap-2 transition-all"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Generate Video
          </button>
        </form>
      </div>

      {/* Jobs List */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Film className="w-6 h-6 text-purple-400" />
        Render History
      </h2>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-gray-800 rounded-2xl p-5 shadow-lg border border-gray-700/50 flex flex-col md:flex-row gap-6 transition-all hover:border-gray-600">
            {/* Thumbnail Placeholder or Video */}
            <div className="w-full md:w-48 h-32 bg-gray-900 rounded-xl flex items-center justify-center shrink-0 border border-gray-800 overflow-hidden relative">
              {job.videoUrl ? (
                <video src={job.videoUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline />
              ) : (
                <MonitorPlay className="w-8 h-8 text-gray-700" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(job.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 text-sm italic border-l-2 border-gray-700 pl-3 py-1 my-3 line-clamp-2">
                  "{job.prompt}"
                </p>
              </div>

              {job.videoUrl && (
                <a 
                  href={job.videoUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="self-start text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              )}
            </div>
          </div>
        ))}

        {jobs.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <MonitorPlay className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>No jobs found. Create your first video above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
