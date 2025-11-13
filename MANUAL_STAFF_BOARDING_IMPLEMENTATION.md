# 📋 **MANUAL STAFF BOARDING SYSTEM - COMPLETE TECHNICAL SPECIFICATION**

## 🎯 **PROJECT OVERVIEW**

**Problem Statement:**

- Current boarding system requires candidates to apply through recruitment process
- Client with 1000+ existing staff needs bulk boarding without re-application
- Need audit trail and ticket-based capacity management

**Solution:**

- Manual staff boarding with ticket-based validation
- Excel bulk upload for large staff transfers
- Maintains audit compliance through recruitment tickets

---

## 📊 **DATABASE ANALYSIS RESULTS**

### **Current State:**

- ✅ Database supports manual boarding (`onboarding_method` enum)
- ✅ Only 1 staff record exists (manual entry)
- ✅ 2 active recruitment requests available
- ✅ 6 active pay grade structures available
- ✅ All necessary related tables exist

### **Key Tables Structure:**

#### **staff** (Main table)

```sql
REQUIRED FIELDS:
- client_id (bigint) -- Links to clients table
- staff_type_id (bigint) -- From client_staff_types
- employee_code (varchar 20, unique) -- Auto-generated
- staff_id (varchar 20, unique) -- Auto-generated
- entry_date (date) -- Start date
- onboarding_method (enum: 'from_candidate','manual_entry','bulk_upload')

ESSENTIAL FIELDS:
- first_name, last_name (varchar 255)
- email (varchar 255, nullable)
- pay_grade_structure_id (bigint, nullable but recommended)
- job_title (varchar 255)

OPTIONAL FIELDS:
- All other personal, banking, education details
```

#### **Related Tables:**

- `staff_personal_info` -- Address, phone, personal details
- `staff_banking` -- Bank account details
- `staff_education` -- Education records
- `staff_experience` -- Work history
- `staff_emergency_contacts` -- Emergency contacts
- `recruitment_requests` -- Ticket validation
- `pay_grade_structures` -- Salary structures

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **Backend Components:**

1. **ManualBoardingController** -- API endpoints
2. **StaffBoardingService** -- Business logic
3. **ExcelTemplateService** -- Template generation
4. **BulkUploadService** -- Excel processing
5. **CodeGenerationService** -- Employee code generation

### **Frontend Components:**

1. **ManualBoardingModal** -- Main boarding interface
2. **ExcelUploadComponent** -- Bulk upload interface
3. **StaffPreviewTable** -- Data validation preview
4. **BoardingIntegration** -- Integration with existing boarding module

---

## 📋 **API SPECIFICATION**

### **1. Manual Boarding Endpoints**

#### **GET /api/manual-boarding/clients**

```json
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "client_name": "TechCorp Ltd",
      "prefix": "TEC",
      "active_tickets": 2
    }
  ]
}
```

#### **GET /api/manual-boarding/tickets/{clientId}**

```json
Response: {
  "success": true,
  "data": [
    {
      "id": 1,
      "ticket_code": "REQ-TEC-001",
      "job_title": "Software Engineer",
      "total_positions": 10,
      "filled_positions": 2,
      "available_positions": 8,
      "job_structure_id": 5
    }
  ]
}
```

#### **GET /api/manual-boarding/pay-grades/{ticketId}**

```json
Response: {
  "success": true,
  "data": [
    {
      "id": 19,
      "grade_name": "Level 5",
      "grade_code": "L5",
      "basic_salary": 450000,
      "total_compensation": 650000,
      "emoluments": {
        "basic_salary": 450000,
        "housing_allowance": 150000,
        "transport_allowance": 50000
      }
    }
  ]
}
```

#### **POST /api/manual-boarding/create-staff**

```json
Request: {
  "client_id": 1,
  "recruitment_request_id": 1,
  "pay_grade_structure_id": 19,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@client.com",
  "entry_date": "2025-10-15",
  "gender": "male",
  "job_title": "Software Engineer"
}

Response: {
  "success": true,
  "data": {
    "staff_id": 3,
    "employee_code": "SOL-TEC-002",
    "staff_internal_id": "SOLTEC002",
    "message": "Staff created successfully"
  }
}
```

### **2. Excel Template Endpoints**

