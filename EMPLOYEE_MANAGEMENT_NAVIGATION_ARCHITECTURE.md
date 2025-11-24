# Employee Management - Navigation Architecture

## 📐 Navigation Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     AdminLayout Component                        │
│  ┌───────────────┐                    ┌──────────────────────┐  │
│  │               │                    │                      │  │
│  │  AdminNav     │◄───────────────────┤   AdminRouter        │  │
│  │  (Sidebar)    │  onModuleChange    │   (Content Area)     │  │
│  │               │                    │                      │  │
│  └───────────────┘                    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 User Click Flow

```
1. User clicks sidebar: HR & Payroll Management
   ↓
2. Sidebar expands submodules:
   - Employee Record
   - Employee Management  ← User clicks here
   - Payroll Processing
   - Invoicing
   ↓
3. AdminLayout calls: handleModuleChange("hr-payroll-management", "employee-management")
   ↓
4. AdminRouter receives:
   - activeModule: "hr-payroll-management"
   - activeSubmodule: "employee-management"
   ↓
5. AdminRouter switch case matches:
   case "employee-management":
     return <EmployeeManagement {...commonProps} onBack={...} />
   ↓
6. EmployeeManagement component renders with 8 tabs:
   ┌─────────────────────────────────────────────────────────────┐
   │  Employee Management                                   [← Back]│
   │  Manage all staff actions                                    │
   ├─────────────────────────────────────────────────────────────┤
   │ [⛔ Termination] [📈 Promotion] [🔄 Redeployment] ...      │
   ├─────────────────────────────────────────────────────────────┤
   │                                                             │
   │  Tab Content (Client Selector → Staff Selector → Form)     │
   │                                                             │
   └─────────────────────────────────────────────────────────────┘
```

## 🔧 Component Architecture

```
EmployeeManagement.jsx (Main Container)
├── State: activeTab
├── Tab Navigation Buttons (8)
│   ├── Termination ⛔
│   ├── Promotion 📈
│   ├── Redeployment 🔄
│   ├── Caution ⚠️
│   ├── Warning 🚨
│   ├── Suspension ⏸️
│   ├── Query ❓
│   └── Blacklist 🚫
│
└── Tab Content (Dynamic Rendering)
    ├── TerminationTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Termination Form
    │   ├── Bulk Upload Section
    │   │   └── UnmatchedStaffModal (shared)
    │   └── Terminations Table
    │
    ├── PromotionTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Promotion Form (with emolument preview)
    │   ├── Bulk Upload Section
    │   └── Promotions Table
    │
    ├── RedeploymentTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Redeployment Form (dynamic fields by type)
    │   ├── Bulk Upload Section
    │   └── Redeployments Table
    │
    ├── CautionTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Caution Form
    │   ├── Bulk Upload Section
    │   └── Cautions Table
    │
    ├── WarningTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Warning Form
    │   ├── Bulk Upload Section
    │   └── Warnings Table
    │
    ├── SuspensionTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Suspension Form (auto-calc days)
    │   ├── Bulk Upload Section
    │   └── Suspensions Table
    │
    ├── QueryTab.jsx
    │   ├── ClientSelector (shared)
    │   ├── StaffSelector (shared)
    │   ├── Query Form
    │   └── Queries Table (no bulk upload)
    │
    └── BlacklistTab.jsx
        ├── ClientSelector (shared)
        ├── Search Bar
        ├── Blacklisted Staff Table
        └── JSON Snapshot Modal (view-only)
```

## 📊 Data Flow Example (Termination)

```
User Action: Create Termination
  ↓
1. User selects client → ClientSelector fetches staff
  ↓
2. User selects staff → StaffSelector shows selected
  ↓
3. User fills form → formData state updated
  ↓
4. User clicks "Create Termination"
  ↓
5. TerminationTab calls:
     employeeManagementAPI.createTermination(formData)
  ↓
6. API Service sends POST request:
     POST /api/employee-management/terminations
     Body: { staff_id, client_id, termination_type, ... }
  ↓
7. Laravel TerminationController receives request
  ↓
8. Validates data (notice_period ≤ 30, dates valid, etc.)
  ↓
9. Creates termination record in DB
  ↓
10. If is_blacklisted=true:
    ├── Creates blacklist record
    └── Captures JSON snapshot of staff
  ↓
11. Returns success response
  ↓
12. Frontend shows success message
  ↓
13. Refreshes terminations table
```

## 🔄 Bulk Upload Flow

