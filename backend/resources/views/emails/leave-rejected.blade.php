<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 5px; }
        .header { background: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
        .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .info-box { background: #ffebee; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
        .reject-badge { background: #dc3545; color: white; padding: 10px 15px; border-radius: 3px; font-weight: bold; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Leave Request Rejected</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{ $staffName }}</strong>,</p>
            
            <p>Your leave application has been <span class="reject-badge">REJECTED</span></p>
            
            <div class="info-box">
                <h3>Request Details</h3>
                <p><strong>Leave Type:</strong> {{ $leaveType }}</p>
                <p><strong>Start Date:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}</p>
                <p><strong>End Date:</strong> {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}</p>
                <p><strong>Rejected By:</strong> {{ $rejectorName }}</p>
            </div>
            
            @if($comments)
                <div class="info-box">
                    <h3>Feedback</h3>
                    <p>{{ $comments }}</p>
                </div>
            @endif
            
            <p>If you would like to discuss this decision or resubmit your request, please contact your supervisor or HR department.</p>
            
            <p>Best regards,<br>
            <strong>HRM-ERP System</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
