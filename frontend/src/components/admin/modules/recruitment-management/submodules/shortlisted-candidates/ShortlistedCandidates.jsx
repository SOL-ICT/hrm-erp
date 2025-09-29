// File: frontend/src/components/admin/modules/recruitment-management/submodules/shortlisted-candidates/ShortlistedCandidates.jsx

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Users,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Star,
} from "lucide-react";

const ShortlistedCandidates = ({ currentTheme, preferences, onBack }) => {
  const [shortlistedCandidates, setShortlistedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTicket, setFilterTicket] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Mock data for demonstration
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setShortlistedCandidates([
        {
          id: 1,
          name: "Jane Smith",
          email: "jane@email.com",
          phone: "123-456-7891",
          ticket_id: "RR-2025-001",
          job_title: "Software Developer",
          client_name: "Tech Corp",
          blacklist_checked: true,
          shortlisted_date: "2025-08-10",
          experience_years: 5,
          qualification: "Computer Science Degree",
          status: "shortlisted",
          location: "New York, NY"
        },
        {
          id: 2,
          name: "Alice Johnson",
          email: "alice@email.com",
          phone: "123-456-7892",
          ticket_id: "RR-2025-002",
          job_title: "Data Analyst",
          client_name: "Analytics Inc",
          blacklist_checked: true,
          shortlisted_date: "2025-08-11",
          experience_years: 3,
          qualification: "Statistics Masters",
          status: "shortlisted",
          location: "Boston, MA"
        },
        {
          id: 3,
          name: "Robert Wilson",
          email: "robert@email.com",
          phone: "123-456-7893",
          ticket_id: "RR-2025-001",
          job_title: "Software Developer",
          client_name: "Tech Corp",
          blacklist_checked: true,
          shortlisted_date: "2025-08-12",
          experience_years: 7,
          qualification: "Software Engineering",
          status: "shortlisted",
          location: "San Francisco, CA"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getUniqueTickets = () => {
    const tickets = [...new Set(shortlistedCandidates.map(c => c.ticket_id))];
    return tickets.map(ticketId => {
      const candidate = shortlistedCandidates.find(c => c.ticket_id === ticketId);
      return {
        id: ticketId,
        job_title: candidate?.job_title,
        client_name: candidate?.client_name
      };
    });
  };

  const filteredCandidates = shortlistedCandidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.job_title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTicket = filterTicket === "all" || candidate.ticket_id === filterTicket;
    const matchesStatus = filterStatus === "all" || candidate.status === filterStatus;
    
    return matchesSearch && matchesTicket && matchesStatus;
  });

  const stats = {
    total: shortlistedCandidates.length,
    byTicket: getUniqueTickets().map(ticket => ({
      ...ticket,
      count: shortlistedCandidates.filter(c => c.ticket_id === ticket.id).length
    }))
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded-md w-1/3"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded-md"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Shortlisted Candidates
              </h1>
              <p className="text-gray-600 mt-1">
                Candidates who passed blacklist verification and are ready for testing/interviews
              </p>
            </div>

            {/* Summary Stats */}
            <div className="flex gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <div className="text-sm text-blue-600">Total Shortlisted</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Summary by Recruitment Ticket
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.byTicket.map((ticket) => (
              <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{ticket.id}</span>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {ticket.count} shortlisted
                  </span>
                </div>
                <div className="text-gray-700 font-medium">{ticket.job_title}</div>
                <div className="text-sm text-gray-500">{ticket.client_name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, email, or job title..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterTicket}
              onChange={(e) => setFilterTicket(e.target.value)}
            >
              <option value="all">All Tickets</option>
              {getUniqueTickets().map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {ticket.id} - {ticket.job_title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidates List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Shortlisted Candidates ({filteredCandidates.length})
            </h3>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Shortlisted Candidates
              </h3>
              <p className="text-gray-600">
                {searchTerm || filterTicket !== "all"
                  ? "No candidates match your search criteria."
                  : "No candidates have been shortlisted yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCandidates.map((candidate) => (
                <div key={candidate.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {candidate.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {candidate.ticket_id} - {candidate.job_title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <CheckCircle2 size={16} className="text-green-600" />
                          <span className="text-sm text-green-600">Blacklist Cleared</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail size={16} />
                          <span>{candidate.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone size={16} />
                          <span>{candidate.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin size={16} />
                          <span>{candidate.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={16} />
                          <span>Shortlisted: {new Date(candidate.shortlisted_date).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 mt-3">
                        <div className="text-sm">
                          <span className="text-gray-500">Experience:</span>
                          <span className="ml-1 font-medium">{candidate.experience_years} years</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Qualification:</span>
                          <span className="ml-1 font-medium">{candidate.qualification}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-500">Client:</span>
                          <span className="ml-1 font-medium">{candidate.client_name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-6">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">Ready for Next Stage</div>
                        <div className="text-xs text-gray-500">Can proceed to testing/interview</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">Shortlisted</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Next Actions */}
        {filteredCandidates.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Next Steps</h3>
                <p className="text-gray-600">
                  {filteredCandidates.length} candidates are ready for aptitude testing or direct interview scheduling.
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Send Test Invitations
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Schedule Interviews
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortlistedCandidates;