```
User Action: Bulk Upload Terminations
  ↓
1. User downloads template:
     GET /api/employee-management/terminations/template/download
  ↓
2. User fills Excel file with data
  ↓
3. User uploads file → TerminationTab receives file
  ↓
4. TerminationTab calls:
     employeeManagementAPI.bulkUploadTerminations(clientId, file)
  ↓
5. API Service sends POST request:
     POST /api/employee-management/clients/{id}/terminations/bulk-upload
     Body: FormData with file
  ↓
6. Laravel TerminationController receives file
  ↓
7. EmployeeManagementBulkUploadService processes:
     ├── Reads Excel with PhpSpreadsheet
     ├── For each row:
     │   ├── Tries exact staff_id match
     │   ├── If no match, tries fuzzy name match
     │   └── If no match, adds to unmatched_staff array
     ├── Validates matched rows
     └── Creates DB records in transaction
  ↓
8. Returns response:
     {
       success_count: 15,
       errors: [...],           // Validation errors with row numbers
       unmatched_staff: [...]   // Rows that couldn't be matched
     }
  ↓
9. Frontend receives response:
     ├── If unmatched_staff → shows UnmatchedStaffModal
     ├── If errors → shows BulkUploadErrors
     └── If success_count > 0 → shows success message
  ↓
10. User manually maps unmatched staff in modal (future enhancement)
```

## 🎨 Visual Layout Example

```
┌────────────────────────────────────────────────────────────────────┐
│  Employee Management                                    [← Back]    │
│  Manage all staff actions: terminations, promotions, redeployments │
├────────────────────────────────────────────────────────────────────┤
│ [⛔ Termination] [📈 Promotion] [🔄 Redeployment] [⚠️ Caution]    │
│ [🚨 Warning] [⏸️ Suspension] [❓ Query] [🚫 Blacklist]            │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Single Termination Entry                                     │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  Client: [SOL - Sol ICT Limited                          ▼] │ │
│  │                                                              │ │
│  │  Staff:  [SOL001 - John Doe                              ▼] │ │
│  │                                                              │ │
│  │  Termination Type: [Voluntary              ▼]               │ │
│  │  Resignation Date: [2025-01-15]  Notice: [30] days          │ │
│  │  Relieving Date:   [2025-02-14]                             │ │
│  │                                                              │ │
│  │  Exit Interview: [N/A ▼]  PPE Return: [Yes ▼]              │ │
│  │                                                              │ │
│  │  Reason: [___________________________________________]       │ │
│  │          [___________________________________________]       │ │
│  │                                                              │ │
│  │  [✓] Add to Blacklist                                       │ │
│  │                                                              │ │
│  │  [Create Termination]                                        │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Bulk Upload Terminations                                     │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │  [📥 Download Template]                                      │ │
│  │                                                              │ │
│  │  Upload File: [Choose file...]  [Upload]                    │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │ Termination Records (23)                                     │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │ Staff ID  │ Name      │ Type       │ Resign Date │ Relieving │ │
│  │──────────────────────────────────────────────────────────────│ │
│  │ SOL001   │ John Doe  │ Voluntary  │ 2025-01-15  │ 2025-02-14│ │
│  │ SOL002   │ Jane Smith│ Retirement │ 2025-01-10  │ 2025-02-09│ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

## 🔑 Key Differences vs Separate Pages

### ❌ Wrong Approach (Before)

```
/app/employee-management/termination/page.jsx        ← Separate Next.js page
/app/employee-management/promotion/page.jsx          ← Separate Next.js page
/app/employee-management/redeployment/page.jsx       ← Would need separate page
...

User navigates: /employee-management/termination (URL change, page reload)
```

### ✅ Correct Approach (Now)

```
/components/admin/modules/hr-payroll-management/submodules/employee-management/
  ├── EmployeeManagement.jsx                         ← ONE component
  └── tabs/
      ├── TerminationTab.jsx                         ← Tab component
      ├── PromotionTab.jsx                           ← Tab component
      └── ...

User clicks: Termination tab (state change, no reload, same URL)
```

## 📈 Benefits of Tab Approach

1. **Single Page Application Feel**

   - No page reloads between actions
   - Faster navigation
   - Better UX

2. **State Management**

   - Shared state (activeTab)
   - Consistent theme/preferences
   - Shared client selection

3. **Code Reusability**

   - ClientSelector used across all tabs
   - StaffSelector used across all tabs
   - Consistent layout and styling

4. **Follows App Architecture**

   - Matches existing patterns (AdminRouter switch/case)
   - Consistent with other submodules
   - Easier maintenance

5. **Performance**
   - Lazy-loaded main component
   - Tabs render on-demand
   - Shared API service instance

---

**Navigation Path:**

```
Login → Dashboard → HR & Payroll Mgt (sidebar) → Employee Management (submenu) →
→ [Termination Tab] | [Promotion Tab] | [Redeployment Tab] | ... (8 tabs total)
```
