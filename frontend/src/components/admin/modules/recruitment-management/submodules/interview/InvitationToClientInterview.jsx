"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  Building, 
  Video, 
  Save, 
  X,
  ChevronDown,
  Plus,
  Eye,
  ArrowLeft,
  Check
} from "lucide-react";
import { clientInterviewAPI } from '../../../../../../services/api';

const InvitationToClientInterview = ({ currentTheme, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [ticketsWithCandidates, setTicketsWithCandidates] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    recruitment_request_id: '',
    candidate_id: '',
    client_id: '',
    interview_type: 'physical',
    interview_date: '',
    interview_time: '',
    contact_person: '',
    contact_person_phone: '',
    location: '',
    meeting_link: '',
    notes: ''
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [expandedTickets, setExpandedTickets] = useState({});
  const [selectedCandidatesForTicket, setSelectedCandidatesForTicket] = useState({});

  // Fetch data on component mount
  useEffect(() => {
    fetchTicketsWithCandidates();
    fetchClients();
  }, []);

  const fetchTicketsWithCandidates = async () => {
    setLoading(true);
    try {
      const data = await clientInterviewAPI.getActiveTicketsWithCandidates();
      if (data.success) {
        setTicketsWithCandidates(data.data);
      } else {
        console.error('Failed to fetch tickets:', data.message);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await clientInterviewAPI.getClientsDropdown();
      if (data.success) {
        setClients(data.data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleInviteCandidate = (ticket, candidate) => {
    setSelectedTicket(ticket);
    setSelectedCandidates([candidate]);
    setFormData({
      recruitment_request_id: ticket.recruitment_request_id,
      candidate_id: candidate.candidate_id,
      client_id: '',
      interview_type: 'physical',
      interview_date: '',
      interview_time: '',
      contact_person: '',
      contact_person_phone: '',
      location: '',
      meeting_link: '',
      notes: ''
    });
    setShowForm(true);
  };

  const handleInviteMultipleCandidates = (ticket, candidates) => {
    setSelectedTicket(ticket);
    setSelectedCandidates(candidates);
    setFormData({
      recruitment_request_id: ticket.recruitment_request_id,
      candidate_id: '', // Will be handled differently for multiple candidates
      client_id: '',
      interview_type: 'physical',
      interview_date: '',
      interview_time: '',
      contact_person: '',
      contact_person_phone: '',
      location: '',
      meeting_link: '',
      notes: ''
    });
    setShowForm(true);
  };

  const toggleTicketExpansion = (ticketId) => {
    setExpandedTickets(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const handleCandidateSelection = (ticketId, candidateId, isSelected) => {
    setSelectedCandidatesForTicket(prev => ({
      ...prev,
      [ticketId]: isSelected 
        ? [...(prev[ticketId] || []), candidateId]
        : (prev[ticketId] || []).filter(id => id !== candidateId)
    }));
  };

  const handleSelectAllCandidates = (ticketId, candidates, selectAll) => {
    setSelectedCandidatesForTicket(prev => ({
      ...prev,
      [ticketId]: selectAll ? candidates.map(c => c.candidate_id) : []
    }));
  };

  const getSelectedCandidatesForTicket = (ticketId) => {
    return selectedCandidatesForTicket[ticketId] || [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Handle single or multiple candidates
      if (selectedCandidates.length === 1) {
        // Single candidate invitation
        const data = await clientInterviewAPI.createInterview({
          ...formData,
          candidate_id: selectedCandidates[0].candidate_id
        });
        if (data.success) {
          alert('Client interview invitation sent successfully!');
          setShowForm(false);
          fetchTicketsWithCandidates();
        } else {
          alert(`Error: ${data.message}`);
        }
      } else {
        // Multiple candidates invitation
        let successCount = 0;
        let errorCount = 0;
        
        for (const candidate of selectedCandidates) {
          try {
            const data = await clientInterviewAPI.createInterview({
              ...formData,
              candidate_id: candidate.candidate_id
            });
            if (data.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          alert(`Successfully sent ${successCount} invitation(s). ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
          setShowForm(false);
          fetchTicketsWithCandidates();
        } else {
          alert('Failed to send any invitations');
        }
      }
    } catch (error) {
      console.error('Error submitting interview invitation:', error);
      alert('Failed to send interview invitation');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      recruitment_request_id: '',
      candidate_id: '',
      client_id: '',
      interview_type: 'physical',
      interview_date: '',
      interview_time: '',
      contact_person: '',
      contact_person_phone: '',
      location: '',
      meeting_link: '',
      notes: ''
    });
    setSelectedTicket(null);
    setSelectedCandidates([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
              Invitation To Client Interview
            </h1>
            <p className={`${currentTheme.textSecondary} mt-1`}>
              Send interview invitations to candidates for client interviews
            </p>
          </div>
        </div>
      </div>

      {/* Tickets with Candidates */}
      <div className={`${currentTheme.cardBg} ${currentTheme.border} rounded-xl backdrop-blur-md shadow-lg overflow-hidden`}>
        <div className="p-6 border-b border-gray-200/20">
          <h2 className={`text-xl font-semibold ${currentTheme.textPrimary} flex items-center`}>
            <Users className="w-5 h-5 mr-2" />
            Active Tickets with Candidates
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className={`mt-2 ${currentTheme.textSecondary}`}>Loading tickets...</p>
          </div>
        ) : ticketsWithCandidates.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className={`${currentTheme.textSecondary}`}>No active tickets with candidates found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200/20">
            {ticketsWithCandidates.map((ticket) => {
              const isExpanded = expandedTickets[ticket.ticket_id];
              const selectedCandidates = getSelectedCandidatesForTicket(ticket.ticket_id);
              const allSelected = selectedCandidates.length === ticket.candidates.length && ticket.candidates.length > 0;
              const someSelected = selectedCandidates.length > 0 && selectedCandidates.length < ticket.candidates.length;
              
              return (
                <div key={ticket.ticket_id} className="border-b border-gray-200/20 last:border-b-0">
                  {/* Ticket Header - Collapsible */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => toggleTicketExpansion(ticket.ticket_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <ChevronDown 
                            className={`w-5 h-5 text-gray-400 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {ticket.ticket_id}
                          </span>
                        </div>
                        <div>
                          <h3 className={`font-semibold ${currentTheme.textPrimary}`}>
                            {ticket.position_title}
                          </h3>
                          <p className="text-sm text-gray-500">{ticket.client_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">
                          {ticket.candidates.length} candidate(s)
                        </span>
                        {selectedCandidates.length > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {selectedCandidates.length} selected
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 text-sm text-gray-600">
                        <p><strong>Description:</strong> {ticket.description}</p>
                        <p><strong>Vacancies:</strong> {ticket.number_of_vacancies}</p>
                      </div>
                    )}
                  </div>

                  {/* Candidates Section - Expandable */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      {/* Selection Controls */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                              }}
                              onChange={(e) => handleSelectAllCandidates(ticket.ticket_id, ticket.candidates, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {allSelected ? 'Deselect All' : 'Select All'} Candidates
                            </span>
                          </label>
                          {selectedCandidates.length > 0 && (
                            <span className="text-xs text-gray-500">
                              ({selectedCandidates.length} of {ticket.candidates.length} selected)
                            </span>
                          )}
                        </div>
                        
                        {selectedCandidates.length > 0 && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const candidatesData = ticket.candidates.filter(c => 
                                  selectedCandidates.includes(c.candidate_id)
                                );
                                handleInviteMultipleCandidates(ticket, candidatesData);
                              }}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Invite Selected ({selectedCandidates.length})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Candidates List */}
                      <div className="space-y-3">
                        {ticket.candidates.map((candidate) => (
                          <div
                            key={candidate.candidate_id}
                            className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                              selectedCandidates.includes(candidate.candidate_id)
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center space-x-4">
                              <input
                                type="checkbox"
                                checked={selectedCandidates.includes(candidate.candidate_id)}
                                onChange={(e) => handleCandidateSelection(
                                  ticket.ticket_id, 
                                  candidate.candidate_id, 
                                  e.target.checked
                                )}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{candidate.candidate_name}</p>
                                <p className="text-sm text-gray-500">{candidate.candidate_email}</p>
                                <p className="text-sm text-gray-500">{candidate.candidate_phone}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    candidate.application_status === 'shortlisted' 
                                      ? 'bg-green-100 text-green-800'
                                      : candidate.application_status === 'interviewed'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {candidate.application_status}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Applied: {formatDate(candidate.applied_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleInviteCandidate(ticket, candidate)}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 text-sm"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Invite</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interview Invitation Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Client Interview Invitation</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedCandidates.length > 0 && (
                <div className="text-blue-100 mt-1">
                  {selectedCandidates.length === 1 ? (
                    <p>Inviting: {selectedCandidates[0].candidate_name} for {selectedTicket.position_title}</p>
                  ) : (
                    <p>Inviting {selectedCandidates.length} candidates for {selectedTicket.position_title}</p>
                  )}
                  {selectedCandidates.length > 1 && (
                    <div className="text-xs mt-1 opacity-90">
                      {selectedCandidates.map(c => c.candidate_name).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-1" />
                    Select Client *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, client_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.organisation_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Interview Type Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Interview Type *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="interview_type"
                        value="physical"
                        checked={formData.interview_type === 'physical'}
                        onChange={(e) => setFormData(prev => ({ ...prev, interview_type: e.target.value }))}
                        className="mr-2"
                      />
                      <MapPin className="w-4 h-4 mr-1" />
                      Physical Interview
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="interview_type"
                        value="online"
                        checked={formData.interview_type === 'online'}
                        onChange={(e) => setFormData(prev => ({ ...prev, interview_type: e.target.value }))}
                        className="mr-2"
                      />
                      <Video className="w-4 h-4 mr-1" />
                      Online Interview
                    </label>
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Interview Date *
                    </label>
                    <input
                      type="date"
                      value={formData.interview_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, interview_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Interview Time *
                    </label>
                    <input
                      type="time"
                      value={formData.interview_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, interview_time: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Physical Interview Fields */}
                {formData.interview_type === 'physical' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-1" />
                          Contact Person *
                        </label>
                        <input
                          type="text"
                          value={formData.contact_person}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                          required
                          placeholder="Enter contact person name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-1" />
                          Contact Person Phone *
                        </label>
                        <input
                          type="tel"
                          value={formData.contact_person_phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, contact_person_phone: e.target.value }))}
                          required
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        Interview Location *
                      </label>
                      <textarea
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        required
                        rows={3}
                        placeholder="Enter complete address for the interview"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Online Interview Fields */}
                {formData.interview_type === 'online' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Video className="w-4 h-4 inline mr-1" />
                      Meeting Link *
                    </label>
                    <input
                      type="url"
                      value={formData.meeting_link}
                      onChange={(e) => setFormData(prev => ({ ...prev, meeting_link: e.target.value }))}
                      required
                      placeholder="Enter Zoom, Teams, or other meeting link"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    placeholder="Any additional instructions or notes for the candidate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {loading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    )}
                    <Save className="w-4 h-4" />
                    <span>Send Invitation</span>
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

export default InvitationToClientInterview;