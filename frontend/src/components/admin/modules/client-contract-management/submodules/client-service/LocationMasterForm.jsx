"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import ApiService from "../../../../../../services/api";

const LocationMasterForm = ({
  isOpen,
  onClose,
  editingLocation = null,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    location_code: "",
    location_name: "",
    country: "Nigeria",
    state: "",
    city: "",
    address: "",
    pin_code: "",
    phone: "",
    fax: "",
    notes: "",
    contact_name: "",
    contact_phone: "",
    contact_email: "",
    sol_region: "",
    sol_zone: "",
    client_region: "", // Added Client Region
    client_zone: "", // Added Client Zone
    client_id: "",
  });

  const [clients, setClients] = useState([]);
  const [states, setStates] = useState([]);
  const [lgas, setLgas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRegionManager, setShowRegionManager] = useState(false);
  const [error, setError] = useState(null);

  // Load clients and states/LGAs data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [clientsResponse, statesResponse] = await Promise.all([
          ApiService.getClients(),
          ApiService.getStatesLgas()
        ]);

        setClients(clientsResponse.data || []);
        
        // Process states and LGAs
        const statesData = statesResponse.data || [];
        const uniqueStates = [...new Set(statesData.map(item => item.state_name))];
        setStates(uniqueStates);
        setLgas(statesData);
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message || "Failed to load data");
        
        // Fallback to hardcoded data if API fails
        setClients([
          { id: 1, name: "Access Bank Hydrogen" },
          { id: 3, name: "First Bank Nigeria" },
          { id: 4, name: "Zenith Bank PLC" },
        ]);
        setStates(["Lagos", "Abuja FCT", "Rivers", "Kano", "Oyo"]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sample clients data (replace with API call)
  useEffect(() => {
    // Remove hardcoded clients - now loaded from API above
  }, []);

  // Pre-fill form when editing
  useEffect(() => {
    if (editingLocation) {
      setFormData(editingLocation);
    } else {
      // Reset form for new location
      setFormData({
        location_code: "",
        location_name: "",
        country: "Nigeria",
        state: "",
        city: "",
        address: "",
        pin_code: "",
        phone: "",
        fax: "",
        notes: "",
        contact_name: "",
        contact_phone: "",
        contact_email: "",
        sol_region: "",
        sol_zone: "",
        client_region: "", // Added Client Region
        client_zone: "", // Added Client Zone
        client_id: "",
      });
    }
  }, [editingLocation, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Clear city when state changes
      ...(name === 'state' && { city: '' }),
    }));
  };

  // Get cities for selected state
  const getCitiesForState = (stateName) => {
    if (!stateName) return [];
    return [...new Set(lgas.filter(item => item.state_name === stateName).map(item => item.lga_name))];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (editingLocation) {
        // Update existing location
        response = await ApiService.updateServiceLocation(editingLocation.id, formData);
      } else {
        // Create new location
        response = await ApiService.createServiceLocation(formData);
      }

      if (response.success) {
        onSave(response.data);
        onClose();
      } else {
        throw new Error(response.message || 'Failed to save location');
      }
    } catch (error) {
      console.error("Error saving location:", error);
      setError(error.message || "Failed to save location");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              SERVICE LOCATION MASTER - {editingLocation ? "EDIT" : "ADD"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]"
        >
          {/* Error display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="inline-flex text-red-400 hover:text-red-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800">Loading data...</p>
                </div>
              </div>
            </div>
          )}
          {/* Row 1: Location Code, Location Name, Pin Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location_code"
                value={formData.location_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="e.g. ACC-VI-001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location_name"
                value={formData.location_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Victoria Island Branch"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pin Code
              </label>
              <input
                type="text"
                name="pin_code"
                value={formData.pin_code}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="100001"
              />
            </div>
          </div>

          {/* Row 2: Country, State, City */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="Nigeria">Nigeria</option>
                <option value="Ghana">Ghana</option>
                <option value="Kenya">Kenya</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <select
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                disabled={!formData.state}
              >
                <option value="">Select City</option>
                {getCitiesForState(formData.state).map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Phone, Fax, Contact Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+234 801 234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fax
              </label>
              <input
                type="text"
                name="fax"
                value={formData.fax}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+234 1 234 5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Row 4: Contact Phone, Contact Email, Client's Name */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Phone
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+234 802 345 6789"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client's Name <span className="text-red-500">*</span>
              </label>
              <select
                name="client_id"
                value={formData.client_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                required
              >
                <option value="">Select Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: SOL Region, SOL Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SOL Region
              </label>
              <select
                name="sol_region"
                value={formData.sol_region}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select SOL Region</option>
                <option value="North Central">North Central</option>
                <option value="North East">North East</option>
                <option value="North West">North West</option>
                <option value="South East">South East</option>
                <option value="South South">South South</option>
                <option value="South West">South West</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SOL Zone
              </label>
              <select
                name="sol_zone"
                value={formData.sol_zone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select SOL Zone</option>
                <option value="Lagos Zone">Lagos Zone</option>
                <option value="FCT Zone">FCT Zone</option>
                <option value="Port Harcourt Zone">Port Harcourt Zone</option>
                <option value="Kano Zone">Kano Zone</option>
                <option value="Ibadan Zone">Ibadan Zone</option>
              </select>
            </div>
          </div>

          {/* Row 6: Client Region, Client Zone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Region
              </label>
              <div className="flex space-x-2">
                <select
                  name="client_region"
                  value={formData.client_region}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Select Client Region</option>
                  <option value="Lagos Region">Lagos Region</option>
                  <option value="FCT Region">FCT Region</option>
                  <option value="Rivers Region">Rivers Region</option>
                  <option value="Kano Region">Kano Region</option>
                  <option value="Oyo Region">Oyo Region</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowRegionManager(true)}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs"
                  title="Manage Regions & Zones"
                >
                  ⚙️
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Zone
              </label>
              <select
                name="client_zone"
                value={formData.client_zone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select Client Zone</option>
                <option value="Island Zone">Island Zone</option>
                <option value="Marina Zone">Marina Zone</option>
                <option value="Central Zone">Central Zone</option>
                <option value="Mainland Zone">Mainland Zone</option>
                <option value="Victoria Island Zone">
                  Victoria Island Zone
                </option>
              </select>
            </div>
          </div>

          {/* Row 7: Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Complete address of the location"
            />
          </div>

          {/* Row 8: Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              placeholder="Additional notes or comments"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? "Saving..." : "Save"}</span>
          </button>
        </div>

        {/* Region & Zone Manager Modal */}
        {showRegionManager && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">
                    REGION AND ZONE MASTER - ADD
                  </h3>
                  <button
                    onClick={() => setShowRegionManager(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Client Name
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>SAFETRUST MORTGAGE BANK</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Region Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter region name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Zone Name
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter zone name"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Region Name
                    </h4>
                    <div className="border border-gray-300 rounded-md h-40 p-2 bg-gray-50">
                      {/* Region list would go here */}
                      <div className="text-sm text-gray-500">
                        Regions will appear here...
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">
                      Zone Name
                    </h4>
                    <div className="border border-gray-300 rounded-md h-40 p-2 bg-gray-50">
                      {/* Zone list would go here */}
                      <div className="text-sm text-gray-500">
                        Zones will appear here...
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white py-2 px-4 rounded mb-4">
                  <h4 className="text-center font-bold">RECORD LIST</h4>
                </div>

                <div className="border border-gray-300 rounded-md overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">S/N</th>
                        <th className="px-4 py-2 text-left">Client Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Access Bank Hydrogen",
                        "Access Bank Oxygen",
                        "Access Bank Plc (Agent Field Officer)",
                        "Access Bank Plc (Sales 1)",
                        "SAFETRUST MORTGAGE BANK",
                      ].map((client, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">{client}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRegionManager(false)}
                    className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMasterForm;
