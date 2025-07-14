"use client";
import React from "react";

const NextOfKin = ({
  contacts,
  currentTheme,
  preferences,
  onAdd,
  onEdit,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${currentTheme.textPrimary} mb-2 flex items-center`}>
            <span className="mr-2">👫</span>
            Next Of Kin
          </h1>
          <p className={`text-base ${currentTheme.textSecondary}`}>
            Manage your next of kin contact
          </p>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${
              preferences.primaryColor || "#6366f1"
            }, ${(preferences.primaryColor || "#6366f1")}dd)`,
          }}
        >
          Add Next Of Kin
        </button>
      </div>

      {contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact, index) => (
            <div
              key={contact.id || index}
              className={`${currentTheme.cardBg} backdrop-blur-md rounded-2xl p-3 ${currentTheme.border} shadow-xl hover:shadow-2xl transition-all duration-300`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h3 className={`text-xl font-bold ${currentTheme.textPrimary}`}>
                      {contact.full_name}
                    </h3>
                    {contact.is_primary && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-medium">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className={`text-base ${currentTheme.textSecondary} mb-1`}>
                    {contact.relationship}
                  </p>
                  
                  <div className="space-y-1">
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
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(contact)}
                    className={`p-2 ${currentTheme.cardBg} rounded-xl ${currentTheme.border} ${currentTheme.hover} transition-all`}
                  >
                    <svg
                      className={`h-4 w-4 ${currentTheme.textSecondary}`}
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
        <div
          className={`${currentTheme.cardBg} backdrop-blur-md rounded-xl p-6 ${currentTheme.border} shadow-xl text-center`}
        >
          <div className="max-w-md mx-auto">
            <div
              className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl mb-4 shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${
                  preferences.primaryColor || "#6366f1"
                }, ${(preferences.primaryColor || "#6366f1")}dd)`,
              }}
            >
              👫
            </div>
            <h3 className={`text-xl font-bold ${currentTheme.textPrimary} mb-4`}>
              No Next of Kin Added
            </h3>
            <p className={`text-base ${currentTheme.textSecondary} mb-4 leading-relaxed`}>
              Add your Next of Kin for safety and verification purposes.
            </p>
            <button
              onClick={onAdd}
              className="px-4 py-2 text-white rounded-lg font-semibold shadow-lg hover:shadow-lg transition-all transform hover:scale-105"
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

export default NextOfKin;
