import React, { useState, useEffect } from 'react';
import { Mail, Users, Clock, FileText, Video, Plus, Trash2, Save, Send } from 'lucide-react';

const CurrentVacancyInvites = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [inviteType, setInviteType] = useState('test');
  const [loading, setLoading] = useState(false);

  // Test setup state
  const [testQuestions, setTestQuestions] = useState([
    { id: 1, question: '', answers: ['', '', '', ''], correctAnswer: 0 }
  ]);
  const [testDuration, setTestDuration] = useState(60);
  const [testInstructions, setTestInstructions] = useState('');

  // Meeting setup state
  const [meetingLink, setMeetingLink] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingInstructions, setMeetingInstructions] = useState('');

  useEffect(() => {
    // Mock tickets data
    setTickets([
      { id: 'TCK_2025_0001', title: 'Software Developer - Lagos', sortedCandidates: 12 },
      { id: 'TCK_2025_0002', title: 'Accountant - Abuja', sortedCandidates: 8 },
      { id: 'TCK_2025_0003', title: 'HR Officer - Port Harcourt', sortedCandidates: 15 },
    ]);
  }, []);

  const handleTicketSelection = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoading(true);
    
    try {
      // Mock sorted candidates for the selected ticket
      const mockCandidates = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice.johnson@email.com',
          phone: '+234-801-111-2222',
          score: 85,
          status: 'sorted',
        },
        {
          id: 2,
          name: 'Bob Williams',
          email: 'bob.williams@email.com',
          phone: '+234-802-333-4444',
          score: 78,
          status: 'sorted',
        },
        {
          id: 3,
          name: 'Carol Davis',
          email: 'carol.davis@email.com',
          phone: '+234-803-555-6666',
          score: 92,
          status: 'sorted',
        },
      ];
      
      setCandidates(mockCandidates);
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const selectAllCandidates = () => {
    setSelectedCandidates(
      selectedCandidates.length === candidates.length 
        ? [] 
        : candidates.map(c => c.id)
    );
  };

  // Test Management Functions
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      question: '',
      answers: ['', '', '', ''],
      correctAnswer: 0
    };
    setTestQuestions([...testQuestions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (testQuestions.length > 1) {
      setTestQuestions(testQuestions.filter(q => q.id !== questionId));
    }
  };

  const updateQuestion = (questionId, field, value) => {
    setTestQuestions(testQuestions.map(q => 
      q.id === questionId ? { ...q, [field]: value } : q
    ));
  };

  const updateAnswer = (questionId, answerIndex, value) => {
    setTestQuestions(testQuestions.map(q => 
      q.id === questionId 
        ? { ...q, answers: q.answers.map((a, i) => i === answerIndex ? value : a) }
        : q
    ));
  };

  const setCorrectAnswer = (questionId, answerIndex) => {
    setTestQuestions(testQuestions.map(q => 
      q.id === questionId ? { ...q, correctAnswer: answerIndex } : q
    ));
  };

  const sendInvites = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate');
      return;
    }

    setLoading(true);
    
    try {
      if (inviteType === 'test') {
        // Validate test setup
        const hasValidQuestions = testQuestions.every(q => 
          q.question.trim() && q.answers.every(a => a.trim())
        );
        
        if (!hasValidQuestions) {
          alert('Please complete all questions and answers');
          return;
        }

        // TODO: Send test invites
        console.log('Sending test invites:', {
          ticketId: selectedTicket,
          candidates: selectedCandidates,
          test: {
            questions: testQuestions,
            duration: testDuration,
            instructions: testInstructions
          }
        });
        
        alert(`Test invites sent to ${selectedCandidates.length} candidates!`);
      } else {
        // Validate meeting setup
        if (!meetingLink || !meetingDate || !meetingTime) {
          alert('Please fill in all meeting details');
          return;
        }

        // TODO: Send meeting invites
        console.log('Sending meeting invites:', {
          ticketId: selectedTicket,
          candidates: selectedCandidates,
          meeting: {
            link: meetingLink,
            date: meetingDate,
            time: meetingTime,
            instructions: meetingInstructions
          }
        });
        
        alert(`Meeting invites sent to ${selectedCandidates.length} candidates!`);
      }
      
      // Reset selections
      setSelectedCandidates([]);
    } catch (error) {
      console.error('Error sending invites:', error);
      alert('Failed to send invites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 ${currentTheme.cardBg} rounded-lg shadow-lg`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
          <Mail className="inline-block w-6 h-6 mr-2" />
          Current Vacancy Invites
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          Send test and meeting invitations to sorted candidates
        </p>
      </div>

      {/* Ticket Selection */}
      <div className="mb-6">
        <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
          Select Recruitment Ticket
        </label>
        <select
          value={selectedTicket}
          onChange={(e) => handleTicketSelection(e.target.value)}
          className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
        >
          <option value="">Choose a ticket...</option>
          {tickets.map(ticket => (
            <option key={ticket.id} value={ticket.id}>
              {ticket.id} - {ticket.title} ({ticket.sortedCandidates} sorted candidates)
            </option>
          ))}
        </select>
      </div>

      {/* Invite Type Selection */}
      {selectedTicket && candidates.length > 0 && (
        <div className="mb-6">
          <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
            Invite Type
          </label>
          <div className="flex gap-4">
            <button
              onClick={() => setInviteType('test')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                inviteType === 'test'
                  ? 'bg-blue-600 text-white'
                  : `${currentTheme.border} ${currentTheme.textSecondary} hover:bg-blue-50`
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Aptitude Test
            </button>
            <button
              onClick={() => setInviteType('meeting')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                inviteType === 'meeting'
                  ? 'bg-blue-600 text-white'
                  : `${currentTheme.border} ${currentTheme.textSecondary} hover:bg-blue-50`
              }`}
            >
              <Video className="w-4 h-4 inline mr-2" />
              Interview Meeting
            </button>
          </div>
        </div>
      )}

      {/* Candidates Selection */}
      {selectedTicket && candidates.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              <Users className="inline-block w-5 h-5 mr-2" />
              Select Candidates ({selectedCandidates.length}/{candidates.length})
            </h3>
            <button
              onClick={selectAllCandidates}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {selectedCandidates.length === candidates.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {candidates.map(candidate => (
              <div 
                key={candidate.id} 
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedCandidates.includes(candidate.id)
                    ? 'border-blue-500 bg-blue-50'
                    : currentTheme.border
                }`}
                onClick={() => handleCandidateSelection(candidate.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${currentTheme.textPrimary}`}>
                      {candidate.name}
                    </h4>
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      {candidate.email}
                    </p>
                    <p className={`text-xs ${currentTheme.textMuted}`}>
                      Score: {candidate.score}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.id)}
                    onChange={() => {}}
                    className="w-4 h-4 text-blue-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Setup Modal */}
      {inviteType === 'test' && selectedTicket && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
            <FileText className="inline-block w-5 h-5 mr-2" />
            Test Setup
          </h3>

          {/* Test Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Test Duration (minutes)
              </label>
              <input
                type="number"
                value={testDuration}
                onChange={(e) => setTestDuration(parseInt(e.target.value))}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                min="15"
                max="180"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Instructions
              </label>
              <textarea
                value={testInstructions}
                onChange={(e) => setTestInstructions(e.target.value)}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                rows="3"
                placeholder="Enter test instructions for candidates..."
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {testQuestions.map((question, qIndex) => (
              <div key={question.id} className={`p-4 border rounded-lg ${currentTheme.border}`}>
                <div className="flex justify-between items-center mb-3">
                  <h4 className={`font-medium ${currentTheme.textPrimary}`}>
                    Question {qIndex + 1}
                  </h4>
                  <button
                    onClick={() => removeQuestion(question.id)}
                    disabled={testQuestions.length === 1}
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-4">
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                    placeholder="Enter question..."
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {question.answers.map((answer, aIndex) => (
                    <div key={aIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === aIndex}
                        onChange={() => setCorrectAnswer(question.id, aIndex)}
                        className="text-green-600"
                      />
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => updateAnswer(question.id, aIndex, e.target.value)}
                        className={`flex-1 p-2 border rounded ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                        placeholder={`Option ${String.fromCharCode(65 + aIndex)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={addQuestion}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors duration-200"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Question
            </button>
          </div>
        </div>
      )}

      {/* Meeting Setup Modal */}
      {inviteType === 'meeting' && selectedTicket && (
        <div className="mb-6">
          <h3 className={`text-lg font-semibold ${currentTheme.textPrimary} mb-4`}>
            <Video className="inline-block w-5 h-5 mr-2" />
            Meeting Setup
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Meeting Link
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                placeholder="https://zoom.us/j/123456789"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Meeting Date
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Meeting Time
              </label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}>
                Additional Instructions
              </label>
              <textarea
                value={meetingInstructions}
                onChange={(e) => setMeetingInstructions(e.target.value)}
                className={`w-full p-3 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                rows="3"
                placeholder="Enter meeting instructions..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Send Invites Button */}
      {selectedTicket && candidates.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={sendInvites}
            disabled={loading || selectedCandidates.length === 0}
            className={`px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200 ${
              loading ? 'cursor-not-allowed' : ''
            }`}
          >
            <Send className="w-4 h-4 inline mr-2" />
            {loading ? 'Sending...' : `Send ${inviteType === 'test' ? 'Test' : 'Meeting'} Invites`}
          </button>
        </div>
      )}

      {/* Info Note */}
      <div className={`mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded`}>
        <div className="flex">
          <Mail className="w-5 h-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Invitations will be sent to candidates' dashboards and email addresses.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Test invites include access to online aptitude tests. Meeting invites include video conference links.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurrentVacancyInvites;
