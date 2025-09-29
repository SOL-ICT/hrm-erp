import React, { useState, useEffect } from 'react';
import { AlertTriangle, Search, Users, FileX, UserX, Shield } from 'lucide-react';

const CheckBlacklist = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [blacklistResults, setBlacklistResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  useEffect(() => {
    // Simulate loading available tickets
    setTickets([
      { id: 'TCK_2025_0001', title: 'Software Developer - Lagos' },
      { id: 'TCK_2025_0002', title: 'Accountant - Abuja' },
      { id: 'TCK_2025_0003', title: 'HR Officer - Port Harcourt' },
    ]);
  }, []);

  const handleTicketSelection = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoading(true);
    
    try {
      // TODO: Replace with actual API call to fetch candidates for this ticket
      // const response = await recruitmentAPI.getCandidatesByTicket(ticketId);
      
      // Mock candidates data
      const mockCandidates = [
        {
          id: 1,
          name: 'John Doe',
          email: 'john.doe@email.com',
          phone: '+234-801-234-5678',
          applicationDate: '2025-08-10',
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@email.com',
          phone: '+234-802-345-6789',
          applicationDate: '2025-08-11',
        },
        {
          id: 3,
          name: 'Mike Johnson',
          email: 'mike.johnson@email.com',
          phone: '+234-803-456-7890',
          applicationDate: '2025-08-12',
        },
      ];
      
      setCandidates(mockCandidates);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  const runBlacklistCheck = async () => {
    if (!selectedTicket || candidates.length === 0) return;
    
    setLoading(true);
    
    try {
      // TODO: Replace with actual API calls to check against:
      // 1. Staff terminated list (HR Management module)
      // 2. Dismissed staff list (HR Management module) 
      // 3. AOPN blacklist (HR Management module)
      
      // Mock blacklist check results
      const mockResults = candidates.map(candidate => {
        const isBlacklisted = Math.random() < 0.2; // 20% chance of being blacklisted
        const reasons = [];
        
        if (isBlacklisted) {
          const possibleReasons = [
            'Found in terminated staff list',
            'Found in dismissed staff list',
            'Found in AOPN blacklist',
          ];
          reasons.push(possibleReasons[Math.floor(Math.random() * possibleReasons.length)]);
        }
        
        return {
          ...candidate,
          isBlacklisted,
          blacklistReasons: reasons,
          status: isBlacklisted ? 'BLACKLISTED' : 'CLEAR',
        };
      });
      
      setBlacklistResults(mockResults);
    } catch (error) {
      console.error('Error running blacklist check:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = blacklistResults.filter(candidate =>
    candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const blacklistedCount = blacklistResults.filter(c => c.isBlacklisted).length;
  const clearCount = blacklistResults.filter(c => !c.isBlacklisted).length;

  return (
    <div className={`p-6 ${currentTheme.cardBg} rounded-lg shadow-lg`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
          <Shield className="inline-block w-6 h-6 mr-2" />
          Check Blacklist
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          Verify candidates against terminated staff, dismissed staff, and AOPN blacklist
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
              {ticket.id} - {ticket.title}
            </option>
          ))}
        </select>
      </div>

      {/* Candidates List */}
      {selectedTicket && candidates.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              <Users className="inline-block w-5 h-5 mr-2" />
              Candidates ({candidates.length})
            </h3>
            <button
              onClick={runBlacklistCheck}
              disabled={loading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200`}
            >
              {loading ? 'Checking...' : 'Run Blacklist Check'}
            </button>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {candidates.map(candidate => (
              <div key={candidate.id} className={`p-4 border rounded-lg ${currentTheme.border}`}>
                <h4 className={`font-medium ${currentTheme.textPrimary}`}>
                  {candidate.name}
                </h4>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  {candidate.email}
                </p>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  {candidate.phone}
                </p>
                <p className={`text-xs ${currentTheme.textMuted} mt-2`}>
                  Applied: {candidate.applicationDate}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blacklist Results */}
      {blacklistResults.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-semibold ${currentTheme.textPrimary}`}>
              Blacklist Check Results
            </h3>
            <div className="flex gap-4">
              <span className={`px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm`}>
                Clear: {clearCount}
              </span>
              <span className={`px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm`}>
                Blacklisted: {blacklistedCount}
              </span>
            </div>
          </div>

          {/* Search Filter */}
          <div className="mb-4">
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

          {/* Results Table */}
          <div className={`overflow-x-auto border rounded-lg ${currentTheme.border}`}>
            <table className="w-full">
              <thead className={`${currentTheme.tableHeader}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Candidate</th>
                  <th className="px-4 py-3 text-left">Contact</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((candidate, index) => (
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
                    <td className="px-4 py-3 text-center">
                      {candidate.isBlacklisted ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          <UserX className="w-3 h-3 inline mr-1" />
                          BLACKLISTED
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          ✓ CLEAR
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {candidate.isBlacklisted ? (
                        <div className="text-sm text-red-600">
                          {candidate.blacklistReasons.map((reason, idx) => (
                            <div key={idx} className="flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {reason}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className={`text-sm ${currentTheme.textMuted}`}>-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {candidate.isBlacklisted ? (
                        <button className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700">
                          Remove
                        </button>
                      ) : (
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredResults.length === 0 && (
            <div className="text-center py-8">
              <FileX className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className={`${currentTheme.textSecondary}`}>No candidates match your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className={`mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded`}>
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Blacklist checking requires the HR Management module to be implemented.
              Currently showing mock data for demonstration purposes.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Will check against: Staff Terminated List, Dismissed Staff List, and AOPN Blacklist.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckBlacklist;
