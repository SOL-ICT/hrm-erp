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
        .action-button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
        }
        .action-button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Leave Approval Request</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{ $supervisorName }}</strong>,</p>
            
            <p><strong>{{ $staffName }}</strong> has submitted a leave request that requires your approval.</p>
            
            <div class="info-box">
                <h3>Request Details</h3>
                <p><strong>Staff Name:</strong> {{ $staffName }}</p>
                <p><strong>Leave Type:</strong> {{ $leaveType }}</p>
                <p><strong>Start Date:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}</p>
                <p><strong>End Date:</strong> {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}</p>
                @if($reason)
                    <p><strong>Reason:</strong> {{ $reason }}</p>
                @endif
            </div>
            
            <p>Please review the request and click the button below to approve or reject the leave application.</p>
            
            <center>
                <a href="{{ $approvalUrl }}" class="action-button">Review & Approve/Reject</a>
            </center>
            
            <p style="font-size: 12px; color: #666;">
                Or copy this link in your browser: <br>
                <code style="word-break: break-all;">{{ $approvalUrl }}</code>
            </p>
            
            <p>This link will expire in 7 days.</p>
            
            <p>Best regards,<br>
            <strong>HRM-ERP System</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
