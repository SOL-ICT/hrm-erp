import React from "react";
import { History, Construction } from "lucide-react";

const RoleHistoryTab = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Construction className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center justify-center gap-2">
        <History className="w-5 h-5" />
        Role History (Coming Soon)
      </h3>
      <p className="text-gray-600">
        Role change history will be displayed here in Day 4 of implementation.
      </p>
    </div>
  );
};

export default RoleHistoryTab;
