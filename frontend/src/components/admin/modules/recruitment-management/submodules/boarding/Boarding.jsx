import React, { useState, useEffect } from 'react';
import { Send, UserCheck, AlertCircle, Users, FileText } from 'lucide-react';
import boardingAPI from '../../../../../../services/recruitment/boardingAPI';

const Boarding = ({ currentTheme, preferences, onBack }) => {
  const [activeTab, setActiveTab] = useState('offer');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [clients, setClients] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [payGrades, setPayGrades] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [selectedPayGrade, setSelectedPayGrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [sendingOffers, setSendingOffers] = useState(false);
  const [boardingCandidates, setBoardingCandidates] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load tickets when client changes
  useEffect(() => {
    if (selectedClient) {
      loadTickets();
    } else {
      setTickets([]);
      setSelectedTicket('');
    }
  }, [selectedClient]);

  // Load pay grades and candidates when ticket changes
  useEffect(() => {
    if (selectedTicket) {
      const ticket = tickets.find(t => t.id === parseInt(selectedTicket));
      if (ticket) {
        loadPayGrades(ticket.job_structure_id);
        loadCandidates();
      }
    } else {
      setPayGrades([]);
      setCandidates([]);
      setSelectedCandidates([]);
    }
  }, [selectedTicket, activeTab]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await boardingAPI.getClients();
      if (response.success) {
        setClients(response.data || []);
      } else {
        setClients([]);
        console.info(response.message || 'No clients available');
      }
    } catch (error) {
      console.error('Failed to load clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTickets = async () => {
    try {
      setLoadingTickets(true);
      const response = await boardingAPI.getTickets(selectedClient);
      if (response.success) {
        setTickets(response.data || []);
      } else {
        setTickets([]);
        console.info(response.message || 'No tickets available');
      }
    } catch (error) {
      console.error('Failed to load tickets:', error);
      setTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const loadPayGrades = async (jobStructureId) => {
    try {
      const response = await boardingAPI.getPayGrades(jobStructureId);
      if (response.success) {
        setPayGrades(response.data || []);
      } else {
        setPayGrades([]);
        console.info(response.message || 'No pay grades available');
      }
    } catch (error) {
      console.error('Failed to load pay grades:', error);
      setPayGrades([]);
    }
  };

  const loadCandidates = async () => {
    try {
      setLoadingCandidates(true);
      const endpoint = activeTab === 'offer' ? 'getCandidatesForOffer' : 'getCandidatesForBoarding';
      const response = await boardingAPI[endpoint](selectedTicket);
      if (response.success) {
        setCandidates(response.data || []);
        setSelectedCandidates([]);
      } else {
        // Handle graceful failure - set empty array instead of showing error
        setCandidates([]);
        setSelectedCandidates([]);
        // Only log to console, don't show user error for empty data
        console.info(response.message || 'No candidates available');
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
      // Set empty candidates array instead of showing error
      setCandidates([]);
      setSelectedCandidates([]);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleCandidateSelection = (candidateId) => {
    setSelectedCandidates(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      } else {
        return [...prev, candidateId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const sendOffers = async () => {
    if (selectedCandidates.length === 0 || !selectedPayGrade) {
      alert('Please select candidates and pay grade');
      return;
    }

    try {
      setSendingOffers(true);
      const ticket = tickets.find(t => t.id === parseInt(selectedTicket));
      const offerData = {
        client_id: selectedClient,
        recruitment_request_id: selectedTicket,
        job_structure_id: ticket.job_structure_id,
        offers: selectedCandidates.map(candidateId => ({
          candidate_id: candidateId,
          pay_grade_structure_id: selectedPayGrade,
          proposed_start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 weeks from now
        }))
      };

      const response = await boardingAPI.sendOffers(offerData);
      if (response.success) {
        alert(`Successfully sent offers to ${response.data.success_count} candidate(s)`);
        loadCandidates(); // Refresh candidates list
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Failed to send offers:', error);
      alert('Failed to send offers. Please try again.');
    } finally {
      setSendingOffers(false);
    }
  };

  const boardCandidates = async () => {
    if (selectedCandidates.length === 0) {
      alert('Please select candidates to board');
      return;
    }

    try {
      setBoardingCandidates(true);
      const boardingRequestIds = selectedCandidates.map(candidateId => {
        const candidate = candidates.find(c => c.id === candidateId);
        return candidate.boarding_request_id;
      });

      const response = await boardingAPI.boardCandidates({ 
        candidates: boardingRequestIds 
      });

      if (response.success) {
        alert(`Successfully boarded ${response.data.success_count} candidate(s)`);
        loadCandidates(); // Refresh candidates list
        setSelectedCandidates([]);
      }
    } catch (error) {
      console.error('Failed to board candidates:', error);
      alert('Failed to board candidates. Please try again.');
    } finally {
      setBoardingCandidates(false);
    }
  };

  const TabButtons = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => setActiveTab('offer')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'offer'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Issue Offer Letter</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            activeTab === 'board'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Board</span>
          </div>
        </button>
      </nav>
    </div>
  );

  const ClientTicketSelection = () => (
    <div className={`p-4 rounded-lg border mb-6 ${
      currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Client
          </label>
          <div className="relative">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                currentTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={loading}
            >
              <option value="">
                {loading ? "Loading clients..." : "Choose a client..."}
              </option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name} ({client.active_tickets} active tickets)
                </option>
              ))}
            </select>
            {loading && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Ticket
          </label>
          <div className="relative">
            <select
              value={selectedTicket}
              onChange={(e) => setSelectedTicket(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                currentTheme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
              disabled={!selectedClient || loadingTickets}
            >
              <option value="">
                {loadingTickets ? "Loading tickets..." : "Choose a ticket..."}
              </option>
              {tickets.map(ticket => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.ticket_code} - {ticket.job_title} ({Math.max(0, (ticket.positions_required || 0) - (ticket.positions_filled || 0))} positions available)
                </option>
              ))}
            </select>
            {loadingTickets && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const OfferTab = () => (
    <div className="space-y-6">
      {selectedTicket && payGrades.length > 0 && (
        <div className={`p-4 rounded-lg border ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Pay Grade for Offers
          </label>
          <select
            value={selectedPayGrade}
            onChange={(e) => setSelectedPayGrade(e.target.value)}
            className={`w-full md:w-1/2 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentTheme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Choose pay grade...</option>
            {payGrades.map(grade => (
              <option key={grade.id} value={grade.id}>
                {grade.grade_name} - {grade.currency} {grade.total_compensation?.toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      )}

      <CandidatesTable 
        candidates={candidates}
        selectedCandidates={selectedCandidates}
        onCandidateSelection={handleCandidateSelection}
        onSelectAll={handleSelectAll}
        showOfferColumns={true}
      />

      {selectedCandidates.length > 0 && selectedPayGrade && (
        <div className="flex justify-end">
          <button
            onClick={sendOffers}
            disabled={sendingOffers || loadingCandidates}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {sendingOffers ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {sendingOffers ? 'Sending...' : `Send Offers (${selectedCandidates.length})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  const BoardTab = () => (
    <div className="space-y-6">
      <CandidatesTable 
        candidates={candidates}
        selectedCandidates={selectedCandidates}
        onCandidateSelection={handleCandidateSelection}
        onSelectAll={handleSelectAll}
        showBoardingColumns={true}
      />

      {selectedCandidates.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={boardCandidates}
            disabled={boardingCandidates || loadingCandidates}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            {boardingCandidates ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>
              {boardingCandidates ? 'Processing...' : `Board Candidates (${selectedCandidates.length})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );

  const CandidatesTable = ({ candidates, selectedCandidates, onCandidateSelection, onSelectAll, showOfferColumns, showBoardingColumns }) => {
    if (!selectedTicket) {
      return (
        <div className={`border-2 border-dashed rounded-lg p-8 text-center ${
          currentTheme === 'dark' 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-gray-50 border-gray-300'
        }`}>
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className={`${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Please select a client and ticket to view candidates
          </p>
        </div>
      );
    }

    if (loadingCandidates) {
      return (
        <div className={`p-8 rounded-lg border ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className={`ml-3 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Loading candidates...
            </span>
          </div>
        </div>
      );
    }

    if (candidates.length === 0) {
      return (
        <div className={`p-8 rounded-lg border text-center ${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
        }`}>
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className={`text-lg font-medium mb-2 ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {activeTab === 'offer' ? 'No Candidates Available for Offers' : 'No Candidates Ready for Boarding'}
          </p>
          <p className={`text-sm ${currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            {activeTab === 'offer' 
              ? 'There are no recommended candidates for this recruitment ticket yet. Candidates will appear here after successful interviews.'
              : 'There are no candidates with accepted offers ready for boarding yet. They will appear here after candidates accept offer letters.'
            }
          </p>
        </div>
      );
    }

    return (
      <div className={`rounded-lg border overflow-hidden ${
        currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
      }`}>
        <div className={`p-4 border-b ${
          currentTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`font-semibold ${
              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {activeTab === 'offer' ? 'Candidates for Offer' : 'Candidates Ready for Boarding'} ({candidates.length})
            </h3>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                onChange={onSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className={`text-sm ${currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Select All
              </span>
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Select
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Candidate
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Contact
                </th>
                {showOfferColumns && (
                  <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Interview Score
                  </th>
                )}
                {showBoardingColumns && (
                  <>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Offer Details
                    </th>
                    <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Start Date
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className={`divide-y divide-gray-200 ${
              currentTheme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className={`${
                    selectedCandidates.includes(candidate.id) 
                      ? 'bg-blue-50' 
                      : currentTheme === 'dark' 
                        ? 'hover:bg-gray-700' 
                        : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => onCandidateSelection(candidate.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className={`text-sm font-medium ${
                        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {candidate.first_name} {candidate.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm ${
                      currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                    }`}>
                      {candidate.email}
                    </div>
                    <div className={`text-sm ${
                      currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {candidate.phone}
                    </div>
                  </td>
                  {showOfferColumns && (
                    <td className="px-4 py-3">
                      <div className={`text-sm ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                      }`}>
                        {candidate.interview_score ? `${candidate.interview_score}/100` : 'N/A'}
                      </div>
                    </td>
                  )}
                  {showBoardingColumns && (
                    <>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {candidate.pay_grade}
                        </div>
                        <div className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          ₦{candidate.offered_salary?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {new Date(candidate.preferred_start_date).toLocaleDateString()}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className={`text-2xl font-bold ${
          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Boarding
        </h1>
      </div>

      <TabButtons />
      <ClientTicketSelection />

      {activeTab === 'offer' ? <OfferTab /> : <BoardTab />}
    </div>
  );
};

export default Boarding;