#### **GET /api/manual-boarding/excel-template**

```json
Request: {
  "client_id": 1,
  "recruitment_request_id": 1,
  "pay_grade_structure_id": 19
}

Response: {
  "success": true,
  "data": {
    "download_url": "/storage/templates/manual_boarding_template_TEC_L5.xlsx",
    "template_info": {
      "client_name": "TechCorp Ltd",
      "job_title": "Software Engineer",
      "pay_grade": "Level 5",
      "available_positions": 8
    }
  }
}
```

#### **POST /api/manual-boarding/excel-preview**

```json
Request: FormData with file upload

Response: {
  "success": true,
  "data": {
    "total_records": 50,
    "valid_records": 47,
    "invalid_records": 3,
    "preview_data": [
      {
        "row": 1,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "entry_date": "2025-10-15",
        "status": "valid"
      }
    ],
    "errors": [
      {
        "row": 2,
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

#### **POST /api/manual-boarding/bulk-upload**

```json
Request: {
  "upload_id": "temp_upload_123",
  "confirm": true
}

Response: {
  "success": true,
  "data": {
    "processed": 47,
    "failed": 3,
    "created_staff": [
      {
        "employee_code": "SOL-TEC-003",
        "name": "John Doe"
      }
    ],
    "failed_records": [
      {
        "row": 2,
        "name": "Jane Smith",
        "reason": "Duplicate email address"
      }
    ]
  }
}
```

---

## 🎨 **UI/UX SPECIFICATION**

### **1. Manual Boarding Modal**

#### **Step 1: Client Selection**

```jsx
<Select placeholder="Select Client">
  <Option value="1">TechCorp Ltd (2 active tickets)</Option>
  <Option value="2">RetailCorp (1 active ticket)</Option>
</Select>
```

#### **Step 2: Ticket Selection**

```jsx
<Card>
  <Badge>8 positions available</Badge>
  <h3>Software Engineer (REQ-TEC-001)</h3>
  <p>Job Structure: Full Stack Developer</p>
  <Button>Select This Ticket</Button>
</Card>
```

#### **Step 3: Pay Grade Selection**

```jsx
<Select placeholder="Select Pay Grade">
  <Option value="19">
    Level 5 (₦650,000 total compensation)
    <small>Basic: ₦450,000 + Allowances: ₦200,000</small>
  </Option>
</Select>
```

#### **Step 4: Staff Details Form**

```jsx
<Form>
  <Input name="first_name" label="First Name" required />
  <Input name="last_name" label="Last Name" required />
  <Input name="email" label="Email" type="email" />
  <DatePicker name="entry_date" label="Entry Date" required />
  <Select name="gender" label="Gender">
    <Option value="male">Male</Option>
    <Option value="female">Female</Option>
  </Select>
  <Button type="submit">Create Staff Member</Button>
</Form>
```

### **2. Excel Upload Interface**

#### **Template Generation**

```jsx
<Card>
  <h3>Generate Excel Template</h3>
  <ClientSelect />
  <TicketSelect />
  <PayGradeSelect />
  <Button icon="download">Download Template</Button>
</Card>
```

#### **Upload & Preview**

```jsx
<Card>
  <FileUpload accept=".xlsx,.xls" />
  <PreviewTable data={previewData} />
  <ValidationSummary total={50} valid={47} errors={errors} />
  <Button disabled={hasErrors}>Upload Staff</Button>
</Card>
```

---

## ⚙️ **BUSINESS LOGIC SPECIFICATION**

### **1. Validation Rules**

#### **Capacity Validation**

```javascript
available_positions =
  recruitment_request.number_of_vacancies -
  recruitment_request.staff_accepted_offer;
if (new_staff_count > available_positions) {
  throw new Error(`Only ${available_positions} positions available`);
}
```

#### **Pay Grade Validation**

```javascript
pay_grade = PayGradeStructure.find(pay_grade_id);
if (pay_grade.job_structure_id !== recruitment_request.job_structure_id) {
  throw new Error("Pay grade does not match job structure");
}
```

#### **Unique Code Generation**

```javascript
// Employee Code: SOL-[CLIENT_PREFIX]-[SEQUENCE]
function generateEmployeeCode(client) {
  const lastStaff = Staff.where("client_id", client.id)
    .orderBy("id", "desc")
    .first();
  const sequence = lastStaff ? extractSequence(lastStaff.employee_code) + 1 : 1;
  return `SOL-${client.prefix}-${sequence.toString().padStart(3, "0")}`;
}

