<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 5px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
        .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .info-box { background: #e7f3ff; padding: 15px; border-left: 4px solid #007bff; margin: 15px 0; }
        .success-badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Leave Application Submitted</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{ $staffName }}</strong>,</p>
            
            <p>Your leave application has been successfully submitted and is pending approval.</p>
            
            <div class="info-box">
                <h3>Leave Details</h3>
                <p><strong>Leave Type:</strong> {{ $leaveType }}</p>
                <p><strong>Start Date:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}</p>
                <p><strong>End Date:</strong> {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}</p>
                <p><strong>Supervisor:</strong> {{ $supervisorName }}</p>
                @if($reason)
                    <p><strong>Reason:</strong> {{ $reason }}</p>
                @endif
            </div>
            
            <p>Your supervisor <strong>{{ $supervisorName }}</strong> will review your application and notify you of the decision shortly.</p>
            
            <p>If you have any questions, please contact your HR department.</p>
            
            <p>Best regards,<br>
            <strong>HRM-ERP System</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
