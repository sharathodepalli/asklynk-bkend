import React from 'react';
import { useSessionStore } from '../store/session';
import { Users, MessageSquare, Brain, BarChart3, Mail } from 'lucide-react';
import { format } from 'date-fns';

export function SessionHistory() {
  const { sessions, setSession } = useSessionStore();

  const formatDate = (date: string) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a');
  };

  const handleSessionClick = (session: any) => {
    if (session.status === 'active') {
      setSession(session);
    }
  };

  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => handleSessionClick(session)}
          className={`bg-white rounded-lg shadow-md p-6 border ${
            session.status === 'active'
              ? 'border-green-200 hover:border-green-300 cursor-pointer'
              : 'border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{session.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">Code: </span>
                <span className="font-mono font-medium">{session.code}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                    session.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.status === 'active' ? 'Active' : 'Ended'}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Started: {formatDate(session.created_at)}</div>
              {session.ended_at && (
                <div>Ended: {formatDate(session.ended_at)}</div>
              )}
            </div>
          </div>

          {session.description && (
            <p className="text-gray-600 mb-4">{session.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Users size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Students</div>
                <div className="font-semibold">
                  {session.student_count || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Messages</div>
                <div className="font-semibold">
                  {session.message_count || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                <Brain size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">AI Interactions</div>
                <div className="font-semibold">
                  {session.ai_interaction_count || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <BarChart3 size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Polls</div>
                <div className="font-semibold">
                  {session.poll_count || 0}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500">Anonymous</div>
                <div className="font-semibold">
                  {session.anonymous_message_count || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}