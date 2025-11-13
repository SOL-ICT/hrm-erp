# Progress Update: Mock Data Removal & API Integration

## Date: October 14, 2025 - Latest Update

---

## ✅ COMPLETED: Backend API with Modular Structure

### What Was Done:

1. **Created CalculationTemplateController**

   - Location: `backend/app/Http/Controllers/CalculationTemplateController.php`
   - Methods:
     - `index()` - List all templates
     - `show($id)` - Get template by ID
     - `getByGradeCode($gradeCode)` - Get template by grade code
     - `store(Request)` - Create new template
     - `update(Request, $id)` - Update existing template
     - `destroy($id)` - Soft delete template (sets is_active = false)
     - `getAllComponents()` - Get all unique components from all templates

2. **Created Modular Route File**

   - Location: `backend/routes/modules/hr-payroll-management/calculation-templates.php`
   - Follows project convention (like salary-structure.php)
   - Prefix: `/api/calculation-templates`
   - All routes named with `calculation-templates.` prefix

3. **Added Module Require**

   - Updated `backend/routes/api.php` line 317
   - Added: `require __DIR__ . '/modules/hr-payroll-management/calculation-templates.php';`
   - Placed in HR & Payroll Management Module section

4. **Verified Routes Loaded**
   - Ran: `docker exec hrm-laravel-api php artisan route:list --path=calculation-templates`
   - Result: 18 routes found (7 new + 11 existing v2 routes)
   - Routes are active and accessible

---

## 📋 API Endpoints Available:

### New Endpoints (For Visual Builder):

```
GET    /api/calculation-templates                   - List all templates
GET    /api/calculation-templates/components        - Get all unique components
GET    /api/calculation-templates/grade/{gradeCode} - Get template by grade
GET    /api/calculation-templates/{id}              - Get specific template
POST   /api/calculation-templates                   - Create new template
PUT    /api/calculation-templates/{id}              - Update template
DELETE /api/calculation-templates/{id}              - Soft delete template
```

### Existing V2 Endpoints (Already in system):

```
GET    /api/v2/calculation-templates                - List templates
POST   /api/v2/calculation-templates                - Create template
GET    /api/v2/calculation-templates/{id}           - Get template
PUT    /api/v2/calculation-templates/{id}           - Update template
DELETE /api/v2/calculation-templates/{id}           - Delete template
GET    /api/v2/calculation-templates/by-grade/{gradeCode}
POST   /api/v2/calculation-templates/validate-formula
POST   /api/v2/calculation-templates/{id}/test-calculation
POST   /api/v2/calculation-templates/{id}/set-default
POST   /api/v2/calculation-templates/{id}/new-version
POST   /api/v2/bulk/calculation-templates/upload
```

---

## 🔍 Database Verification Complete:

### Fiducia Clients Found:

- **ID 25:** "FIDUCIA", Prefix: "FDC"
- **ID 30:** "FIDUCIA BUREAU DE CHANGE LIMITED", Prefix: "FID"

### Existing Templates:

```json
[
  { "id": 17, "name": "Test Template - ADHOC", "pay_grade_code": "ADHOC" },
  { "id": 18, "name": "Test Template - CET", "pay_grade_code": "CET" },
  { "id": 19, "name": "Test Template - DRIVER1", "pay_grade_code": "DRIVER1" }, // ← FIDUCIA
  {
    "id": 20,
    "name": "Senior Manager Template",
    "pay_grade_code": "SENIOR_MGR"
  },
  { "id": 21, "name": "Manager Template", "pay_grade_code": "MANAGER" },
  { "id": 22, "name": "Officer Template", "pay_grade_code": "OFFICER" }
]
```

### DRIVER1 Template Components:

- **Allowances (5):** housing, transport_allowance, utility_allowance, annual_leave, 13th_month
- **Deductions (1):** group_life_insurance
- **Statutory (3):** eca, itf, employer_pension_contribution
- **Total: 9 components** (not the 13 hardcoded mock components!)

---

## 📝 Next Steps (In Order):

### Step 1: Update VisualTemplateBuilder.jsx ⏳

**Current State:** Uses mock data, no API connection

**Changes Needed:**

