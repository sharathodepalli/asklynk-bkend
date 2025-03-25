import React, { useState, useEffect } from 'react';
import { usePollsStore } from '../store/polls';
import { useSessionStore } from '../store/session';
import { useAuthStore } from '../store/auth';
import { BarChart3, Plus, X, Check, Loader2, Mic } from 'lucide-react';
import { VoicePollCreator } from './VoicePollCreator';

interface PollOption {
  text: string;
}

export function PollsUI() {
  const { user } = useAuthStore();
  const { session } = useSessionStore();
  const { 
    polls, 
    votes, 
    createPoll, 
    endPoll, 
    vote, 
    subscribeToPollUpdates, 
    unsubscribeFromPolls,
    isLoading,
    error
  } = usePollsStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<PollOption[]>([{ text: '' }, { text: '' }]);
  const [duration, setDuration] = useState(30); // Default 30 seconds

  useEffect(() => {
    subscribeToPollUpdates();
    return () => unsubscribeFromPolls();
  }, [subscribeToPollUpdates, unsubscribeFromPolls]);

  const handleAddOption = () => {
    setOptions([...options, { text: '' }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleCreatePoll = async () => {
    try {
      await createPoll(question, options.map(opt => opt.text), undefined, duration);
      setIsCreating(false);
      setQuestion('');
      setOptions([{ text: '' }, { text: '' }]);
    } catch (err) {
      console.error('Failed to create poll:', err);
    }
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    try {
      await vote(pollId, optionIndex);
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  };

  const calculatePercentage = (pollId: string, optionIndex: number) => {
    const pollVotes = votes[pollId];
    if (!pollVotes) return 0;
    const total = pollVotes.reduce((sum, count) => sum + count, 0);
    return total === 0 ? 0 : Math.round((pollVotes[optionIndex] / total) * 100);
  };

  const isProfessor = user?.role === 'professor';

  return (
    <div className="flex flex-col h-[500px] w-[350px] bg-white rounded-lg shadow-lg">
      <div className="bg-blue-600 p-4 rounded-t-lg">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <BarChart3 size={20} />
          Live Polls
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isProfessor && isCreating && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question..."
                className="w-full p-2 border rounded-lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (seconds)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                min="5"
                max="300"
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="flex-1 p-2 border rounded-lg"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddOption}
                className="flex items-center gap-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                <Plus size={16} />
                Add Option
              </button>
              <button
                onClick={handleCreatePoll}
                disabled={isLoading}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Create Poll
              </button>
            </div>
          </div>
        )}

        {polls.map((poll) => (
          <div key={poll.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">{poll.question}</h3>
              {poll.voice_transcript && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Mic size={12} />
                  Voice Created
                </div>
              )}
            </div>

            <div className="space-y-2">
              {poll.options.map((option, index) => {
                const percentage = calculatePercentage(poll.id, index);
                return (
                  <button
                    key={index}
                    onClick={() => handleVote(poll.id, index)}
                    disabled={poll.status === 'ended' || isLoading}
                    className="w-full p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-50 relative overflow-hidden"
                  >
                    <div
                      className="absolute left-0 top-0 bottom-0 bg-blue-100 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                    <div className="relative flex justify-between">
                      <span>{option}</span>
                      <span>{percentage}%</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {isProfessor && poll.status === 'active' && (
              <button
                onClick={() => endPoll(poll.id)}
                className="mt-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                End Poll
              </button>
            )}
          </div>
        ))}
      </div>

      {isProfessor && !isCreating && (
        <div className="p-4 border-t">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Create New Poll
          </button>
        </div>
      )}
    </div>
  );
}