import React, { useState, useEffect } from 'react';
import { Award, Users, Search, Filter, Download, Eye, BarChart3, TrendingUp } from 'lucide-react';

const AptitudeTestScore = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    // Mock tickets data
    setTickets([
      { id: 'TCK_2025_0001', title: 'Software Developer - Lagos', testsCompleted: 8, testsInvited: 12 },
      { id: 'TCK_2025_0002', title: 'Accountant - Abuja', testsCompleted: 6, testsInvited: 8 },
      { id: 'TCK_2025_0003', title: 'HR Officer - Port Harcourt', testsCompleted: 12, testsInvited: 15 },
    ]);
  }, []);

  const handleTicketSelection = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoading(true);
    
    try {
      // Mock test results data
      const mockResults = [
        {
          id: 1,
          candidateName: 'Alice Johnson',
          candidateEmail: 'alice.johnson@email.com',
          testDate: '2025-08-10',
          startTime: '10:00 AM',
          endTime: '11:30 AM',
          duration: 90, // minutes
          totalQuestions: 20,
          correctAnswers: 17,
          score: 85,
          percentile: 92,
          status: 'completed',
          timeSpent: 85, // minutes
          grade: 'A',
        },
        {
          id: 2,
          candidateName: 'Bob Williams',
          candidateEmail: 'bob.williams@email.com',
          testDate: '2025-08-11',
          startTime: '2:00 PM',
          endTime: '3:20 PM',
          duration: 90,
          totalQuestions: 20,
          correctAnswers: 14,
          score: 70,
          percentile: 75,
          status: 'completed',
          timeSpent: 80,
          grade: 'B',
        },
        {
          id: 3,
          candidateName: 'Carol Davis',
          candidateEmail: 'carol.davis@email.com',
          testDate: '2025-08-12',
          startTime: '9:00 AM',
          endTime: '10:35 AM',
          duration: 90,
          totalQuestions: 20,
          correctAnswers: 19,
          score: 95,
          percentile: 98,
          status: 'completed',
          timeSpent: 95,
          grade: 'A+',
        },
        {
          id: 4,
          candidateName: 'David Brown',
          candidateEmail: 'david.brown@email.com',
          testDate: '2025-08-13',
          startTime: '11:00 AM',
          endTime: '-',
          duration: 90,
          totalQuestions: 20,
          correctAnswers: 0,
          score: 0,
          percentile: 0,
          status: 'pending',
          timeSpent: 0,
          grade: '-',
        },
      ];
      
      setTestResults(mockResults);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (criteria) => {
    const sorted = [...testResults].sort((a, b) => {
      switch (criteria) {
        case 'name':
          return a.candidateName.localeCompare(b.candidateName);
        case 'score':
          return b.score - a.score; // Descending
        case 'testDate':
          return new Date(b.testDate) - new Date(a.testDate); // Most recent first
        case 'timeSpent':
          return a.timeSpent - b.timeSpent; // Ascending
        default:
          return 0;
      }
    });
    setTestResults(sorted);
    setSortBy(criteria);
  };

  const getFilteredResults = () => {
    let filtered = testResults;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(result =>
        result.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(result => result.status === filterBy);
    }

    return filtered;
  };

  const filteredResults = getFilteredResults();
  const completedTests = testResults.filter(r => r.status === 'completed').length;
  const averageScore = testResults.length > 0 
    ? Math.round(testResults.reduce((sum, r) => sum + r.score, 0) / testResults.length)
    : 0;
  const highScoreCount = testResults.filter(r => r.score >= 80).length;

  const getGradeBadge = (grade, score) => {
    if (score === 0) return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">Pending</span>;
    
    const colors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B': 'bg-blue-100 text-blue-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[grade] || 'bg-gray-100 text-gray-800'}`}>
        {grade} ({score}%)
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">✓ Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">⏳ Pending</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">⏰ Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
    }
  };

  return (
    <div className={`p-6 ${currentTheme.cardBg} rounded-lg shadow-lg`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
          <Award className="inline-block w-6 h-6 mr-2" />
          Aptitude Test Scores
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          View and analyze candidate test performance by recruitment ticket
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
              {ticket.id} - {ticket.title} ({ticket.testsCompleted}/{ticket.testsInvited} completed)
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      {selectedTicket && testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Completed Tests</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {completedTests}/{testResults.length}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Average Score</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {averageScore}%
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 text-purple-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>High Performers</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {highScoreCount}
                </p>
              </div>
            </div>
          </div>
          <div className={`p-4 border rounded-lg ${currentTheme.border}`}>
            <div className="flex items-center">
              <Award className="w-5 h-5 text-orange-500 mr-2" />
              <div>
                <p className={`text-sm ${currentTheme.textSecondary}`}>Top Score</p>
                <p className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                  {Math.max(...testResults.map(r => r.score))}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      {selectedTicket && testResults.length > 0 && (
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
              <option value="score">Sort by Score</option>
              <option value="name">Sort by Name</option>
              <option value="testDate">Sort by Test Date</option>
              <option value="timeSpent">Sort by Time Spent</option>
            </select>
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className={`pr-8 pl-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
            >
              <option value="all">All Tests</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Export */}
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>
      )}

      {/* Test Results Table */}
      {selectedTicket && filteredResults.length > 0 && (
        <div className={`overflow-x-auto border rounded-lg ${currentTheme.border}`}>
          <table className="w-full">
            <thead className={`${currentTheme.tableHeader}`}>
              <tr>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-center">Test Date</th>
                <th className="px-4 py-3 text-center">Duration</th>
                <th className="px-4 py-3 text-center">Score</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Percentile</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((result, index) => (
                <tr key={result.id} className={index % 2 === 0 ? currentTheme.tableRowEven : currentTheme.tableRowOdd}>
                  <td className="px-4 py-3">
                    <div>
                      <div className={`font-medium ${currentTheme.textPrimary}`}>
                        {result.candidateName}
                      </div>
                      <div className={`text-sm ${currentTheme.textSecondary}`}>
                        {result.candidateEmail}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`text-sm ${currentTheme.textPrimary}`}>
                      {result.testDate}
                    </div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>
                      {result.startTime} - {result.endTime}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className={`text-sm ${currentTheme.textPrimary}`}>
                      {result.timeSpent}min
                    </div>
                    <div className={`text-xs ${currentTheme.textSecondary}`}>
                      of {result.duration}min
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-lg font-bold ${currentTheme.textPrimary}`}>
                        {result.score}%
                      </span>
                      <div className={`text-xs ${currentTheme.textSecondary}`}>
                        {result.correctAnswers}/{result.totalQuestions}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getGradeBadge(result.grade, result.score)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${currentTheme.textPrimary}`}>
                      {result.percentile > 0 ? `${result.percentile}th` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                        title="View Details"
                        disabled={result.status === 'pending'}
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button 
                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        title="Proceed to Interview"
                        disabled={result.status === 'pending' || result.score < 60}
                      >
                        ➤
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
      {selectedTicket && filteredResults.length === 0 && !loading && (
        <div className="text-center py-12">
          <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className={`text-lg font-medium ${currentTheme.textPrimary} mb-2`}>
            No test results found
          </h3>
          <p className={`${currentTheme.textSecondary}`}>
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No test results available for this ticket.'}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`${currentTheme.textSecondary}`}>Loading test results...</p>
        </div>
      )}

      {/* Score Distribution Chart Placeholder */}
      {selectedTicket && testResults.length > 0 && (
        <div className={`mt-6 p-4 border rounded-lg ${currentTheme.border}`}>
          <h4 className={`font-medium ${currentTheme.textPrimary} mb-3`}>
            Score Distribution
          </h4>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart visualization would go here</p>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className={`mt-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded`}>
        <div className="flex">
          <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Scoring System:</strong> A+ (90-100%), A (80-89%), B (70-79%), C (60-69%), D (50-59%), F (Below 50%)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Candidates with scores above 60% are eligible to proceed to the interview stage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeTestScore;
