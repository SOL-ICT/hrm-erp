<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Leave Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #28a745;">Leave Application Approved</h2>
        
        <p>Dear {{ $staff_name }},</p>
        
        <p>We are pleased to inform you that your leave application has been approved.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin-top: 0;">Leave Details:</h3>
            <p><strong>Leave Type:</strong> {{ $leave_type }}</p>
            <p><strong>Duration:</strong> {{ $days }} day(s)</p>
            <p><strong>From:</strong> {{ $start_date }}</p>
            <p><strong>To:</strong> {{ $end_date }}</p>
            <p><strong>Resumption:</strong> {{ $resumption_date }}</p>
        </div>
        
        <p>Please find your official Leave Advice attached to this email (Document No: {{ $doc_number }}).</p>
        
        <p>Have a pleasant time off and we look forward to your return!</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #666;">
            <strong>This is an automated email from the HR Department</strong><br>
            Please do not reply to this email. For inquiries, contact hr@company.com
        </p>
    </div>
</body>
</html>
