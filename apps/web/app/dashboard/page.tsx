'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { config } from '@/lib/config';
import { SocketStatusIndicator } from '@/components/socket-status-indicator';
import { getRooms, GetRoomsResponse, ApiError } from '@/lib/api';

// Modern skeleton placeholder loader
const TableSkeleton = () => (
  <div className="space-y-4 animate-pulse" data-testid="dashboard-skeleton">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="h-20 bg-slate-900/40 border border-slate-800/60 rounded-2xl flex items-center justify-between px-6"
      >
        <div className="flex gap-4 items-center flex-1">
          <div className="h-11 w-11 bg-slate-800 rounded-xl" />
          <div className="space-y-2 flex-1 max-w-[200px]">
            <div className="h-4 bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-800 rounded w-1/2" />
          </div>
        </div>
        <div className="h-8 w-24 bg-slate-800 rounded-xl" />
      </div>
    ))}
  </div>
);

export default function DashboardPage() {
  const { user, token, logout, isLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<'games' | 'templates' | 'analytics'>('games');
  const [rooms, setRooms] = React.useState<GetRoomsResponse[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = React.useState(true);
  const [roomsError, setRoomsError] = React.useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = React.useState(false);

  const fetchRooms = React.useCallback(async () => {
    if (!token) return;
    setIsLoadingRooms(true);
    setRoomsError(null);
    try {
      const data = await getRooms(token);
      setRooms(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setRoomsError(err.message);
      } else {
        setRoomsError('Failed to fetch rooms. Please try again.');
      }
    } finally {
      setIsLoadingRooms(false);
    }
  }, [token]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRooms();
  }, [fetchRooms]);

  React.useEffect(() => {
    if (activeTab === 'templates') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingTemplates(true);
      const timer = setTimeout(() => {
        setIsLoadingTemplates(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // While checking auth status, show a sleek loading screen
  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-500/20 text-white animate-bounce">
            F
          </div>
          <div className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-indigo-500"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-medium text-slate-400">Loading session...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-xl"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xl shadow-lg shadow-indigo-500/20 text-white group-hover:scale-105 transition-transform">
              F
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent hidden sm:inline">
              {config.appName}
            </span>
          </Link>

          {/* User Profile and Actions */}
          <div className="flex items-center gap-2 sm:gap-6">
            <SocketStatusIndicator />
            <div className="hidden md:flex flex-col text-right">
              <span className="text-sm font-semibold text-white">{user.name}</span>
              <span className="text-xs text-slate-400">{user.email}</span>
            </div>

            <div className="h-9 w-9 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={logout}
              className="text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-2 sm:px-4 sm:py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8 relative z-10">
        {/* Sidebar / Placeholder Navigation */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2 sm:p-4 grid grid-cols-3 lg:flex lg:flex-col gap-2 lg:gap-1">
            <h3 className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase hidden lg:block">
              Host Navigation
            </h3>
            <button
              onClick={() => setActiveTab('games')}
              className={`px-3 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 lg:gap-3 cursor-pointer text-center lg:text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                activeTab === 'games'
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="truncate">Live Rooms</span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 lg:gap-3 cursor-pointer text-center lg:text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                activeTab === 'templates'
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <span>
                <span className="hidden lg:inline">Game </span>Templates
              </span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-2.5 rounded-xl text-xs lg:text-sm font-medium transition-all flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-1 lg:gap-3 cursor-pointer text-center lg:text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>
                <span className="hidden lg:inline">Past </span>Analytics
              </span>
            </button>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-5 space-y-4 hidden lg:block">
            <h4 className="text-sm font-semibold text-white">Need Inspiration?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore preset Trivia, Speed Quiz, or Emoji Puzzles tailored for virtual corporate
              teams.
            </p>
            <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
              Browse Presets
            </button>
          </div>
        </aside>

        {/* Content Area / Placeholder content */}
        <main className="lg:col-span-3 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Welcome back, {user.name.split(' ')[0]}!
              </h1>
              <p className="text-sm text-slate-400">
                You&apos;re ready to host. Launch a quick room or customize game templates below.
              </p>
            </div>

            <Link
              href="/room/create"
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-650 hover:from-indigo-600 hover:to-purple-700 text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Room
            </Link>
          </div>

          {/* Tab Specific Views */}
          {activeTab === 'games' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Active Lobbies</h2>

              {isLoadingRooms ? (
                <TableSkeleton />
              ) : roomsError ? (
                <div
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4"
                  data-testid="dashboard-error-state"
                >
                  <div className="text-red-400 text-3xl">⚠️</div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">Failed to Load Rooms</h3>
                    <p className="text-sm text-slate-400">{roomsError}</p>
                  </div>
                  <button
                    onClick={fetchRooms}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-650 text-sm font-semibold rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : rooms.filter((r) => r.status !== 'FINISHED').length === 0 ? (
                <div
                  className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4"
                  data-testid="dashboard-empty-state"
                >
                  <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="max-w-sm mx-auto space-y-1">
                    <h3 className="text-lg font-bold text-white">No active game rooms</h3>
                    <p className="text-sm text-slate-400">
                      Rooms are temporary multiplayer lobbies where players connect, answer, and
                      compete live.
                    </p>
                  </div>
                  <Link
                    href="/room/create"
                    className="px-4 py-2 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-sm font-semibold rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    Create Room
                  </Link>
                </div>
              ) : (
                <div className="space-y-3" data-testid="dashboard-rooms-list">
                  {rooms
                    .filter((r) => r.status !== 'FINISHED')
                    .map((room) => (
                      <div
                        key={room.id}
                        className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-all duration-350"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 border border-indigo-500/20 flex items-center justify-center font-mono font-bold text-indigo-300 text-lg">
                            {room.code.substring(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white font-mono tracking-wider">
                                {room.code}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                                  room.status === 'LOBBY'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                                }`}
                              >
                                {room.status === 'LOBBY' ? 'Lobby' : 'In Progress'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Created on {new Date(room.createdAt).toLocaleDateString()} at{' '}
                              {new Date(room.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/lobby/${room.code}?roomId=${room.id}`}
                          className="w-full sm:w-auto text-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-650/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        >
                          {room.status === 'LOBBY' ? 'Enter Lobby' : 'Resume Game'}
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Quiz Templates</h2>

              {isLoadingTemplates ? (
                <TableSkeleton />
              ) : (
                <div
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in"
                  data-testid="dashboard-templates-list"
                >
                  {/* Sample template card */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-semibold">
                        Trivia
                      </span>
                      <span className="text-xs text-slate-500">10 Questions</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                      Friday Tech Trivia
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4">
                      Test your engineering team&apos;s knowledge on current software design
                      patterns.
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-xs font-semibold rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                        Edit Questions
                      </button>
                      <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                        Host Game
                      </button>
                    </div>
                  </div>

                  {/* Sample template card 2 */}
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 rounded-lg text-xs font-semibold">
                        Icebreaker
                      </span>
                      <span className="text-xs text-slate-500">5 Questions</span>
                    </div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors">
                      Meet the Team Match
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 mb-4">
                      Fun, interactive emoji association questions to break the ice with new hires.
                    </p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-xs font-semibold rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                        Edit Questions
                      </button>
                      <button className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900">
                        Host Game
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-2">Historical Analytics</h2>

              {isLoadingRooms ? (
                <TableSkeleton />
              ) : roomsError ? (
                <div
                  className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center space-y-4"
                  data-testid="dashboard-analytics-error"
                >
                  <div className="text-red-400 text-3xl">⚠️</div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="text-base font-bold text-white">Failed to Load Analytics</h3>
                    <p className="text-sm text-slate-400">{roomsError}</p>
                  </div>
                  <button
                    onClick={fetchRooms}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-650 text-sm font-semibold rounded-xl text-slate-200 hover:text-white transition-all cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : rooms.filter((r) => r.status === 'FINISHED').length === 0 ? (
                <div
                  className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4"
                  data-testid="dashboard-analytics-empty"
                >
                  <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                      />
                    </svg>
                  </div>
                  <div className="max-w-sm mx-auto space-y-1">
                    <h3 className="text-lg font-bold text-white">No historical data yet</h3>
                    <p className="text-sm text-slate-400">
                      Detailed scoreboard statistics, completion rates, and player insights will
                      show up after a game is finished.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3" data-testid="dashboard-analytics-list">
                  {rooms
                    .filter((r) => r.status === 'FINISHED')
                    .map((room) => (
                      <div
                        key={room.id}
                        className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-700 transition-all duration-350"
                      >
                        <div className="flex gap-4 items-center">
                          <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-mono font-bold text-purple-300 text-lg">
                            ✓
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-white font-mono tracking-wider">
                                {room.code}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold border bg-purple-500/10 text-purple-400 border-purple-500/20">
                                Finished
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Played on {new Date(room.createdAt).toLocaleDateString()} at{' '}
                              {new Date(room.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/lobby/${room.code}?roomId=${room.id}`}
                          className="w-full sm:w-auto text-center px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-750 text-slate-200 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                        >
                          View Results
                        </Link>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 px-4 sm:px-6 py-6 text-center text-xs text-slate-600 z-10 mt-auto">
        <p>
          © {new Date().getFullYear()} {config.appName}. Secure connection verified.
        </p>
      </footer>
    </div>
  );
}
