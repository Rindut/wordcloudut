"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SessionWithCounts } from "@/lib/types";


export default function ListSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [sessionOrder, setSessionOrder] = useState<string[]>([]);
  const [topWords, setTopWords] = useState<{ [key: string]: any[] }>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  // Save session order to database
  const saveSessionOrder = async (order: string[]) => {
    try {
      const response = await fetch('/api/wordcloud/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionIds: order })
      });
      
      if (!response.ok) {
        console.error('Failed to save session order');
      }
    } catch (error) {
      console.error('Failed to save session order:', error);
    }
  };

  const fetchSessions = async () => {
    try {
      // Fetch sessions and order in parallel
      const [sessionsResponse, orderResponse] = await Promise.all([
        fetch("/api/wordcloud/list"),
        fetch('/api/wordcloud/order')
      ]);

      if (sessionsResponse.ok) {
        const data = await sessionsResponse.json();
        
        // Load session order
        let savedOrder: string[] = [];
        
        if (orderResponse.ok) {
          const orderData = await orderResponse.json();
          savedOrder = orderData.order.map((item: any) => item.session_id);
          setSessionOrder(savedOrder);
        }
        
        // If we have a saved order, apply it
        if (savedOrder.length > 0) {
          const orderedSessions = savedOrder
            .map(id => data.find((session: SessionWithCounts) => session.id === id))
            .filter(Boolean) as SessionWithCounts[];
          
          // Add any new sessions that weren't in the saved order
          const newSessions = data.filter((session: SessionWithCounts) => 
            !savedOrder.includes(session.id)
          );
          
          setSessions([...orderedSessions, ...newSessions]);
        } else {
          setSessions(data);
        }

        // Fetch top words for all sessions in parallel (only once)
        const topWordsPromises = data.map((session: SessionWithCounts) =>
          fetch(`/api/wordcloud/${session.id}/top-words`)
            .then(res => res.ok ? res.json() : { words: [] })
            .then(result => ({ sessionId: session.id, words: result.words || [] }))
        );
        
        const topWordsResults = await Promise.all(topWordsPromises);
        const topWordsData: { [key: string]: any[] } = {};
        topWordsResults.forEach(({ sessionId, words }) => {
          topWordsData[sessionId] = words;
        });
        setTopWords(topWordsData);
      } else {
        setError("Failed to fetch sessions");
      }
    } catch (err) {
      setError("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/wordcloud/${sessionId}/session`, {
        method: "DELETE",
      });

      if (response.ok) {
        const newSessions = sessions.filter(s => s.id !== sessionId);
        setSessions(newSessions);
        
        // Update the saved order
        const newOrder = newSessions.map(session => session.id);
        setSessionOrder(newOrder);
        saveSessionOrder(newOrder);
      } else {
        alert("Failed to delete session");
      }
    } catch (err) {
      alert("Failed to delete session");
    }
  };

  const copyJoinLink = (sessionId: string) => {
    const url = `${window.location.origin}/join/${sessionId}`;
    navigator.clipboard.writeText(url);
    alert("Join link copied to clipboard!");
  };

  const handleStartSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to start this session?")) {
      return;
    }

    try {
      const response = await fetch(`/api/wordcloud/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "live" }),
      });

      if (response.ok) {
        // Update the local state to reflect the status change
        setSessions(sessions.map(s => 
          s.id === sessionId ? { ...s, status: "live" } : s
        ));
        alert("Session started successfully!");
      } else {
        alert("Failed to start session");
      }
    } catch (err) {
      alert("Failed to start session");
    }
  };

  const handleStopSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to stop this session?")) {
      return;
    }

    try {
      const response = await fetch(`/api/wordcloud/${sessionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });

      if (response.ok) {
        // Update the local state to reflect the status change
        setSessions(sessions.map(s => 
          s.id === sessionId ? { ...s, status: "closed" } : s
        ));
        alert("Session stopped successfully!");
      } else {
        alert("Failed to stop session");
      }
    } catch (err) {
      alert("Failed to stop session");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newSessions = [...sessions];
    const draggedSession = newSessions[draggedIndex];
    
    // Remove the dragged item
    newSessions.splice(draggedIndex, 1);
    
    // Insert it at the new position
    newSessions.splice(dropIndex, 0, draggedSession);
    
    setSessions(newSessions);
    
    // Save the new order to localStorage
    const newOrder = newSessions.map(session => session.id);
    setSessionOrder(newOrder);
    saveSessionOrder(newOrder);
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen"
        style={{
          backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="max-w-[420px] mx-auto flex flex-col items-center justify-center p-6 gap-6 min-h-screen" style={{ backgroundColor: 'transparent' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                   <p className="text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-bg.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="max-w-[420px] mx-auto flex flex-col items-center p-6 gap-6" style={{ backgroundColor: 'transparent' }}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img 
              src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/dukcatil-logo-03.png" 
              alt="DUKCATIL Logo" 
              className="h-20 w-auto mx-auto mb-4"
              style={{ maxWidth: '100%', transform: 'scale(0.8)' }}
              onError={(e) => {
                // Fallback to cat emoji if logo doesn't exist
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            <span className="text-3xl" style={{ display: 'none' }}>🐱</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', letterSpacing: '5px', fontSize: 'calc(2.25rem + 5px)', textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
            ADMINISTRATOR
          </h1>
        </div>

        {/* Spacing Container */}
        <div style={{ height: '20px' }}></div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6" style={{ paddingTop: '0px', paddingBottom: '0px', alignItems: 'center', justifyContent: 'center' }}>
          {/* Button wrapper with locked dimensions */}
            <div style={{ 
              width: '175px', 
              height: '70px', 
              overflow: 'hidden',
              position: 'relative'
            }}>
            <img
              src="https://tyvwbdnianacqckvolco.supabase.co/storage/v1/object/public/assets/create-session.png"
              alt="Create New Session"
              className="cursor-pointer transition-all duration-300 transform hover:scale-105"
              style={{ 
                transform: 'scale(0.4)', 
                transformOrigin: 'top left',
                position: 'absolute',
                top: '0',
                left: '0'
              }}
              onClick={() => router.push("/create")}
              onError={(e) => {
                // Fallback to button if image doesn't load
                e.currentTarget.style.display = 'none';
                const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                if (nextElement) {
                  nextElement.style.display = 'block';
                }
              }}
            />
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              style={{ 
                fontFamily: 'Fredoka, sans-serif', 
                display: 'none',
                position: 'absolute',
                top: '0',
                left: '0'
              }}
            >
              Create New Session
            </button>
          </div>
        </div>

        {/* Spacing Container */}
        <div style={{ height: '20px' }}></div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>{error}</p>
          </div>
        )}

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>No Sessions Yet</h3>
            <p className="text-gray-600 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              You haven't created any word cloud sessions yet.
            </p>
            <button
              onClick={() => router.push("/create")}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              Create Your First Session
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {sessions.map((session, index) => (
              <div key={session.id}>
                {/* Spacing Container */}
                {index > 0 && <div style={{ height: '15px' }}></div>}
                
                <div
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-300 cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: draggedIndex === index ? 0.5 : 1,
                    transform: draggedIndex === index ? 'rotate(2deg)' : 'none',
                    transition: 'all 0.2s ease',
                    padding: '11px'
                  }}
                >
                {/* Top Row - Start/Stop Session (Left) and Status (Right) */}
                <div className="flex justify-between items-center mb-4">
                  {/* View RESULT, Copy Link JOIN, and Start/Stop Session - Left */}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => router.push(`/presenter/${session.id}`)}
                      className="py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-xs"
                      style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                    >
                      View RESULT
                    </button>
                    <button
                      onClick={() => copyJoinLink(session.id)}
                      className="py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-xs"
                      style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                    >
                      Copy Link JOIN
                    </button>
                    {session.status === "draft" && (
                      <button
                        onClick={() => handleStartSession(session.id)}
                        className="py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-xs"
                        style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                      >
                        Start Session
                      </button>
                    )}
                    {session.status === "live" && (
                      <button
                        onClick={() => handleStopSession(session.id)}
                        className="py-1 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors text-xs"
                        style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                      >
                        Stop Session
                      </button>
                    )}
                  </div>
                  
                  {/* Status and Dot - Right */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        session.status
                      )}`}
                      style={{ fontFamily: 'Fredoka, sans-serif' }}
                    >
                      {session.status.toUpperCase()}
                    </span>
                    <span className="text-xs font-bold text-gray-500" style={{ fontFamily: 'Fredoka, sans-serif' }}>.</span>
                    {/* Status Dot */}
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: session.status === 'live' ? '#ef4444' :
                                       session.status === 'closed' ? '#6b7280' :
                                       session.status === 'draft' ? '#8b5cf6' : '#6b7280',
                        minWidth: '12px',
                        minHeight: '12px'
                      }}
                      title={`Status: ${session.status}`}
                    ></div>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex-1">
                    {/* Spacing Container */}
                    <div style={{ height: '20px' }}></div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-500 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                          {(sessionOrder.findIndex(id => id === session.id) + 1) || (index + 1)}
                        </span>
                        <span className="text-sm font-bold text-gray-500" style={{ fontFamily: 'Fredoka, sans-serif' }}>.</span>
                        <h3 className="text-sm sm:text-base font-semibold" style={{ color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontFamily: 'Fredoka, sans-serif', fontWeight: '600', marginLeft: '8px' }}>
                          {session.question}
                        </h3>
                      </div>
                    </div>

                    {/* Spacing container after question */}
                    <div style={{ height: '1rem' }}></div>

                {/* Statistics Boxes */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                      {session.participant_count}
                    </div>
                    <div style={{ height: '0.5rem' }}></div>
                    <div className="text-xs text-blue-700 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      Participants
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                      {session.word_count}
                    </div>
                    <div style={{ height: '0.5rem' }}></div>
                    <div className="text-xs text-green-700 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      Words
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                      {session.total_entries}
                    </div>
                    <div style={{ height: '0.5rem' }}></div>
                    <div className="text-xs text-orange-700 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      Entries
                    </div>
                  </div>
                </div>


                    {session.time_limit_sec && (
                      <div className="mt-2 text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                        <span className="font-medium">Time limit:</span>{" "}
                        {Math.floor(session.time_limit_sec / 60)} minutes
                      </div>
                    )}

                    {session.grouping_enabled && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                          🧠 Smart Grouping Enabled
                        </span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Spacing above Session ID */}
                <div style={{ height: '1rem' }}></div>

                {/* Created */}
                <div className="mb-3">
                  <span className="text-xs font-medium" style={{ fontFamily: 'Fredoka, sans-serif', color: '#9ca3af', fontSize: '10px' }}>Created:</span>
                  <span className="text-xs ml-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#9ca3af', fontSize: '10px' }}>{formatDate(session.created_at)}</span>
                </div>

                {/* Top 3 Words */}
                {topWords[session.id] && topWords[session.id].length > 0 && (
                  <div className="mb-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium" style={{ fontFamily: 'Fredoka, sans-serif', color: '#9ca3af', fontSize: '10px' }}>
                      Top 3 Input:
                    </span>
                    {topWords[session.id].map((word: any, idx: number) => (
                      <span key={idx} className="text-xs" style={{ fontFamily: 'Fredoka, sans-serif', color: '#9ca3af', fontSize: '10px' }}>
                        {word.display_word} ({word.count}){idx < topWords[session.id].length - 1 ? ' - ' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Session ID */}
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ fontFamily: 'Fredoka, sans-serif', color: '#9ca3af', fontSize: '10px' }}>Session ID:</span>
                    <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded" style={{ fontSize: '10px', color: '#9ca3af' }}>
                      {session.id}
                    </code>
                  </div>
                  
                  {/* Spacing */}
                  <div style={{ height: '1rem' }}></div>
                  
                  {/* Edit/Delete Buttons */}
                  <div className="flex flex-row" style={{ gap: '5px' }}>
                    <button
                      onClick={() => router.push(`/edit/${session.id}`)}
                      className="py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                      style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                      style={{ fontFamily: 'Fredoka, sans-serif', paddingLeft: '3px', paddingRight: '3px' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {sessions.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div style={{ height: '1rem' }}></div>
            <h3 className="text-lg font-semibold text-center mb-4" style={{ color: '#ffd942', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontFamily: 'Fredoka, sans-serif', fontWeight: '600' }}>SUMMARY</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div style={{ height: '0.5rem' }}></div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                  {sessions.length}
                </div>
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Total Sessions</div>
              </div>
              <div>
                <div style={{ height: '0.5rem' }}></div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                  {sessions.filter(s => s.status === "live").length}
                </div>
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Live Sessions</div>
              </div>
              <div>
                <div style={{ height: '0.5rem' }}></div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                  {sessions.reduce((sum, s) => sum + s.participant_count, 0)}
                </div>
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Total Participants</div>
                <div style={{ height: '0.5rem' }}></div>
              </div>
              <div>
                <div style={{ height: '0.5rem' }}></div>
                <div className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#38b6ff', textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000', fontWeight: '700', fontSize: 'calc(1.5rem + 5px)', letterSpacing: '3px' }}>
                  {sessions.reduce((sum, s) => sum + s.word_count, 0)}
                </div>
                <div className="text-sm text-gray-600" style={{ fontFamily: 'Fredoka, sans-serif' }}>Total Words</div>
                <div style={{ height: '0.5rem' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
