"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Save, 
  X,
  ArrowLeft,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { clientInterviewAPI } from "../../../../../../services/api";

const ClientInterviewFeedback = ({ currentTheme, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [ticketsWithCandidates, setTicketsWithCandidates] = useState([]);
  const [expandedTickets, setExpandedTickets] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [feedbackData, setFeedbackData] = useState({
    feedback_status: '',
    comments: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTicketsWithCandidates();
  }, []);

  const fetchTicketsWithCandidates = async () => {
    setLoading(true);
    try {
      const response = await clientInterviewAPI.getActiveTicketsWithCandidates();
      // Ensure we set an array - the API returns data in response.data
      const tickets = Array.isArray(response.data) ? response.data : [];
      setTicketsWithCandidates(tickets);
      
      // Initialize all tickets as expanded by default
      const initialExpandedState = {};
      tickets.forEach(ticket => {
        initialExpandedState[ticket.ticket_id] = true;
      });
      setExpandedTickets(initialExpandedState);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTicketsWithCandidates([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const toggleTicketExpansion = (ticketId) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const handleGiveFeedback = (ticket, candidate) => {
    setSelectedTicket(ticket);
    setSelectedCandidate(candidate);
    setFeedbackData({
      feedback_status: '',
      comments: ''
    });
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await clientInterviewAPI.createInterview({
        recruitment_request_id: selectedTicket.recruitment_request_id,
        candidate_id: selectedCandidate.candidate_id,
        ...feedbackData
      });

      if (response) {
        alert('Feedback submitted successfully!');
        setShowFeedbackModal(false);
        fetchTicketsWithCandidates(); // Refresh data
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-3xl font-bold ${currentTheme.textPrimary}`}>
              Client Interview Feedback
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Provide feedback for candidates after client interviews
            </p>
          </div>
        </div>
      </div>

      {/* Tickets with Candidates */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}>
        <div className="p-6 border-b border-gray-200/20">
          <h2 className={`text-xl font-semibold ${currentTheme.textPrimary} flex items-center`}>
            <Users className="w-5 h-5 mr-2" />
            Active Tickets with Candidates for Feedback
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-2 ${currentTheme.textSecondary}`}>Loading tickets...</p>
          </div>
        ) : ticketsWithCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`${currentTheme.textSecondary}`}>No candidates pending feedback found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/20">
            {ticketsWithCandidates.map((ticket) => (
              <div key={ticket.ticket_id} className="border-b border-gray-200/20 last:border-b-0">
                {/* Ticket Header - Clickable */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleTicketExpansion(ticket.ticket_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {ticket.ticket_id}
                      </span>
                      <h3 className={`font-semibold ${currentTheme.textPrimary}`}>
                        {ticket.position_title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ({ticket.candidates.length} candidate{ticket.candidates.length !== 1 ? 's' : ''} pending feedback)
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                        {expandedTickets[ticket.ticket_id] ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p><strong>Client:</strong> {ticket.client_name}</p>
                    <p><strong>Description:</strong> {ticket.description}</p>
                    <p><strong>Vacancies:</strong> {ticket.number_of_vacancies}</p>
                  </div>
                </div>

                {/* Candidates List - Collapsible */}
                {expandedTickets[ticket.ticket_id] && (
                  <div className="px-6 pb-6 border-t border-gray-200/20 bg-gray-50/30">
                    <div className="pt-4 space-y-3">
                      <h4 className={`font-medium ${currentTheme.textPrimary} flex items-center space-x-2`}>
                        <Users className="w-4 h-4" />
                        <span>Candidates Requiring Feedback:</span>
                      </h4>
                      <div className="grid gap-3">
                        {ticket.candidates.map((candidate) => (
                          <div
                            key={candidate.candidate_id}
                            className="flex items-center justify-between p-4 bg-white rounded-lg border"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{candidate.candidate_name}</p>
                                <p className="text-sm text-gray-500">{candidate.candidate_email}</p>
                                <p className="text-sm text-gray-500">{candidate.candidate_phone}</p>
                                {candidate.interview_date && (
                                  <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      {formatDate(candidate.interview_date)}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatTime(candidate.interview_time)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                candidate.application_status === 'interviewed'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : candidate.application_status === 'shortlisted'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.application_status}
                              </span>
                              {candidate.interview_status && (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  candidate.interview_status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : candidate.interview_status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  Interview: {candidate.interview_status}
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGiveFeedback(ticket, candidate);
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>Give Feedback</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Client Interview Feedback</h2>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedCandidate && (
                <p className="text-green-100 mt-1">
                  Feedback for: {selectedCandidate.candidate_name}
                </p>
              )}
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                {/* Feedback Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Feedback Status *
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feedback_status"
                        value="recommended"
                        checked={feedbackData.feedback_status === 'recommended'}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback_status: e.target.value }))}
                        className="mr-3"
                        required
                      />
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span>Recommended - Candidate performed well</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feedback_status"
                        value="not_recommended"
                        checked={feedbackData.feedback_status === 'not_recommended'}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback_status: e.target.value }))}
                        className="mr-3"
                        required
                      />
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span>Not Recommended - Candidate needs improvement</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="feedback_status"
                        value="pending_review"
                        checked={feedbackData.feedback_status === 'pending_review'}
                        onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback_status: e.target.value }))}
                        className="mr-3"
                        required
                      />
                      <Eye className="w-5 h-5 text-yellow-600 mr-2" />
                      <span>Pending Review - Requires further assessment</span>
                    </label>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments *
                  </label>
                  <textarea
                    value={feedbackData.comments}
                    onChange={(e) => setFeedbackData(prev => ({ ...prev, comments: e.target.value }))}
                    required
                    rows={4}
                    placeholder="Provide detailed feedback about the candidate's interview performance..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <Save className="w-4 h-4" />
                    <span>Submit Feedback</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientInterviewFeedback;
