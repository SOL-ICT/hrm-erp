import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, ChevronDown, UserCheck, Download, Mail } from 'lucide-react';

const SortedCandidates = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [sortedCandidates, setSortedCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('applicationDate');
  const [filterBy, setFilterBy] = useState('all');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading available tickets
    setTickets([
      { id: 'TCK_2025_0001', title: 'Software Developer - Lagos', totalApplicants: 45, blacklisted: 3 },
      { id: 'TCK_2025_0002', title: 'Accountant - Abuja', totalApplicants: 32, blacklisted: 1 },
      { id: 'TCK_2025_0003', title: 'HR Officer - Port Harcourt', totalApplicants: 28, blacklisted: 2 },
    ]);
  }, []);

  const handleTicketSelection = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call to fetch sorted candidates (blacklist-free)
      // const response = await recruitmentAPI.getSortedCandidates(ticketId);
      
      // Mock sorted candidates data (candidates that passed blacklist check)
      const mockCandidates = [
        {
          id: 1,
          name: 'Alice Johnson',
          email: 'alice.johnson@email.com',
          phone: '+234-801-111-2222',
          applicationDate: '2025-08-10',
          experience: '5 years',
          education: 'BSc Computer Science',
          score: 85,
          status: 'qualified',
          resumeUrl: '/resumes/alice-johnson.pdf',
        },
        {
          id: 2,
          name: 'Bob Williams',
          email: 'bob.williams@email.com',
          phone: '+234-802-333-4444',
          applicationDate: '2025-08-11',
          experience: '3 years',
          education: 'BSc Information Technology',
          score: 78,
          status: 'qualified',
          resumeUrl: '/resumes/bob-williams.pdf',
        },
        {
          id: 3,
          name: 'Carol Davis',
          email: 'carol.davis@email.com',
          phone: '+234-803-555-6666',
          applicationDate: '2025-08-12',
          experience: '7 years',
          education: 'MSc Computer Science',
          score: 92,
          status: 'highly-qualified',
          resumeUrl: '/resumes/carol-davis.pdf',
        },
        {
          id: 4,
          name: 'David Brown',
          email: 'david.brown@email.com',
          phone: '+234-804-777-8888',
          applicationDate: '2025-08-09',
          experience: '2 years',
          education: 'BSc Software Engineering',
          score: 71,
          status: 'qualified',
          resumeUrl: '/resumes/david-brown.pdf',
        },
      ];
      
      setSortedCandidates(mockCandidates);
    } catch (error) {
      console.error('Error fetching sorted candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (criteria) => {
    const sorted = [...sortedCandidates].sort((a, b) => {
      switch (criteria) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'score':
          return b.score - a.score; // Descending
        case 'experience':
          return parseInt(b.experience) - parseInt(a.experience); // Descending
        case 'applicationDate':
          return new Date(b.applicationDate) - new Date(a.applicationDate); // Most recent first
        default:
          return 0;
      }
    });
    setSortedCandidates(sorted);
    setSortBy(criteria);
  };

  const getFilteredCandidates = () => {
    let filtered = sortedCandidates;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.education.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(candidate => candidate.status === filterBy);
    }

    return filtered;
  };

  const filteredCandidates = getFilteredCandidates();
  const qualifiedCount = sortedCandidates.filter(c => c.status === 'qualified').length;
  const highlyQualifiedCount = sortedCandidates.filter(c => c.status === 'highly-qualified').length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'highly-qualified':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            ⭐ Highly Qualified
          </span>
        );
      case 'qualified':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            ✓ Qualified
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            Under Review
          </span>
        );
    }
  };

  return (
    <div className={`p-6 ${currentTheme.cardBg} rounded-lg shadow-lg`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
          <UserCheck className="inline-block w-6 h-6 mr-2" />
          Sorted Candidates
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          Candidates who passed blacklist verification and are ready for screening
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
              {ticket.id} - {ticket.title} ({ticket.totalApplicants - ticket.blacklisted} qualified)
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      {selectedTicket && sortedCandidates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Total Sorted</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {sortedCandidates.length}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Highly Qualified</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {highlyQualifiedCount}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <UserCheck className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Qualified</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {qualifiedCount}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-yellow-500 rounded mr-2"></div>
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Avg Score</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {Math.round(sortedCandidates.reduce((sum, c) => sum + c.score, 0) / sortedCandidates.length)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {selectedTicket && sortedCandidates.length > 0 && (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
              />
            </div>
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => handleSort(e.target.value)}
              className={`pr-8 pl-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
            >
              <option value="applicationDate">Sort by Application Date</option>
              <option value="name">Sort by Name</option>
              <option value="score">Sort by Score</option>
              <option value="experience">Sort by Experience</option>
            </select>
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className={`pr-8 pl-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
            >
              <option value="all">All Candidates</option>
              <option value="highly-qualified">Highly Qualified</option>
              <option value="qualified">Qualified</option>
            </select>
          </div>

          {/* Actions */}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>
      )}

      {/* Candidates Table */}
      {selectedTicket && filteredCandidates.length > 0 && (
        <div className={`overflow-x-auto border rounded-lg ${currentTheme.border}`}>
          <table className="w-full">
            <thead className={`${currentTheme.tableHeader}`}>
              <tr>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Education</th>
                <th className="px-4 py-3 text-center">Experience</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((candidate, index) => (
                <tr key={candidate.id} className={index % 2 === 0 ? currentTheme.tableRowEven : currentTheme.tableRowOdd}>
                  <td className="px-4 py-3">
                    <div>
                      <div className={`font-medium ${currentTheme.textPrimary}`}>
                        {candidate.name}
                      </div>
                      <div className={`text-sm ${currentTheme.textSecondary}`}>
                        Applied: {candidate.applicationDate}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm ${currentTheme.textSecondary}`}>
                      <div>{candidate.email}</div>
                      <div>{candidate.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={`text-sm ${currentTheme.textPrimary}`}>
                      {candidate.education}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${currentTheme.textPrimary}`}>
                      {candidate.experience}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-bold ${currentTheme.textPrimary}`}>
                        {candidate.score}
                      </span>
                      <div className="w-12 h-2 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-2 bg-blue-500 rounded-full"
                          style={{ width: `${candidate.score}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(candidate.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        title="View Resume"
                      >
                        📄
                      </button>
                      <button 
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        title="Send to Screening"
                      >
                        ➤
                      </button>
                      <button 
                        className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                        title="Contact Candidate"
                      >
                        <Mail className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {selectedTicket && filteredCandidates.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-2`}>
            No candidates found
          </h3>
          <p className={`${currentTheme.textSecondary}`}>
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No sorted candidates available for this ticket.'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${currentTheme.textSecondary}`}>Loading candidates...</p>
        </div>
      )}

      {/* Info Note */}
      <div className={`mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded`}>
        <div className="flex">
          <UserCheck className="w-5 h-5 text-green-400 mr-2" />
          <div>
            <p className="text-sm text-green-800">
              <strong>Note:</strong> These candidates have successfully passed the blacklist verification process.
            </p>
            <p className="text-xs text-green-600 mt-1">
              Ready to proceed to screening, testing, or interview stages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SortedCandidates;
