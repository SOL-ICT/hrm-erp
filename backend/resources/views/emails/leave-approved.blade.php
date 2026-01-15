<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 5px; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
        .content { background: white; padding: 20px; border-radius: 0 0 5px 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
        .info-box { background: #e8f5e9; padding: 15px; border-left: 4px solid #28a745; margin: 15px 0; }
        .success-badge { background: #28a745; color: white; padding: 10px 15px; border-radius: 3px; font-weight: bold; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✓ Leave Approved</h2>
        </div>
        
        <div class="content">
            <p>Dear <strong>{{ $staffName }}</strong>,</p>
            
            <p>Congratulations! Your leave application has been <span class="success-badge">APPROVED</span></p>
            
            <div class="info-box">
                <h3>Approval Details</h3>
                <p><strong>Leave Type:</strong> {{ $leaveType }}</p>
                <p><strong>Start Date:</strong> {{ \Carbon\Carbon::parse($startDate)->format('d M Y') }}</p>
                <p><strong>End Date:</strong> {{ \Carbon\Carbon::parse($endDate)->format('d M Y') }}</p>
                <p><strong>Approved By:</strong> {{ $approverName }}</p>
                @if($approvedAt)
                    <p><strong>Approval Date:</strong> {{ \Carbon\Carbon::parse($approvedAt)->format('d M Y \a\t H:i') }}</p>
                @endif
            </div>
            
            <p>You are approved to take leave during the specified dates. Please ensure all your work is handed over appropriately before your leave period.</p>
            
            <p>If you have any questions or need to modify your leave dates, please contact your HR department.</p>
            
            <p>Best regards,<br>
            <strong>HRM-ERP System</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
        </div>
    </div>
</body>
</html>