// Staff ID: SOL[CLIENT_PREFIX][SEQUENCE]
function generateStaffId(employeeCode) {
  return employeeCode.replace(/-/g, "");
}
```

### **2. Data Processing Flow**

#### **Manual Boarding**

1. Validate client access
2. Check ticket capacity
3. Validate pay grade compatibility
4. Generate unique codes
5. Create staff record
6. Update ticket counter
7. Log audit trail

#### **Bulk Upload**

1. Parse Excel file
2. Validate each row
3. Check batch capacity
4. Generate preview
5. User confirmation
6. Process valid records
7. Generate error report

### **3. Audit Trail**

#### **Boarding Timeline Integration**

```javascript
BoardingTimeline.create({
  boarding_request_id: null, // No boarding request for manual entry
  action: "manual_staff_created",
  description: `Staff ${employee_code} manually boarded for ticket ${ticket_code}`,
  details: {
    staff_id: staff.id,
    employee_code: staff.employee_code,
    ticket_id: recruitment_request.id,
    pay_grade_id: pay_grade_structure_id,
    onboarding_method: "manual_entry",
  },
  performed_by: auth_user_id,
});
```

---

## 📁 **FILE STRUCTURE**

### **Backend Files**

```
backend/
├── app/Http/Controllers/
│   └── ManualBoardingController.php
├── app/Services/
│   ├── StaffBoardingService.php
│   ├── ExcelTemplateService.php
│   ├── BulkUploadService.php
│   └── CodeGenerationService.php
├── routes/modules/recruitment-management/
│   └── manual-boarding.php
└── database/migrations/
    └── [existing tables support the feature]
```

### **Frontend Files**

```
frontend/src/
├── components/admin/modules/recruitment-management/
│   └── submodules/boarding/
│       ├── ManualBoardingModal.jsx
│       ├── ExcelUploadComponent.jsx
│       ├── StaffPreviewTable.jsx
│       └── BoardingOptions.jsx
├── services/modules/recruitment-management/
│   └── manualBoardingAPI.js
└── utils/
    └── excelHelpers.js
```

---

## 🔄 **INTEGRATION POINTS**

### **1. Existing Boarding Module Integration**

- Add "Manual Boarding" button to boarding dashboard
- Integrate with existing staff management
- Use existing employee record components for staff details

### **2. HR & Payroll Integration**

- Manual staff appear in employee records
- Salary calculations use pay grade structures
- Attendance and payroll processing unchanged

### **3. Client Management Integration**

- Respects client-specific staff types
- Uses existing job structures and pay grades
- Maintains client capacity tracking

---

## 🚀 **IMPLEMENTATION PHASES**

### **Phase 1: Backend API Development**

1. Create ManualBoardingController
2. Implement business logic services
3. Add validation rules
4. Create API routes

### **Phase 2: Excel Template System**

1. Template generation service
2. Excel parsing and validation
3. Bulk upload processing
4. Error handling and reporting

### **Phase 3: Frontend Components**

1. Manual boarding modal
2. Excel upload interface
3. Integration with boarding module
4. User experience optimization

### **Phase 4: Testing & Validation**

1. Unit tests for services
2. Integration testing
3. User acceptance testing
4. Performance optimization

---

## 📊 **SUCCESS METRICS**

- ✅ Manual staff boarding without candidate application
- ✅ Bulk upload of 1000+ staff via Excel
- ✅ Ticket capacity validation
- ✅ Audit trail maintenance
- ✅ Integration with existing HR modules
- ✅ User-friendly interface

---

## 🎯 **NEXT STEPS**

1. **Approve Technical Specification** - Review and confirm approach
2. **Start Backend Development** - Begin with API endpoints
3. **Create Excel Template System** - Template generation and processing
4. **Build Frontend Components** - User interface development
5. **Integration Testing** - Ensure seamless workflow
6. **Production Deployment** - Go live with manual boarding

---

_This specification provides a complete roadmap for implementing manual staff boarding while maintaining system integrity and audit compliance._
