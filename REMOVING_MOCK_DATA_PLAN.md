# Plan: Remove Mock Data & Connect to Real Database

## Date: October 14, 2025

## Database Analysis Complete ✅

### Found in Database:

- **Fiducia Clients:**

  - ID: 25, Name: "FIDUCIA", Prefix: "FDC"
  - ID: 30, Name: "FIDUCIA BUREAU DE CHANGE LIMITED", Prefix: "FID"

- **Existing Templates:**

  - DRIVER1 template exists (ID: 19)
  - Has components in JSON format: allowance_components, deduction_components, statutory_components

- **Table Structure:**
  ```
  calculation_templates:
  - id, name, pay_grade_code, description, version
  - salary_components (JSON)
  - allowance_components (JSON)
  - deduction_components (JSON)
  - statutory_components (JSON)
  - calculation_rules (JSON)
  - annual_division_factor, attendance_calculation_method, prorate_salary
  - is_active, is_default, created_by, updated_by, last_used_at
  ```

---

## Files to Modify:

### 1. **ComponentPalette.jsx** - REMOVE ALL MOCK DATA

**Current:** Hardcoded 13 components

```javascript
const componentLibrary = {
  allowances: {
    items: [
      { type: "housing_allowance", label: "Housing Allowance", formula: "basic_salary * 0.20" },
      { type: "transport_allowance", label: "Transport Allowance", formula: "basic_salary * 0.10" },
      // ... 8 more hardcoded
    ]
  },
  deductions: { items: [...] }, // 2 hardcoded
  statutory: { items: [...] }   // 3 hardcoded
};
```

**New:** Fetch from props (passed from parent)

```javascript
const ComponentPalette = ({
  components,
  onAddComponent,
  onUploadComponent,
}) => {
  // components prop will contain:
  // { allowances: [...], deductions: [...], statutory: [...] }
  // fetched from calculation_templates
};
```

---

### 2. **TemplateLibrary.jsx** - REMOVE MOCK TEMPLATES

**Current:** 4 hardcoded templates (Senior Manager, Mid-Level, Entry, Executive)

**New:** Fetch from calculation_templates table

```javascript
useEffect(() => {
  fetchTemplates();
}, []);

const fetchTemplates = async () => {
  const response = await fetch("/api/calculation-templates");
  setTemplates(response.data);
};
```

---

### 3. **VisualTemplateBuilder.jsx** - ADD DATABASE CONNECTION

**Changes Needed:**

a) **Add props:**

```javascript
const VisualTemplateBuilder = ({ selectedGrade, onClose }) => {
  // selectedGrade will have: grade_code, grade_name, job_structure_id
};
```

b) **Load template on mount:**

```javascript
useEffect(() => {
  if (selectedGrade) {
    loadTemplateForGrade(selectedGrade.grade_code);
  }
}, [selectedGrade]);

const loadTemplateForGrade = async (gradeCode) => {
  try {
    const response = await fetch(`/api/calculation-templates/grade/${gradeCode}`);
    if (response.ok) {
      const template = await response.json();
      // Parse JSON components
      const allComponents = [
        ...Object.entries(JSON.parse(template.allowance_components)).map(([key, val]) => ({
          id: key,
          type: key,
          label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          category: 'allowance',
          formula: val.formula,
          description: val.description
        })),
        ...Object.entries(JSON.parse(template.deduction_components)).map(([key, val]) => ({...})),
        ...Object.entries(JSON.parse(template.statutory_components)).map(([key, val]) => ({...}))
      ];

      setActiveComponents(allComponents);
      setTemplateName(template.name);
      setPayGradeCode(template.pay_grade_code);
    }
  } catch (error) {
    console.log('No existing template, starting fresh');
  }
};
```

c) **Save template:**

