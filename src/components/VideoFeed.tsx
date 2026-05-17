import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Loader2, Play, User, Calendar, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface UserVideo {
  id: string;
  video_url: string;
  title: string;
  sender_username: string;
  created_at: string;
  is_private: boolean;
  thumbnail_url?: string;
}

export default function VideoFeed() {
  const [videos, setVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        const { data, error } = await supabase
          .from('user_videos')
          .select('*')
          .eq('is_private', false)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#050505]">
        <Loader2 className="w-10 h-10 text-[#22c55e] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] p-6 scrollbar-hide">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col items-center text-center">
            <div className="px-4 py-1.5 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-full text-[#22c55e] text-[10px] font-black uppercase tracking-[0.3em] mb-4 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                Live Sovereign Broadcasts
            </div>
            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">رادار فيديوهات المستكشفين</h2>
            <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                <ShieldCheck className="w-3 h-3 text-[#22c55e]" />
                Encrypted Visual Streams Active
            </div>
        </header>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600 border border-white/5 bg-black/40 rounded-3xl">
            <Play className="w-16 h-16 opacity-10 mb-6" />
            <p className="font-bold text-sm uppercase tracking-widest">لم يتم العثور على بث عام حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((vid, idx) => (
              <motion.div 
                key={vid.id || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#080808] border border-white/5 rounded-2xl overflow-hidden group hover:border-[#22c55e]/30 transition-all duration-500 shadow-2xl"
              >
                <div className="relative aspect-video bg-black overflow-hidden">
                    <video 
                        src={vid.video_url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        controls
                        poster={vid.thumbnail_url}
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                        ARCHIVED
                    </div>
                </div>
                
                <div className="p-4 space-y-3" dir="rtl">
                    <h4 className="text-white font-bold text-sm line-clamp-1 group-hover:text-[#22c55e] transition-colors">{vid.title || 'فيديو مستكشف سيادي'}</h4>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400">
                            <User className="w-3 h-3 text-[#22c55e]" />
                            <span className="text-[10px] font-bold">{vid.sender_username}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[9px] font-mono">
                                {vid.created_at ? new Date(vid.created_at).toLocaleDateString('ar-SA') : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
