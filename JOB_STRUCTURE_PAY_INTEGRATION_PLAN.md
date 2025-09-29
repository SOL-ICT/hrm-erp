# 📊 Job Structure & Pay Calculation Integration Plan

## 🔍 **Analysis Summary**

### **Key Findings:**

1. **Job Structures (5 records)**:

   - All belong to SOL Nigeria (client_id: 1)
   - Jobs: Data Security Analyst, Service Consultant, Project Manager, OL
   - Each job has multiple pay structure types (T1, T3, T7, T9, etc.)

2. **Pay Grade Structures (7 records)**:

   - Linked to job_structure_id
   - Contains detailed emoluments as JSON
   - Total compensation ranges: NGN 50,000 - 1,100,000
   - Examples: {"SALARY": 400000}, {"SALARY": 600000, "HOUSING": 150000, "TRANSPORT": 75000}

3. **Missing Field**: `pay_calculation_basis` needs to be added to `clients` table

---

## 🎯 **Separate Task: Master Setup Extension**

### **TASK**: Add Pay Calculation Basis to Contract Management Master Setup

**Location**: Client Master Setup form in Contract Management

**Implementation Plan**:

### **Step 1: Database Migration**

```sql
ALTER TABLE clients ADD COLUMN pay_calculation_basis
ENUM('working_days', 'calendar_days')
DEFAULT 'working_days'
AFTER client_category;
```

### **Step 2: Update ClientMaster.jsx**

Add field after Business Entity Type:

```jsx
// Pay Calculation Basis field
<div>
  <label
    className={`block text-sm font-medium ${currentTheme.textPrimary} mb-2`}
  >
    Pay Calculation Basis *
  </label>
  <select
    value={formData.pay_calculation_basis}
    onChange={(e) =>
      setFormData((prev) => ({
        ...prev,
        pay_calculation_basis: e.target.value,
      }))
    }
    className={`w-full px-4 py-3 rounded-lg border ${currentTheme.border}`}
  >
    <option value="working_days">Working Days (Monday-Friday)</option>
    <option value="calendar_days">Calendar Days (Full Month)</option>
  </select>
</div>
```

### **Step 3: Update Form State**

```jsx
const [formData, setFormData] = useState({
  // ... existing fields
  client_category: "",
  pay_calculation_basis: "working_days", // Add this
  status: "active",
  contracts: [],
});
```

### **Step 4: Update Backend API**

- Update ClientController to handle `pay_calculation_basis`
- Update validation rules
- Update client creation/update logic

---

## 🚀 **Invoicing Module Integration Points**

### **Frontend Data Fetching Pattern**:

```jsx
// Fetch job structures for a client
const jobStructures = await fetch(`/api/job-structures?client_id=${clientId}`);

// Fetch pay grades for a job structure
const payGrades = await fetch(`/api/pay-grades?job_structure_id=${jobId}`);

// Get client's pay calculation basis
const client = await fetch(`/api/clients/${clientId}`);
const payBasis = client.pay_calculation_basis; // 'working_days' or 'calendar_days'
```

### **Calculation Logic**:

```jsx
// Use the pay basis from Master Setup
if (client.pay_calculation_basis === "working_days") {
  // Calculate based on 22 working days (Mon-Fri)
  const workingDaysInMonth = 22;
  const dailyRate = monthlyEmolument / workingDaysInMonth;
  const actualPay = (attendanceDays / workingDaysInMonth) * monthlyEmolument;
} else {
  // Calculate based on calendar days (28-31 days)
  const calendarDaysInMonth = new Date(year, month, 0).getDate();
  const dailyRate = monthlyEmolument / calendarDaysInMonth;
  const actualPay = (attendanceDays / calendarDaysInMonth) * monthlyEmolument;
}
```

### **Invoice Generation Flow**:

1. Select Client → Get pay_calculation_basis from Master Setup
2. Select Job Structure → Get available roles for that client
3. Select Pay Grade → Get emoluments JSON for calculations
4. Upload Attendance → Apply calculation basis
5. Generate Invoice → Use calculated amounts

---

## 📋 **Implementation Priority**

### **HIGH PRIORITY** (Master Setup Extension):

1. ✅ Analyze current structure (DONE)
2. 🔄 Create database migration for `pay_calculation_basis`
3. 🔄 Update ClientMaster.jsx form
4. 🔄 Update backend API handlers
5. 🔄 Test CRUD operations

### **MEDIUM PRIORITY** (Invoicing Integration):

1. Create APIs to fetch job structures by client
2. Create APIs to fetch pay grades by job structure
3. Build frontend dropdowns for job/grade selection
4. Implement calculation logic using pay basis

---

## 🎯 **Next Immediate Actions**

1. **Create Migration**: Add `pay_calculation_basis` to clients table
2. **Update Master Setup Form**: Add the dropdown field
3. **Test Integration**: Verify it works with existing Contract Management
4. **Documentation**: Update the invoicing plan with this integration

**Ready to implement the Master Setup extension first?**
