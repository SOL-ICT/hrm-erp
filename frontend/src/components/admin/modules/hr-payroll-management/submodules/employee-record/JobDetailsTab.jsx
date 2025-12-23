import { Building2, MapPin, Award, Calendar, Briefcase, FileText } from "lucide-react";

const JobDetailsTab = ({ staffData, isEditing }) => {
  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Details Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Job Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Job Title / Job Structure */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Title
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.jobDetails?.job_structure ? (
                <div>
                  <p className="font-semibold text-gray-900">
                    {staffData.jobDetails.job_structure.job_title}
                  </p>
                  {staffData.jobDetails.job_structure.job_code && (
                    <p className="text-xs text-gray-500 mt-1">
                      Code: {staffData.jobDetails.job_structure.job_code}
                    </p>
                  )}
                </div>
              ) : staffData.basic?.job_title ? (
                <p className="text-gray-900">{staffData.basic.job_title}</p>
              ) : (
                <p className="text-gray-400 italic">Not assigned</p>
              )}
            </div>
          </div>

          {/* Service Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Service Location
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.jobDetails?.service_location ? (
                <div>
                  <p className="font-semibold text-gray-900">
                    {staffData.jobDetails.service_location.location_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {[
                      staffData.jobDetails.service_location.city,
                      staffData.jobDetails.service_location.state
                    ].filter(Boolean).join(', ') || 'Location not specified'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 italic">Not assigned</p>
              )}
            </div>
          </div>

          {/* SOL Office */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                SOL Office
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.jobDetails?.sol_office ? (
                <div>
                  <p className="font-semibold text-gray-900">
                    {staffData.jobDetails.sol_office.office_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {staffData.jobDetails.sol_office.state_name}
                  </p>
                  {staffData.jobDetails.sol_office.office_code && (
                    <p className="text-xs text-gray-400 mt-1">
                      Code: {staffData.jobDetails.sol_office.office_code}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Not assigned</p>
              )}
            </div>
          </div>

          {/* Pay Grade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Pay Grade
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.jobDetails?.pay_grade ? (
                <div>
                  <p className="font-semibold text-gray-900">
                    {staffData.jobDetails.pay_grade.grade_name}
                  </p>
                  {staffData.jobDetails.pay_grade.grade_code && (
                    <p className="text-xs text-gray-500 mt-1">
                      Code: {staffData.jobDetails.pay_grade.grade_code}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 italic">Not assigned</p>
              )}
            </div>
          </div>

          {/* Date of Join */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date of Join
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.basic?.date_of_join ? (
                <p className="text-gray-900 font-medium">
                  {formatDate(staffData.basic.date_of_join)}
                </p>
              ) : staffData.basic?.entry_date ? (
                <p className="text-gray-900 font-medium">
                  {formatDate(staffData.basic.entry_date)}
                </p>
              ) : (
                <p className="text-gray-400 italic">Not specified</p>
              )}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Department
              </div>
            </label>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              {staffData.basic?.department ? (
                <p className="text-gray-900">{staffData.basic.department}</p>
              ) : (
                <p className="text-gray-400 italic">Not specified</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recruitment Information Card */}
      {staffData.jobDetails?.recruitment_request && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Recruitment Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Recruitment Ticket
              </label>
              <p className="text-blue-900 font-mono font-semibold">
                {staffData.jobDetails.recruitment_request.ticket_id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-700 mb-1">
                Boarding Method
              </label>
              <p className="text-blue-900">
                {staffData.basic?.boarding_method === 'from_candidate' && 'From Candidate Application'}
                {staffData.basic?.boarding_method === 'manual_entry' && 'Manual Entry'}
                {staffData.basic?.boarding_method === 'bulk_upload' && 'Bulk Upload'}
                {!staffData.basic?.boarding_method && 'Not specified'}
              </p>
            </div>
            {staffData.jobDetails.recruitment_request.created_at && (
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">
                  Ticket Created
                </label>
                <p className="text-blue-900">
                  {formatDate(staffData.jobDetails.recruitment_request.created_at)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Data Completeness Indicator */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Job Details Completeness</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className={`text-center p-2 rounded ${staffData.jobDetails?.job_structure ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            <div className="text-xs font-medium">Job Title</div>
            <div className="text-lg">
              {staffData.jobDetails?.job_structure ? '✓' : '✗'}
            </div>
          </div>
          <div className={`text-center p-2 rounded ${staffData.jobDetails?.service_location ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            <div className="text-xs font-medium">Location</div>
            <div className="text-lg">
              {staffData.jobDetails?.service_location ? '✓' : '✗'}
            </div>
          </div>
          <div className={`text-center p-2 rounded ${staffData.jobDetails?.sol_office ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            <div className="text-xs font-medium">SOL Office</div>
            <div className="text-lg">
              {staffData.jobDetails?.sol_office ? '✓' : '✗'}
            </div>
          </div>
          <div className={`text-center p-2 rounded ${staffData.jobDetails?.pay_grade ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            <div className="text-xs font-medium">Pay Grade</div>
            <div className="text-lg">
              {staffData.jobDetails?.pay_grade ? '✓' : '✗'}
            </div>
          </div>
          <div className={`text-center p-2 rounded ${staffData.basic?.date_of_join || staffData.basic?.entry_date ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-500'}`}>
            <div className="text-xs font-medium">Join Date</div>
            <div className="text-lg">
              {staffData.basic?.date_of_join || staffData.basic?.entry_date ? '✓' : '✗'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsTab;
