import { Button } from './ui/button';
import { useTopics } from '../hooks/useTopics';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  ArrowLeft, 
  ChevronRight, 
  Zap, 
  Calendar,
  Terminal
} from 'lucide-react';

export default function FriendTopics() {
  const { 
    friendTopics,
    friendTopicsLoading: loading,
    friendTopicsError: error
  } = useTopics();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-orange-50/50">
        <div className="w-16 h-16 border-8 border-black border-t-purple-500 animate-spin shadow-neo" />
        <p className="font-black uppercase tracking-widest text-xl italic">Syncing Squad Frequencies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8 bg-orange-50/50 min-h-screen flex items-center justify-center">
        <div className="neo-brutal-card bg-red-100 p-8 text-center border-red-600 max-w-lg">
          <Terminal className="h-16 w-16 mx-auto text-red-600 mb-4" />
          <h2 className="text-2xl font-black uppercase text-red-600 mb-2">Signal Interrupted</h2>
          <p className="font-bold text-red-800">{error}</p>
          <Button onClick={() => navigate('/')} className="mt-6 bg-black text-white font-black uppercase border-2 border-black shadow-neo px-8">
            Return HQ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl space-y-10 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border-4 border-black p-8 shadow-neo relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 border-b-2 border-l-2 border-black -mr-16 -mt-16 rotate-45" />
        <div className="relative z-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-2 flex items-center gap-3">
            <Users className="h-10 w-10 stroke-[3]" />
            Squad Intel
          </h1>
          <p className="font-bold text-gray-600 uppercase tracking-widest text-xs italic">Public transmissions from your active network operatives</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="relative z-10 border-2 border-black font-black uppercase text-xs shadow-neo-sm hover:bg-yellow-400 gap-2 transition-all"
        >
          <ArrowLeft className="h-4 w-4 stroke-[3]" />
          Return
        </Button>
      </div>

      {friendTopics.length === 0 ? (
        <div className="neo-brutal-card bg-gray-50 border-dashed border-4 border-black/10 py-32 text-center space-y-6">
          <MessageSquare className="h-20 w-20 mx-auto text-black/10 stroke-[1]" />
          <div>
            <p className="text-3xl font-black uppercase text-gray-400 italic">Static Airwaves</p>
            <p className="font-bold text-gray-400 mt-2">Your squad hasn't initiated any public protocols yet.</p>
          </div>
          <Button onClick={() => navigate('/search')} className="bg-black text-white font-black uppercase tracking-widest px-10 py-4 border-2 border-black shadow-neo">
            Find Operatives
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic whitespace-nowrap">Active Channels</h2>
            <div className="h-1 flex-1 bg-black" />
            <div className="px-3 py-1 border-2 border-black bg-black text-white text-[10px] font-black uppercase tracking-widest shadow-neo-sm">
              {friendTopics.length} SIGNALS_DETECTED
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {friendTopics.map((topic) => (
              <div 
                key={topic.id}
                className="neo-brutal-card bg-white group hover:-translate-y-1 transition-all overflow-hidden flex flex-col cursor-pointer"
                onClick={() => navigate(`/topics/${topic.id}`)}
              >
                <div className="bg-purple-400 p-4 border-b-2 border-black flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 fill-white text-white" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">LIVE_SIGNAL</span>
                  </div>
                  <span className="text-[8px] font-black uppercase bg-black text-white px-2 py-0.5 shadow-neo-sm">ID_{topic.id.toString().padStart(4, '0')}</span>
                </div>

                <div className="p-6 flex-1 space-y-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight italic group-hover:underline decoration-4 underline-offset-4 leading-none">
                    {topic.title}
                  </h3>
                  <p className="font-bold text-gray-600 line-clamp-2 italic leading-tight">
                    "{topic.description || 'No briefing recorded.'}"
                  </p>
                  
                  <div className="flex items-center gap-3 pt-2">
                    <div className="border-2 border-black shadow-neo-sm bg-white overflow-hidden h-8 w-8">
                      <Avatar className="rounded-none h-full w-full">
                        <AvatarImage src={topic.creatorAvatarUrl || undefined} className="rounded-none" />
                        <AvatarFallback className="rounded-none bg-orange-400 font-black text-[10px]">
                          {topic.creatorUsername?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-gray-400 block">Operative</span>
                      <span className="font-black uppercase tracking-tight text-xs">@{topic.creatorUsername}</span>
                    </div>
                  </div>
                </div>

                {topic.posts && topic.posts.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t-2 border-black/5 group-hover:bg-yellow-50 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Last Intel Log</span>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-3 top-0 bottom-0 w-1 bg-purple-400" />
                      <p className="text-xs font-bold text-gray-700 line-clamp-2 pl-3">
                        {topic.posts[0].content}
                      </p>
                    </div>
                  </div>
                )}

                <div className="px-6 py-3 bg-white border-t-2 border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[8px] font-black uppercase text-gray-400">
                    <Calendar className="h-3 w-3" />
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-[8px] font-black uppercase group-hover:gap-2 transition-all">
                    Intercept Intel <ChevronRight className="h-3 w-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