```javascript
// Add useEffect to load template
useEffect(() => {
  if (selectedGrade && selectedGrade.grade_code) {
    loadTemplate(selectedGrade.grade_code);
  }
}, [selectedGrade]);

const loadTemplate = async (gradeCode) => {
  try {
    const response = await fetch(
      `/api/calculation-templates/grade/${gradeCode}`
    );
    if (response.ok) {
      const template = await response.json();
      parseAndLoadComponents(template);
    }
  } catch (error) {
    console.log("No template found, starting fresh");
  }
};

const parseAndLoadComponents = (template) => {
  const components = [];

  // Parse allowances
  const allowances = JSON.parse(template.allowance_components);
  Object.entries(allowances).forEach(([key, val]) => {
    components.push({
      id: key,
      type: key,
      label: key.replace(/_/g, " ").toUpperCase(),
      category: "allowance",
      formula: val.formula,
      description: val.description,
    });
  });

  // Parse deductions
  const deductions = JSON.parse(template.deduction_components);
  Object.entries(deductions).forEach(([key, val]) => {
    components.push({
      id: key,
      type: key,
      label: key.replace(/_/g, " ").toUpperCase(),
      category: "deduction",
      formula: val.formula,
      description: val.description,
    });
  });

  // Parse statutory
  const statutory = JSON.parse(template.statutory_components);
  Object.entries(statutory).forEach(([key, val]) => {
    components.push({
      id: key,
      type: key,
      label: key.replace(/_/g, " ").toUpperCase(),
      category: "statutory",
      formula: val.formula,
      description: val.description,
    });
  });

  setActiveComponents(components);
  setTemplateName(template.name);
  setPayGradeCode(template.pay_grade_code);
};
```

---

### Step 2: Update ComponentPalette.jsx

**Remove:** All 13 hardcoded components

**Change to:**

- Accept `availableComponents` as prop
- Display components from prop instead of hardcoded library
- Keep drag-and-drop functionality

---

### Step 3: Implement Save Template

```javascript
const handleSave = async () => {
  const allowances = {};
  const deductions = {};
  const statutory = {};

  activeComponents.forEach((comp) => {
    const data = { formula: comp.formula, description: comp.description };
    if (comp.category === "allowance") allowances[comp.type] = data;
    else if (comp.category === "deduction") deductions[comp.type] = data;
    else if (comp.category === "statutory") statutory[comp.type] = data;
  });

  const payload = {
    name: templateName,
    pay_grade_code: payGradeCode,
    description: templateDescription,
    allowance_components: JSON.stringify(allowances),
    deduction_components: JSON.stringify(deductions),
    statutory_components: JSON.stringify(statutory),
    salary_components: "{}",
    calculation_rules: "{}",
  };

  const response = await fetch("/api/calculation-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.ok) {
    alert("Template saved!");
  }
};
```

---

### Step 4: Add Component Upload Modal

```javascript
const [showUploadModal, setShowUploadModal] = useState(false);
const [newComponent, setNewComponent] = useState({
  name: "",
  formula: "",
  category: "allowance",
  description: "",
});

const handleUploadComponent = () => {
  const component = {
    id: newComponent.name.toLowerCase().replace(/ /g, "_"),
    type: newComponent.name.toLowerCase().replace(/ /g, "_"),
    label: newComponent.name,
    category: newComponent.category,
    formula: newComponent.formula,
    description: newComponent.description,
  };

  setActiveComponents([...activeComponents, component]);
  setShowUploadModal(false);
};
```

---

### Step 5: Remove Mock Data from TemplateLibrary

- Fetch templates from `/api/calculation-templates`
- Display real templates instead of 4 hardcoded ones

---

## 🎯 Current Status:

| Task                     | Status         |
| ------------------------ | -------------- |
| Backend API              | ✅ DONE        |
| Modular Routes           | ✅ DONE        |
| Database Verified        | ✅ DONE        |
| DRIVER1 Template Found   | ✅ DONE        |
| Visual Builder Load      | ⏳ IN PROGRESS |
| Component Palette Update | ⏳ PENDING     |
| Save Function            | ⏳ PENDING     |
| Upload Component Modal   | ⏳ PENDING     |
| Remove Mock Library      | ⏳ PENDING     |

---

## 🚀 Ready to Continue:

All backend infrastructure is in place. Next action is to update the frontend Visual Builder to connect to these API endpoints.

**Recommendation:** Start with Step 1 (VisualTemplateBuilder.jsx load function) to test API connectivity with DRIVER1 template.