```javascript
const handleSave = async () => {
  setIsSaving(true);

  // Group components by category
  const allowances = {};
  const deductions = {};
  const statutory = {};

  activeComponents.forEach((comp) => {
    const data = { formula: comp.formula, description: comp.description };
    if (comp.category === "allowance") allowances[comp.type] = data;
    if (comp.category === "deduction") deductions[comp.type] = data;
    if (comp.category === "statutory") statutory[comp.type] = data;
  });

  const payload = {
    name: templateName,
    pay_grade_code: payGradeCode || selectedGrade.grade_code,
    description: templateDescription,
    allowance_components: JSON.stringify(allowances),
    deduction_components: JSON.stringify(deductions),
    statutory_components: JSON.stringify(statutory),
    salary_components: JSON.stringify({}), // Empty for now
    calculation_rules: JSON.stringify({}), // Empty for now
    is_active: true,
  };

  try {
    const response = await fetch("/api/calculation-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      alert("Template saved successfully!");
    }
  } catch (error) {
    alert("Error saving template: " + error.message);
  }

  setIsSaving(false);
};
```

d) **Add Component Upload Modal:**

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
    isCustom: true,
  };

  setActiveComponents([...activeComponents, component]);
  setShowUploadModal(false);
  setNewComponent({
    name: "",
    formula: "",
    category: "allowance",
    description: "",
  });
};
```

---

### 4. **Backend API Routes** (Laravel)

**Create:** `routes/api.php`

```php
// Calculation Templates
Route::prefix('calculation-templates')->group(function () {
    Route::get('/', [CalculationTemplateController::class, 'index']);
    Route::get('/grade/{gradeCode}', [CalculationTemplateController::class, 'getByGradeCode']);
    Route::post('/', [CalculationTemplateController::class, 'store']);
    Route::put('/{id}', [CalculationTemplateController::class, 'update']);
    Route::delete('/{id}', [CalculationTemplateController::class, 'destroy']);
});
```

**Create:** `app/Http/Controllers/CalculationTemplateController.php`

```php
public function getByGradeCode($gradeCode) {
    $template = CalculationTemplate::where('pay_grade_code', $gradeCode)
        ->where('is_active', true)
        ->first();

    return response()->json($template);
}

public function store(Request $request) {
    $validated = $request->validate([
        'name' => 'required|string',
        'pay_grade_code' => 'required|string',
        'allowance_components' => 'required|json',
        'deduction_components' => 'required|json',
        'statutory_components' => 'required|json',
    ]);

    $template = CalculationTemplate::create($validated);

    return response()->json($template, 201);
}
```

---

## Implementation Order:

1. ✅ **Backend API** - Create routes and controller
2. **VisualTemplateBuilder** - Add load/save functions
3. **ComponentPalette** - Remove mock data, accept props
4. **TemplateLibrary** - Fetch from API
5. **Add Upload Component Modal**
6. **Test with Fiducia DRIVER1**

---

## Current DRIVER1 Template Structure:

```json
{
  "allowance_components": {
    "housing": {
      "formula": "210911.52 / annual_division_factor",
      "description": "Housing Allowance - Annual Amount"
    },
    "transport_allowance": {
      "formula": "250911.48 / annual_division_factor",
      "description": "Transport Allowance - Annual Amount"
    },
    "utility_allowance": {
      "formula": "484911.48 / annual_division_factor",
      "description": "Utility Allowance - Annual Amount"
    },
    "annual_leave": {
      "formula": "30000 / annual_division_factor",
      "description": "Annual Leave - Annual Amount"
    },
    "13th_month": {
      "formula": "20000.04 / annual_division_factor",
      "description": "13th Month - Annual Amount"
    }
  },
  "deduction_components": {
    "group_life_insurance": {
      "formula": "(basic_salary + housing + transport_allowance) * 0.03",
      "description": "Group Life Insurance - 3% of (Basic+Housing+Transport)"
    }
  },
  "statutory_components": {
    "eca": {
      "formula": "gross_salary * 0.01",
      "description": "Employees Compensation Act - 1% of Monthly Gross Salary"
    },
    "itf": {
      "formula": "gross_salary * 0.01",
      "description": "Industrial Training Fund - 1% of Monthly Gross Salary"
    },
    "employer_pension_contribution": {
      "formula": "(basic_salary + housing + transport_allowance) * 0.10",
      "description": "Employer's Pension Contribution - 10% of (Basic+Housing+Transport)"
    }
  }
}
```

This template has **9 components total** - not the hardcoded 13!

---

## Next Action:

Create backend API routes and controller first, then update frontend components.
