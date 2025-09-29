import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Filter,
  Download,
  Eye,
  UserCheck,
  Building,
  Briefcase,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Send,
  User
} from 'lucide-react';

const Boarding = ({ currentTheme, preferences, onBack }) => {
  // State management
  const [activeTab, setActiveTab] = useState('issue-offer'); // 'issue-offer' or 'board'
  const [clients, setClients] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTicket, setSelectedTicket] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [jobStructure, setJobStructure] = useState(null);
  const [payGrades, setPayGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Sample data - will be replaced with API calls
  const sampleClients = [
    { id: 1, company_name: "TechCorp Nigeria", prefix: "TCN" },
    { id: 2, company_name: "Growth Marketing Ltd", prefix: "GML" },
    { id: 3, company_name: "Financial Services Group", prefix: "FSG" }
  ];

  const sampleTickets = [
    {
      id: 1,
      client_id: 1,
      ticket_code: "TCN-2025-001",
      job_title: "Senior Software Developer",
      positions_required: 2,
      positions_filled: 0,
      job_structure_id: 1,
      status: "active"
    },
    {
      id: 2,
      client_id: 1,
      ticket_code: "TCN-2025-002",
      job_title: "UI/UX Designer",
      positions_required: 1,
      positions_filled: 0,
      job_structure_id: 2,
      status: "active"
    }
  ];

  const samplePayGrades = [
    { id: 1, job_structure_id: 1, grade_name: "Level 1", min_salary: 400000, max_salary: 500000 },
    { id: 2, job_structure_id: 1, grade_name: "Level 2", min_salary: 500000, max_salary: 650000 },
    { id: 3, job_structure_id: 1, grade_name: "Level 3", min_salary: 650000, max_salary: 800000 }
  ];

  const sampleCandidatesForOffer = [
    {
      id: 101,
      first_name: "Adebayo",
      last_name: "Johnson",
      email: "adebayo@email.com",
      phone: "+234 801 234 5678",
      feedback_status: "Recommended",
      interview_score: 85
    },
    {
      id: 102,
      first_name: "Fatima",
      last_name: "Abdullahi",
      email: "fatima@email.com",
      phone: "+234 802 345 6789",
      feedback_status: "Recommended",
      interview_score: 92
    }
  ];

  const sampleCandidatesForBoarding = [
    {
      id: 101,
      first_name: "Adebayo",
      last_name: "Johnson",
      email: "adebayo@email.com",
      phone: "+234 801 234 5678",
      offer_status: "accepted",
      offer_sent_at: "2025-09-10",
      offered_salary: 650000,
      pay_grade: "Level 2"
    }
  ];

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      loadTickets(selectedClient);
    } else {
      setTickets([]);
      setSelectedTicket('');
      setCandidates([]);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (selectedTicket) {
      loadCandidatesForTab();
      loadJobStructureAndGrades();
    } else {
      setCandidates([]);
      setJobStructure(null);
      setPayGrades([]);
    }
  }, [selectedTicket, activeTab]);

  const loadClients = () => {
    // TODO: Replace with API call
    setClients(sampleClients);
  };

  const loadTickets = (clientId) => {
    // TODO: Replace with API call
    const clientTickets = sampleTickets.filter(t => t.client_id == clientId);
    setTickets(clientTickets);
  };

  const loadCandidatesForTab = () => {
    // TODO: Replace with API calls
    if (activeTab === 'issue-offer') {
      // Load recommended candidates who haven't received offers
      setCandidates(sampleCandidatesForOffer);
    } else {
      // Load candidates with accepted offers ready for boarding
      setCandidates(sampleCandidatesForBoarding);
    }
  };

  const loadJobStructureAndGrades = () => {
    const ticket = tickets.find(t => t.id == selectedTicket);
    if (ticket) {
      // TODO: Replace with API calls
      setJobStructure({ id: ticket.job_structure_id, name: ticket.job_title });
      const grades = samplePayGrades.filter(g => g.job_structure_id === ticket.job_structure_id);
      setPayGrades(grades);
    }
  };

  const handleSendOffer = (candidateId, payGradeId) => {
    // TODO: Implement send offer logic
    console.log('Sending offer to candidate:', candidateId, 'with grade:', payGradeId);
  };

  const handleBoardCandidate = (candidateId) => {
    // TODO: Implement boarding logic
    console.log('Boarding candidate:', candidateId);
  };

  const TabButtons = () => (
    <div className="flex space-x-1 mb-6">
      <button
        onClick={() => setActiveTab('issue-offer')}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          activeTab === 'issue-offer'
            ? currentTheme === 'dark'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-500 text-white'
            : currentTheme === 'dark'
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <FileText className="w-4 h-4 mr-2 inline" />
        Issue Offer Letter
      </button>
      <button
        onClick={() => setActiveTab('board')}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          activeTab === 'board'
            ? currentTheme === 'dark'
              ? 'bg-green-600 text-white'
              : 'bg-green-500 text-white'
            : currentTheme === 'dark'
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        <UserCheck className="w-4 h-4 mr-2 inline" />
        Board
      </button>
    </div>
  );

  const ClientTicketSelection = () => (
    <div className={`p-4 rounded-lg border mb-6 ${
      currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Client
          </label>
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Choose a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-2 ${
            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Select Recruitment Ticket
          </label>
          <select
            value={selectedTicket}
            onChange={(e) => setSelectedTicket(e.target.value)}
            disabled={!selectedClient}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              currentTheme === 'dark'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            } ${!selectedClient ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="">Choose a ticket...</option>
            {tickets.map(ticket => (
              <option key={ticket.id} value={ticket.id}>
                {ticket.ticket_code} - {ticket.job_title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTicket && jobStructure && (
        <div className={`mt-4 p-3 rounded border ${
          currentTheme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
              <span className={`font-medium ${
                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Job Structure: {jobStructure.name}
              </span>
            </div>
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-500" />
              <span className={`text-sm ${
                currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {payGrades.length} pay grades available
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`min-h-screen p-6 ${
      currentTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Boarding Management</h1>
        <p className={`${
          currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
        }`}>
          Issue offer letters and board accepted candidates
        </p>
      </div>

      {/* Tab Navigation */}
      <TabButtons />

      {/* Client and Ticket Selection */}
      <ClientTicketSelection />

      {/* Content based on selected client/ticket */}
      {!selectedClient || !selectedTicket ? (
        <div className={`${
          currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } rounded-lg border p-12 text-center`}>
          <Users className={`w-16 h-16 mx-auto mb-4 ${
            currentTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
          }`} />
          <h3 className={`text-xl font-semibold mb-2 ${
            currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Select Client and Ticket
          </h3>
          <p className={`${
            currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Choose a client and recruitment ticket to {activeTab === 'issue-offer' ? 'issue offers' : 'board candidates'}
          </p>
        </div>
      ) : (
        <div>
          {/* Search and Filter */}
          <div className={`p-4 rounded-lg border mb-6 ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {activeTab === 'board' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    currentTheme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="all">All Statuses</option>
                  <option value="accepted">Offer Accepted</option>
                  <option value="pending_boarding">Pending Boarding</option>
                </select>
              )}

              <button
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  currentTheme === 'dark'
                    ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                    : 'bg-green-500 hover:bg-green-600 text-white border-green-500'
                }`}
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Export
              </button>
            </div>
          </div>

          {/* Candidates List */}
          <div className={`rounded-lg border overflow-hidden ${
            currentTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {candidates.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${
                  currentTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <h3 className={`text-xl font-semibold mb-2 ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  No Candidates Available
                </h3>
                <p className={`${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {activeTab === 'issue-offer' 
                    ? 'No recommended candidates found for this ticket'
                    : 'No candidates with accepted offers ready for boarding'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${
                    currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Candidate
                      </th>
                      {activeTab === 'issue-offer' ? (
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                          currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          Interview Score
                        </th>
                      ) : (
                        <>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Offer Details
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            Status
                          </th>
                        </>
                      )}
                      <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        currentTheme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${
                    currentTheme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}>
                    {candidates.map((candidate) => (
                      <tr key={candidate.id} className={`hover:${
                        currentTheme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              currentTheme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              <User className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                {candidate.first_name} {candidate.last_name}
                              </div>
                              <div className={`text-sm ${
                                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {candidate.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        {activeTab === 'issue-offer' ? (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                            }`}>
                              {candidate.interview_score}%
                            </div>
                            <div className={`text-sm ${
                              currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {candidate.feedback_status}
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>
                                ₦{candidate.offered_salary?.toLocaleString()}
                              </div>
                              <div className={`text-sm ${
                                currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {candidate.pay_grade}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                candidate.offer_status === 'accepted' 
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              }`}>
                                {candidate.offer_status === 'accepted' ? 'Offer Accepted' : 'Pending Boarding'}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {activeTab === 'issue-offer' ? (
                            <select
                              onChange={(e) => e.target.value && handleSendOffer(candidate.id, e.target.value)}
                              className={`px-3 py-1 rounded text-xs border ${
                                currentTheme === 'dark'
                                  ? 'bg-blue-600 border-blue-600 text-white'
                                  : 'bg-blue-500 border-blue-500 text-white'
                              }`}
                            >
                              <option value="">Send Offer...</option>
                              {payGrades.map(grade => (
                                <option key={grade.id} value={grade.id}>
                                  {grade.grade_name} (₦{grade.min_salary?.toLocaleString()} - ₦{grade.max_salary?.toLocaleString()})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => handleBoardCandidate(candidate.id)}
                              className={`inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${
                                currentTheme === 'dark'
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-green-100 hover:bg-green-200 text-green-800'
                              }`}
                            >
                              <UserCheck className="w-3 h-3 mr-1" />
                              Board Now
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-4 text-white hover:text-gray-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default Boarding;
