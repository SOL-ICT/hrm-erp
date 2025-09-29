import React, { useState, useEffect } from 'react';
import { 
  Award, Users, Search, Filter, Download, Eye, BarChart3, TrendingUp, 
  Plus, Edit, Trash2, Clock, CheckCircle, XCircle, FileText, Settings, Mail, 
  HelpCircle, PlayCircle, PauseCircle, Archive
} from 'lucide-react';
import testManagementAPI from '@/services/modules/recruitment-management/testManagementAPI';
import currentVacanciesAPI from '@/services/modules/recruitment-management/currentVacanciesAPI';

const TestManagement = ({ currentTheme }) => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState('');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('setup');

  // Test Setup States
  const [availableTests, setAvailableTests] = useState([]);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showQuestionManager, setShowQuestionManager] = useState(false);
  const [selectedTestForQuestions, setSelectedTestForQuestions] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [tempQuestions, setTempQuestions] = useState([]); // For batch creation
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingTest, setEditingTest] = useState(null);
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    duration: 60,
    totalQuestions: 10,
    passingScore: 70,
    category: 'general',
    questions: []
  });
  const [questionForm, setQuestionForm] = useState({
    question: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    correct_answers: [],
    points: 1,
  });

  useEffect(() => {
    fetchAvailableTests();
    fetchTickets();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      const response = await testManagementAPI.getTests();
      if (response.success) {
        setAvailableTests(response.data?.data || response.data || []);
      } else {
        console.error('Failed to fetch tests:', response.message);
        // Keep empty array, don't use fallback mock data
        setAvailableTests([]);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        console.error('Authentication required for test management');
      }
      setAvailableTests([]);
    }
  };

  const fetchTickets = async () => {
    try {
      // Get recruitment requests that have test assignments
      const response = await testManagementAPI.getOverallTestStats();
      if (response.success) {
        // Set actual tickets data from backend, or empty array if none
        setTickets(response.data.tickets || []);
      } else {
        console.error('Failed to fetch tickets:', response.message);
        setTickets([]);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    }
  };

  // Test Management Functions
  const handleCreateTest = () => {
    setEditingTest(null);
    setTestForm({
      title: '',
      description: '',
      duration: 60,
      totalQuestions: 10,
      passingScore: 70,
      category: 'general',
      questions: []
    });
    setShowTestForm(true);
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      title: test.title || '',
      description: test.description || '',
      duration: test.time_limit || 60,
      totalQuestions: test.total_questions || 10,
      passingScore: test.pass_score || 70,
      category: test.category || 'general',
      questions: test.questions || []
    });
    setShowTestForm(true);
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        const response = await testManagementAPI.deleteTest(testId);
        if (response.success) {
          setAvailableTests(prev => prev.filter(test => test.id !== testId));
        } else {
          alert('Failed to delete test: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Failed to delete test');
      }
    }
  };

  const handleChangeTestStatus = async (testId, newStatus) => {
    if (!window.confirm(`Are you sure you want to change this test to ${newStatus}?`)) {
      return;
    }
    
    try {
      const response = await testManagementAPI.changeTestStatus(testId, newStatus);
      if (response.success) {
        // Update the test in the local state
        setAvailableTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: newStatus }
            : test
        ));
        alert(response.message || `Test status changed to ${newStatus} successfully!`);
      } else {
        alert('Failed to change test status: ' + response.message);
      }
    } catch (error) {
      console.error('Error changing test status:', error);
      alert('Failed to change test status: ' + (error.message || 'Network error'));
    }
  };

  const handleManageQuestions = async (test) => {
    setSelectedTestForQuestions(test);
    setShowQuestionManager(true);
    setTempQuestions([]); // Reset temp questions
    
    try {
      const response = await testManagementAPI.getTestQuestions(test.id);
      if (response.success) {
        setQuestions(response.data || []);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestions([]);
    }
  };

  const handleAddAndContinue = () => {
    // Validate current question
    if (!questionForm.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (questionForm.type === 'multiple_choice' && questionForm.options.some(opt => !opt.trim())) {
      alert('Please fill in all options');
      return;
    }

    if (questionForm.correct_answers.length === 0) {
      alert('Please select at least one correct answer');
      return;
    }

    // Add to temp questions with a temporary ID
    const newTempQuestion = {
      ...questionForm,
      tempId: Date.now() + Math.random(), // Temporary ID for display
      order_number: tempQuestions.length + questions.length + 1,
    };

    setTempQuestions(prev => [...prev, newTempQuestion]);
    resetQuestionForm();
    alert('Question added! Add more questions or click "Save Questions" to save all.');
  };

  const handleSaveAllQuestions = async () => {
    if (tempQuestions.length === 0 && !editingQuestion) {
      alert('No questions to save');
      return;
    }

    try {
      if (editingQuestion) {
        // Handle single question edit
        const response = await testManagementAPI.updateTestQuestion(
          selectedTestForQuestions.id, 
          editingQuestion.id, 
          questionForm
        );
        if (response.success) {
          setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? response.data : q));
          setEditingQuestion(null);
          resetQuestionForm();
          setShowQuestionForm(false);
          alert('Question updated successfully!');
        } else {
          alert('Failed to update question: ' + (response.message || 'Unknown error'));
        }
      } else {
        // Handle batch creation
        let successCount = 0;
        let errorCount = 0;

        for (const tempQuestion of tempQuestions) {
          try {
            const response = await testManagementAPI.createTestQuestion(selectedTestForQuestions.id, tempQuestion);
            if (response.success) {
              setQuestions(prev => [...prev, response.data]);
              successCount++;
            } else {
              errorCount++;
              console.error('Failed to create question:', response.message);
            }
          } catch (error) {
            errorCount++;
            console.error('Error creating question:', error);
          }
        }

        // Clear temp questions and close modal
        setTempQuestions([]);
        setShowQuestionForm(false);
        setShowQuestionManager(false);
        setSelectedTestForQuestions(null);

        if (successCount > 0) {
          alert(`Successfully saved ${successCount} question${successCount > 1 ? 's' : ''}!${errorCount > 0 ? ` ${errorCount} failed to save.` : ''}`);
        } else if (errorCount > 0) {
          alert('Failed to save questions. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error saving questions:', error);
      alert('Failed to save questions: ' + (error.message || 'Network error'));
    }
  };

  const handleRemoveTempQuestion = (tempId) => {
    setTempQuestions(prev => prev.filter(q => q.tempId !== tempId));
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        const response = await testManagementAPI.deleteTestQuestion(selectedTestForQuestions.id, questionId);
        if (response.success) {
          setQuestions(prev => prev.filter(q => q.id !== questionId));
          alert('Question deleted successfully!');
        } else {
          alert('Failed to delete question: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting question:', error);
        alert('Failed to delete question');
      }
    }
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answers: [],
      points: 1,
    });
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    
    // Debug: Log the original question data
    console.log('Original question data:', question);
    console.log('Original correct_answers:', question.correct_answers, typeof question.correct_answers);
    
    // Ensure correct_answers is always an array
    let correctAnswers = question.correct_answers || [];
    if (typeof correctAnswers === 'string') {
      try {
        correctAnswers = JSON.parse(correctAnswers);
        console.log('Parsed correct_answers from string:', correctAnswers);
      } catch (e) {
        console.warn('Failed to parse correct_answers:', correctAnswers);
        correctAnswers = [];
      }
    }
    
    const formData = {
      question: question.question || '',
      type: question.type || 'multiple_choice',
      options: question.options || ['', '', '', ''],
      correct_answers: correctAnswers,
      points: question.points || 1,
    };
    
    console.log('Form data being set:', formData);
    console.log('Form correct_answers type:', typeof formData.correct_answers);
    
    setQuestionForm(formData);
    setShowQuestionForm(true);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return;
    
    try {
      // Ensure correct_answers is an array before sending
      const updateData = {
        ...questionForm,
        correct_answers: Array.isArray(questionForm.correct_answers) 
          ? questionForm.correct_answers 
          : (typeof questionForm.correct_answers === 'string' 
              ? JSON.parse(questionForm.correct_answers) 
              : []),
        points: parseFloat(questionForm.points) // Ensure points is numeric
      };
      
      // Debug logging
      console.log('Sending question update data:', updateData);
      console.log('correct_answers type:', typeof updateData.correct_answers);
      console.log('correct_answers value:', updateData.correct_answers);
      console.log('points type:', typeof updateData.points);
      
      const response = await testManagementAPI.updateTestQuestion(
        selectedTestForQuestions.id, 
        editingQuestion.id, 
        updateData
      );
      
      if (response.success) {
        setQuestions(prev => prev.map(q => q.id === editingQuestion.id ? response.data : q));
        setEditingQuestion(null);
        resetQuestionForm();
        setShowQuestionForm(false);
        alert('Question updated successfully!');
      } else {
        alert('Failed to update question: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating question:', error);
      alert('Failed to update question: ' + (error.message || 'Network error'));
    }
  };

  const handleCreateQuestion = async () => {
    // Validate the form
    if (!questionForm.question.trim()) {
      alert('Please enter a question');
      return;
    }

    if (questionForm.type === 'multiple_choice' && questionForm.options.some(option => !option.trim())) {
      alert('Please fill all option fields');
      return;
    }

    if (questionForm.correct_answers.length === 0) {
      alert('Please select at least one correct answer');
      return;
    }

    try {
      const response = await testManagementAPI.createTestQuestion(selectedTestForQuestions.id, questionForm);
      
      if (response.success) {
        setQuestions(prev => [...prev, response.data]);
        resetQuestionForm();
        setShowQuestionForm(false);
        alert('Question created successfully!');
      } else {
        alert('Failed to create question: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Failed to create question: ' + (error.message || 'Network error'));
    }
  };

  const handleSaveTest = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingTest) {
        // Update existing test
        response = await testManagementAPI.updateTest(editingTest.id, testForm);
      } else {
        // Create new test
        response = await testManagementAPI.createTest(testForm);
      }

      if (response.success) {
        await fetchAvailableTests(); // Refresh the list
        setShowTestForm(false);
        setEditingTest(null);
      } else {
        alert('Failed to save test: ' + response.message);
      }
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test');
    }
  };

  const handleTicketSelection = async (ticketId) => {
    setSelectedTicket(ticketId);
    setLoading(true);
    
    try {
      const response = await testManagementAPI.getTestResults(ticketId);
      
      if (response.success) {
        setTestResults(response.data || []);
      } else {
        console.error('Failed to fetch test results:', response.message);
        setTestResults([]);
      }
    } catch (error) {
      console.error('Error fetching test results:', error);
      setTestResults([]);
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
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'setup'
              ? 'bg-blue-600 text-white'
              : `${currentTheme.border} ${currentTheme.textSecondary} hover:bg-blue-50`
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Test Setup
        </button>
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
          <FileText className="w-4 h-4 inline mr-2" />
          Instructions
        </button>
      </div>

      {/* Test Setup Tab */}
      {activeTab === 'setup' && (
        <div className="space-y-6">
          {!showTestForm ? (
            <>
              {/* Header with Create Button */}
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800">Manage Tests</h3>
                <button
                  onClick={handleCreateTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Create New Test
                </button>
              </div>

              {/* Tests Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableTests.map((test) => (
                  <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">{test.title}</h4>
                        <p className="text-gray-600 text-sm mb-3">{test.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{test.total_questions} questions</span>
                          <span>{test.time_limit} mins</span>
                          <span>{test.pass_score}% pass</span>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        test.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : test.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {test.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Used {test.times_used || 0} times
                      </div>
                      
                      <div className="flex gap-1">
                        {/* Status Management Buttons */}
                        {test.status === 'draft' && (
                          <button
                            onClick={() => handleChangeTestStatus(test.id, 'active')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="Activate Test"
                          >
                            <PlayCircle size={14} />
                          </button>
                        )}
                        
                        {test.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleChangeTestStatus(test.id, 'draft')}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Set to Draft"
                            >
                              <PauseCircle size={14} />
                            </button>
                            <button
                              onClick={() => handleChangeTestStatus(test.id, 'archived')}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                              title="Archive Test"
                            >
                              <Archive size={14} />
                            </button>
                          </>
                        )}
                        
                        {test.status === 'archived' && (
                          <button
                            onClick={() => handleChangeTestStatus(test.id, 'draft')}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Restore to Draft"
                          >
                            <PauseCircle size={14} />
                          </button>
                        )}
                        
                        {/* Regular Management Buttons */}
                        <button
                          onClick={() => handleEditTest(test)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Test"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleManageQuestions(test)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Manage Questions"
                        >
                          <HelpCircle size={14} />
                        </button>
                        {test.status !== 'active' && (
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Test"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {availableTests.length === 0 && (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Tests Created</h3>
                  <p className="text-gray-500 mb-4">Create your first test to get started with candidate screening</p>
                  <button
                    onClick={handleCreateTest}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Create Your First Test
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Test Form */
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-6">
                {editingTest ? 'Edit Test' : 'Create New Test'}
              </h3>
              
              <form onSubmit={handleSaveTest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Test Title *
                    </label>
                    <input
                      type="text"
                      value={testForm.title}
                      onChange={(e) => setTestForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Development Assessment"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={testForm.category}
                      onChange={(e) => setTestForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="technical">Technical</option>
                      <option value="aptitude">Aptitude</option>
                      <option value="soft_skills">Soft Skills</option>
                      <option value="domain_specific">Domain Specific</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={testForm.duration}
                      onChange={(e) => setTestForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="15"
                      max="180"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Questions *
                    </label>
                    <input
                      type="number"
                      value={testForm.totalQuestions}
                      onChange={(e) => setTestForm(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Score (%) *
                    </label>
                    <input
                      type="number"
                      value={testForm.passingScore}
                      onChange={(e) => setTestForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={testForm.description}
                    onChange={(e) => setTestForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Describe what this test evaluates..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-xs">💡</span>
                      </div>
                    </div>
                    <div>
                      <h6 className="font-semibold text-blue-800 mb-1">Test Status & Next Steps</h6>
                      <p className="text-blue-700 text-sm mb-2">
                        {editingTest 
                          ? `This test will maintain its current status (${editingTest.status}).`
                          : '• New tests are created as "Draft" and cannot be assigned to candidates until activated.'
                        }
                      </p>
                      <p className="text-blue-700 text-sm">
                        • After saving, add questions using the "Manage Questions" button.
                        <br />
                        • Use the status buttons (▶️ Activate, ⏸️ Draft, 🗃️ Archive) to control test availability.
                        <br />
                        • Only "Active" tests can be assigned to candidates for screening.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingTest ? 'Update Test' : 'Save Test'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTestForm(false);
                      setEditingTest(null);
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

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
              Complete Test Management Workflow
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              This module provides a complete test management system from creation to results analysis.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Settings size={16} className="text-blue-500" />
                  1. Create & Manage Tests
                </h4>
                <ol className="text-left text-gray-600 space-y-2 text-sm">
                  <li>• Use the <strong>Test Setup</strong> tab</li>
                  <li>• Click <strong>Create New Test</strong></li>
                  <li>• Configure test details (duration, questions, etc.)</li>
                  <li>• Save and manage your test library</li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Mail size={16} className="text-green-500" />
                  2. Send Test Invitations
                </h4>
                <ol className="text-left text-gray-600 space-y-2 text-sm">
                  <li>• Go to <strong>Current Vacancies</strong> module</li>
                  <li>• Select a vacancy with candidates</li>
                  <li>• Click <strong>Send Invite</strong> button</li>
                  <li>• Choose <strong>Test Invite</strong> tab</li>
                  <li>• Select from your created tests</li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BarChart3 size={16} className="text-purple-500" />
                  3. View Test Results
                </h4>
                <ol className="text-left text-gray-600 space-y-2 text-sm">
                  <li>• Use the <strong>Test Results</strong> tab</li>
                  <li>• Select a recruitment ticket</li>
                  <li>• View candidate performance</li>
                  <li>• Analyze scores and completion rates</li>
                </ol>
              </div>

              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Award size={16} className="text-orange-500" />
                  4. Make Hiring Decisions
                </h4>
                <ol className="text-left text-gray-600 space-y-2 text-sm">
                  <li>• Review test performance</li>
                  <li>• Compare candidate scores</li>
                  <li>• Send interview invitations</li>
                  <li>• Move to next recruitment phase</li>
                </ol>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 max-w-2xl mx-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-xs">�</span>
                  </div>
                </div>
                <div>
                  <h6 className="font-semibold text-blue-800 mb-1">Quick Start</h6>
                  <p className="text-blue-700 text-sm mb-3">
                    New to the system? Start by creating your first test in the Test Setup tab, 
                    then use it to screen candidates from Current Vacancies.
                  </p>
                  <p className="text-blue-600 text-xs font-medium">
                    Test Setup → Current Vacancies → Send Invites → View Results
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Management Interface */}
      {showQuestionManager && selectedTestForQuestions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Manage Questions - {selectedTestForQuestions.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Current: {questions.length} questions | Target: {selectedTestForQuestions.totalQuestions} questions
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionManager(false);
                    setSelectedTestForQuestions(null);
                    setQuestions([]);
                    setTempQuestions([]);
                    setShowQuestionForm(false);
                    resetQuestionForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Question List */}
              <div className="mb-6">
                {(questions.length > 0 || tempQuestions.length > 0) ? (
                  <div className="space-y-4">
                    {/* Saved Questions */}
                    {questions.map((question, index) => (
                      <div key={question.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                Q{index + 1} (Saved)
                              </span>
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded capitalize">
                                {question.type.replace('_', ' ')}
                              </span>
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {question.points} {question.points === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {question.options.map((option, optIndex) => {
                                  const optionLetter = String.fromCharCode(65 + optIndex); // A, B, C, D
                                  const isCorrect = question.correct_answers && question.correct_answers.includes(optionLetter);
                                  return (
                                    <div key={optIndex} className={`p-2 rounded text-sm ${
                                      isCorrect 
                                        ? 'bg-green-50 border border-green-200 text-green-800' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}>
                                      <span className="font-medium">{optionLetter}.</span> {option}
                                      {isCorrect && <span className="ml-2 text-xs">✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {question.type === 'true_false' && (
                              <div className="flex gap-2 mb-2">
                                {['True', 'False'].map((option, optIndex) => {
                                  const isCorrect = question.correct_answers && question.correct_answers.includes(option);
                                  return (
                                    <div key={optIndex} className={`p-2 rounded text-sm ${
                                      isCorrect 
                                        ? 'bg-green-50 border border-green-200 text-green-800' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}>
                                      {option}
                                      {isCorrect && <span className="ml-2 text-xs">✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {question.type === 'short_answer' && question.correct_answers && (
                              <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                                <span className="text-sm text-green-800">
                                  <strong>Correct answers:</strong> {question.correct_answers.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit Question"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Temporary Questions (not yet saved) */}
                    {tempQuestions.map((question, index) => (
                      <div key={question.tempId} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                                Q{questions.length + index + 1} (Pending)
                              </span>
                              <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded capitalize">
                                {question.type.replace('_', ' ')}
                              </span>
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                {question.points} {question.points === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-3">{question.question}</p>
                            
                            {question.type === 'multiple_choice' && question.options && (
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                {question.options.map((option, optIndex) => {
                                  const optionLetter = String.fromCharCode(65 + optIndex);
                                  const isCorrect = question.correct_answers && question.correct_answers.includes(optionLetter);
                                  return (
                                    <div key={optIndex} className={`p-2 rounded text-sm ${
                                      isCorrect 
                                        ? 'bg-green-50 border border-green-200 text-green-800' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}>
                                      <span className="font-medium">{optionLetter}.</span> {option}
                                      {isCorrect && <span className="ml-2 text-xs">✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {question.type === 'true_false' && (
                              <div className="flex gap-2 mb-2">
                                {['True', 'False'].map((option, optIndex) => {
                                  const isCorrect = question.correct_answers && question.correct_answers.includes(option);
                                  return (
                                    <div key={optIndex} className={`p-2 rounded text-sm ${
                                      isCorrect 
                                        ? 'bg-green-50 border border-green-200 text-green-800' 
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}>
                                      {option}
                                      {isCorrect && <span className="ml-2 text-xs">✓ Correct</span>}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {question.type === 'short_answer' && question.correct_answers && (
                              <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                                <span className="text-sm text-green-800">
                                  <strong>Correct answers:</strong> {question.correct_answers.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => handleRemoveTempQuestion(question.tempId)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Remove Question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <HelpCircle className="mx-auto text-gray-400 mb-4" size={32} />
                    <h4 className="font-medium text-gray-900 mb-2">No Questions Yet</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Start building your test by adding questions below.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setShowQuestionManager(false);
                    setSelectedTestForQuestions(null);
                    setQuestions([]);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      resetQuestionForm();
                      setEditingQuestion(null);
                      setShowQuestionForm(true);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Question
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Form Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingQuestion ? 'Edit Question' : 'Add New Question'}
                </h3>
                <button
                  onClick={() => {
                    setShowQuestionForm(false);
                    setEditingQuestion(null);
                    resetQuestionForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Question Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingQuestion) {
                  handleUpdateQuestion();
                } else {
                  handleCreateQuestion();
                }
              }}>
                {/* Question Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter your question..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type *
                    </label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        setQuestionForm(prev => ({ 
                          ...prev, 
                          type: newType,
                          options: newType === 'multiple_choice' ? ['', '', '', ''] : [],
                          correct_answers: []
                        }));
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="10"
                      required
                    />
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {questionForm.type === 'multiple_choice' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options *
                    </label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, index) => {
                        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                        return (
                          <div key={index} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={questionForm.correct_answers.includes(optionLetter)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setQuestionForm(prev => ({
                                    ...prev,
                                    correct_answers: [...prev.correct_answers, optionLetter]
                                  }));
                                } else {
                                  setQuestionForm(prev => ({
                                    ...prev,
                                    correct_answers: prev.correct_answers.filter(ans => ans !== optionLetter)
                                  }));
                                }
                              }}
                              className="text-blue-600"
                            />
                            <span className="w-8 text-sm font-medium text-gray-600">{optionLetter}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...questionForm.options];
                                newOptions[index] = e.target.value;
                                setQuestionForm(prev => ({ ...prev, options: newOptions }));
                              }}
                              className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              placeholder={`Option ${optionLetter}`}
                              required
                            />
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Check the box next to correct answers. You can select multiple correct answers.
                    </p>
                  </div>
                )}

                {/* True/False */}
                {questionForm.type === 'true_false' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer *
                    </label>
                    <div className="flex gap-4">
                      {['True', 'False'].map((option) => (
                        <label key={option} className="flex items-center">
                          <input
                            type="radio"
                            name="true_false_answer"
                            value={option}
                            checked={questionForm.correct_answers.includes(option)}
                            onChange={(e) => setQuestionForm(prev => ({ 
                              ...prev, 
                              correct_answers: [e.target.value] 
                            }))}
                            className="mr-2 text-blue-600"
                            required
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer */}
                {questionForm.type === 'short_answer' && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answers * (one per line)
                    </label>
                    <textarea
                      value={questionForm.correct_answers.join('\n')}
                      onChange={(e) => setQuestionForm(prev => ({ 
                        ...prev, 
                        correct_answers: e.target.value.split('\n').filter(answer => answer.trim()) 
                      }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter acceptable answers, one per line..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter all acceptable answers. Answer matching will be case-insensitive.
                    </p>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuestionForm(false);
                      setEditingQuestion(null);
                      resetQuestionForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <div className="space-x-3">
                    {!editingQuestion && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            handleAddAndContinue();
                            resetQuestionForm();
                          }}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Add & Continue
                        </button>
                        
                        {tempQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSaveAllQuestions()}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                          >
                            Save Questions ({tempQuestions.length})
                          </button>
                        )}
                      </>
                    )}
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingQuestion ? 'Update Question' : 'Add Question'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestManagement;
