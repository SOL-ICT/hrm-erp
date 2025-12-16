<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Leave Advice - {{ $doc_number }}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm 2cm 2cm 2cm;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'DejaVu Sans', 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #000;
        }

        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }

        .logo {
            width: 100px;
            height: auto;
        }

        .header {
            text-align: right;
            margin-bottom: 30px;
        }

        .doc-number {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 5px;
        }

        .date {
            font-size: 10pt;
            margin-bottom: 20px;
        }

        .recipient {
            margin-bottom: 30px;
        }

        .recipient-name {
            font-weight: bold;
            margin-bottom: 3px;
        }

        .recipient-address {
            font-size: 10pt;
            line-height: 1.4;
        }

        .salutation {
            margin-bottom: 20px;
        }

        .subject {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 20px;
        }

        .content {
            margin-bottom: 20px;
            text-align: justify;
        }

        .leave-details {
            margin: 25px 0;
            padding: 15px;
            background-color: #f5f5f5;
            border-left: 4px solid #333;
        }

        .leave-details p {
            margin-bottom: 8px;
        }

        .leave-details strong {
            display: inline-block;
            width: 120px;
        }

        .note {
            margin-top: 25px;
            padding: 12px;
            background-color: #fff3cd;
            border-left: 4px solid #ff9800;
            font-size: 10pt;
        }

        .note strong {
            text-decoration: underline;
        }

        .footer {
            margin-top: 40px;
            font-size: 9pt;
            font-style: italic;
            color: #666;
        }

        .signature-space {
            margin-top: 50px;
        }
    </style>
</head>
<body>
    <!-- Logo at the top -->
    @if($logo_base64)
    <div class="logo-container">
        <img src="data:image/png;base64,{{ $logo_base64 }}" alt="Company Logo" class="logo">
    </div>
    @endif

    <div class="header">
        <div class="doc-number">DOC NO: {{ $doc_number }}</div>
        <div class="date">{{ $date }}</div>
    </div>

    <div class="recipient">
        <div class="recipient-name">{{ $staff_name }}</div>
        <div class="recipient-address">{{ $staff_address }}</div>
    </div>

    <div class="salutation">
        Dear {{ explode(' ', $staff_name)[0] }},
    </div>

    <div class="subject">
        Re: REQUEST FOR TIME OFF
    </div>

    <div class="content">
        This is to inform you that your request for <strong>{{ strtolower($leave_type) }}</strong> has been approved.
    </div>

    <div class="leave-details">
        <p><strong>Leave Type:</strong> {{ $leave_type }}</p>
        <p><strong>Duration:</strong> {{ $days_in_words }} ({{ $days }}) day{{ $days > 1 ? 's' : '' }}</p>
        <p><strong>Start Date:</strong> {{ $start_date }}</p>
        <p><strong>End Date:</strong> {{ $end_date }}</p>
        <p><strong>Resumption:</strong> {{ $resumption_date }}</p>
    </div>

    <div class="content">
        We wish you a pleasant time off and look forward to seeing you refreshed upon resumption to the office on <strong>{{ $resumption_date }}</strong>.
    </div>

    <div class="note">
        <strong>Note:</strong> This leave was approved through our leave management portal. Please ensure you complete your handover documentation before proceeding on leave.
    </div>

    <div class="footer">
        <p>This is an automated letter from the HR department and does not require a signature.</p>
        <p>Generated on {{ $date }}</p>
    </div>
</body>
</html>
