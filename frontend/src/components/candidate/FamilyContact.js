"use client";
import React from "react";

const FamilyContact = ({
  contacts,
  currentTheme,
  preferences,
  onAdd,
  onEdit,
}) => {
  return (
    // Main container spacing - Reduce from space-y-8 to space-y-4 or 6
    <div className="space-y-4"> {/* Adjusted from space-y-8 */}

      <div className="flex items-center justify-between">
        <div>
          {/* Main title: Reduce from text-4xl to text-2xl or text-3xl, reduce mb-2 */}
          <h1 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-1 flex items-center`}> {/* Adjusted from text-4xl mb-2 */}
            {/* Emoji margin: Reduce from mr-3 */}
            <span className="mr-2">👨‍👩‍👧‍👦</span> {/* Adjusted from mr-3 */}
            Family Contacts
          </h1>
          {/* Description: Reduce from text-xl to text-base or text-lg */}
          <p className={`text-base ${currentTheme.textSecondary}`}> {/* Adjusted from text-xl */}
            Manage your family contacts
          </p>
        </div>
        {/* Button padding: Reduce from px-8 py-4 to px-4 py-2 or px-6 py-3 */}
        <button
          onClick={onAdd}
          className="px-4 py-2 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105" // Corrected: Moved comment outside className string
          style={{
            background: `linear-gradient(135deg, ${
              preferences.primaryColor || "#6366f1"
            }, ${(preferences.primaryColor || "#6366f1")}dd)`,
          }}
        >
          Add Family Contact
        </button>
      </div>

      {contacts.length > 0 ? (
        // List of contacts container spacing - Reduce from space-y-6 to space-y-3 or 4
        <div className="space-y-3"> {/* Adjusted from space-y-6 */}
          {contacts.map((contact, index) => (
            // Card padding: Reduce from p-6 to p-3 or p-4. Reduce rounded-2xl to rounded-lg or rounded-xl
            <div
              key={contact.id || index}
              className={`${currentTheme.cardBg} backdrop-blur-md rounded-lg p-3 ${currentTheme.border} shadow-md hover:shadow-lg transition-all duration-300`} // Corrected: Moved comment outside className string
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Contact name: Reduce from text-2xl to text-xl or text-lg */}
                  <div className="flex items-center mb-1"> {/* Adjusted from mb-2 */}
                    <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}> {/* Adjusted from text-2xl */}
                      {contact.full_name}
                    </h3>
                    {contact.is_primary && (
                      // Primary tag padding/margin: Reduce from ml-3 px-3 py-1
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium"> {/* Adjusted from ml-3 px-3 py-1 */}
                        Primary
                      </span>
                    )}
                  </div>
                  {/* Relationship: Reduce from text-lg to text-base, reduce mb-2 */}
                  <p className={`text-base ${currentTheme.textSecondary} mb-1`}> {/* Adjusted from text-lg mb-2 */}
                    {contact.relationship}
                  </p>
                  {/* Contact type: Reduce from mb-3 */}
                  <p className={`text-sm ${currentTheme.textMuted} mb-2`}> {/* Adjusted from mb-3 */}
                    {contact.contact_type}
                  </p>
                  {/* Contact details spacing: Reduce from space-y-2 to space-y-1 */}
                  <div className="space-y-1"> {/* Adjusted from space-y-2 */}
                    <p className={`text-sm ${currentTheme.textSecondary}`}>
                      📞 {contact.phone_primary}
                    </p>
                    {contact.phone_secondary && (
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        📱 {contact.phone_secondary}
                      </p>
                    )}
                    {contact.email && (
                      <p className={`text-sm ${currentTheme.textSecondary}`}>
                        ✉️ {contact.email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2"> {/* Adjusted from space-x-3 */}
                  {/* Edit button padding: Reduce from p-3 to p-2 */}
                  <button
                    onClick={() => onEdit(contact)}
                    className={`p-2 ${currentTheme.cardBg} rounded-lg ${currentTheme.border} ${currentTheme.hover} transition-all`} // Corrected: Moved comment outside className string
                  >
                    {/* SVG icon size: Reduce from h-5 w-5 to h-4 w-4 */}
                    <svg
                      className={`h-4 w-4 ${currentTheme.textSecondary}`} // Corrected: Moved comment outside className string
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Empty state card: Reduce from p-16 to p-6 or p-8. Reduce rounded-2xl
        <div
          className={`${currentTheme.cardBg} backdrop-blur-md rounded-xl p-6 ${currentTheme.border} shadow-md text-center`} // Corrected: Moved comment outside className string
        >
          <div className="max-w-md mx-auto">
            {/* Empty state icon size: Reduce from w-24 h-24 to w-16 h-16. Reduce text-4xl to text-2xl. Reduce mb-6 to mb-4 */}
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg" // Corrected: Moved comment outside className string
              style={{
                background: `linear-gradient(135deg, ${
                  preferences.primaryColor || "#6366f1"
                }, ${(preferences.primaryColor || "#6366f1")}dd)`,
              }}
            >
              👨‍👩‍👧‍👦
            </div>
            {/* Empty state heading: Reduce from text-3xl to text-xl or text-2xl. Reduce mb-4 to mb-2 */}
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-2`}> {/* Adjusted from text-3xl mb-4 */}
              No Family Contacts
            </h3>
            {/* Empty state description: Reduce from text-lg to text-base. Reduce mb-8 to mb-4 */}
            <p className={`text-base ${currentTheme.textSecondary} mb-4 leading-normal`}> {/* Adjusted from text-lg mb-8 leading-relaxed */}
              Add family contacts for safety and verification purposes.
            </p>
            {/* Button padding: Same as top button - px-4 py-2 */}
            <button
              onClick={onAdd}
              className="px-4 py-2 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform hover:scale-105" // Corrected: Moved comment outside className string
              style={{
                background: `linear-gradient(135deg, ${
                  preferences.primaryColor || "#6366f1"
                }, ${(preferences.primaryColor || "#6366f1")}dd)`,
              }}
            >
              Add Your First Contact
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FamilyContact;