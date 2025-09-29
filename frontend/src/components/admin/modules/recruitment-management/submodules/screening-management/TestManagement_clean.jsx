import React, { useState, useEffect } from 'react';
import { 
  Award, Users, Search, Filter, Download, Eye, BarChart3, TrendingUp, 
  Plus, Edit, Trash2, Clock, CheckCircle, XCircle, FileText, Settings
} from 'lucide-react';

const TestManagement = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('results');

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
      // Mock data for demonstration
      const mockResults = [
        {
          id: 1,
          candidateName: 'Alice Johnson',
          candidateEmail: 'alice.johnson@email.com',
          testDate: '2025-08-10',
          startTime: '10:00 AM',
          endTime: '11:30 AM',
          duration: 90,
          totalQuestions: 20,
          correctAnswers: 17,
          score: 85,
          percentile: 92,
          status: 'completed',
          timeSpent: 85,
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
          percentile: 78,
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
          endTime: '-',
          duration: 90,
          totalQuestions: 20,
          correctAnswers: 0,
          score: 0,
          percentile: 0,
          status: 'pending',
          timeSpent: 0,
          grade: '-',
        }
      ];
      
      setTestResults(mockResults);
    } catch (error) {
      console.error('Error fetching test results:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort test results
  const filteredResults = testResults.filter(result => {
    const matchesSearch = result.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterBy === 'all' || result.status === filterBy;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'score':
        return b.score - a.score;
      case 'name':
        return a.candidateName.localeCompare(b.candidateName);
      case 'date':
        return new Date(b.testDate) - new Date(a.testDate);
      default:
        return 0;
    }
  });

  // Statistics calculation
  const completedTests = testResults.filter(r => r.status === 'completed').length;
  const averageScore = completedTests > 0 
    ? Math.round(testResults.filter(r => r.status === 'completed').reduce((acc, r) => acc + r.score, 0) / completedTests)
    : 0;
  const highScoreCount = testResults.filter(r => r.score >= 80).length;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Completed</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Expired</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Unknown</span>;
    }
  };

  const getGradeBadge = (grade, score) => {
    if (grade === '-') return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">-</span>;
    
    const getGradeColor = (g) => {
      switch (g) {
        case 'A': return 'bg-green-100 text-green-800';
        case 'B': return 'bg-blue-100 text-blue-800';
        case 'C': return 'bg-yellow-100 text-yellow-800';
        case 'D': return 'bg-orange-100 text-orange-800';
        case 'F': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    return <span className={`px-2 py-1 rounded-full text-xs ${getGradeColor(grade)}`}>{grade}</span>;
  };

  return (
    <div className={`p-6 ${currentTheme.cardBg} rounded-lg shadow-lg`}>
      <div className="mb-6">
        <h2 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2`}>
          <Award className="inline-block w-6 h-6 mr-2" />
          Test Management
        </h2>
        <p className={`${currentTheme.textSecondary}`}>
          View and analyze candidate aptitude test results by recruitment ticket
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'results'
              ? 'bg-blue-600 text-white'
              : `${currentTheme.border} ${currentTheme.textSecondary} hover:bg-blue-50`
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Test Results
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'instructions'
              ? 'bg-blue-600 text-white'
              : `${currentTheme.border} ${currentTheme.textSecondary} hover:bg-blue-50`
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Test Instructions
        </button>
      </div>

      {/* Test Results Tab */}
      {activeTab === 'results' && (
        <>
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
                      {testResults.length > 0 ? Math.max(...testResults.map(r => r.score)) : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          {selectedTicket && testResults.length > 0 && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search candidates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg w-full ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                  />
                </div>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`pr-8 pl-4 py-2 border rounded-lg ${currentTheme.inputBg} ${currentTheme.border} ${currentTheme.textPrimary}`}
                >
                  <option value="score">Sort by Score</option>
                  <option value="name">Sort by Name</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>

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
        </>
      )}

      {/* Test Instructions Tab */}
      {activeTab === 'instructions' && (
        <div className="space-y-6">
          <div className="text-center p-8 bg-blue-50 rounded-lg border border-blue-200">
            <FileText size={48} className="mx-auto text-blue-500 mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Test Management Instructions
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This component is for viewing test results only. To create and send test invitations to candidates, 
              please use the <strong>Current Vacancies</strong> module.
            </p>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md mx-auto">
              <h4 className="font-semibold text-gray-800 mb-3">How to Send Test Invitations:</h4>
              <ol className="text-left text-gray-600 space-y-2">
                <li>1. Navigate to <strong>Current Vacancies</strong></li>
                <li>2. Select a vacancy with candidates</li>
                <li>3. Click <strong>Send Invite</strong></li>
                <li>4. Choose <strong>Test Invite</strong> tab</li>
                <li>5. Select from existing tests</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6 max-w-lg mx-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-xs">💡</span>
                  </div>
                </div>
                <div>
                  <h6 className="font-semibold text-yellow-800 mb-1">Quick Navigation</h6>
                  <p className="text-yellow-700 text-sm">
                    Current Vacancies → Actions → Send Invite → Test Invite Tab → Select Existing Test
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
