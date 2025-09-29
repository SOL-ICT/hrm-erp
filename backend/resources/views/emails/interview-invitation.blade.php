<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background-color: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }

        .content {
            background-color: #f8fafc;
            padding: 30px;
            border: 1px solid #e2e8f0;
        }

        .details {
            background-color: white;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }

        .details h3 {
            margin-top: 0;
            color: #2563eb;
        }

        .footer {
            background-color: #64748b;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 0 0 8px 8px;
            font-size: 14px;
        }

        .btn {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
        }

        .btn:hover {
            background-color: #1d4ed8;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>Interview Invitation</h1>
        <p>{{ $clientName }}</p>
    </div>

    <div class="content">
        <p>Dear {{ $candidate->first_name }} {{ $candidate->last_name }},</p>

        @if($invitation->message)
        {!! nl2br(e($invitation->message)) !!}
        @else
        <p>We are pleased to inform you that your application for the position of <strong>{{ $jobTitle }}</strong> has been reviewed and we would like to invite you for an interview.</p>
        @endif

        <div class="details">
            <h3>Interview Details</h3>
            <p><strong>Position:</strong> {{ $jobTitle }}</p>
            <p><strong>Company:</strong> {{ $clientName }}</p>
            <p><strong>Ticket ID:</strong> {{ $invitation->recruitmentRequest->ticket_id }}</p>

            @if($invitation->interview_date)
            <p><strong>Date & Time:</strong> {{ \Carbon\Carbon::parse($invitation->interview_date)->format('l, F j, Y \a\t g:i A') }}</p>
            @endif

            @if($invitation->interview_time)
            <p><strong>Time:</strong> {{ $invitation->interview_time }}</p>
            @endif

            @if($invitation->location)
            <p><strong>Location:</strong> {{ $invitation->location }}</p>
            @endif

            <p><strong>Interview Type:</strong>
                @switch($invitation->interview_type)
                @case('in_person')
                In-Person Interview
                @break
                @case('video')
                Video Interview
                @break
                @case('phone')
                Phone Interview
                @break
                @default
                {{ ucfirst($invitation->interview_type) }} Interview
                @endswitch
            </p>
        </div>

        <p>Please confirm your availability for the scheduled interview by replying to this email or contacting our recruitment team.</p>

        <p>We look forward to meeting with you and discussing your qualifications for this position.</p>

        <p>Best regards,<br>
            Recruitment Team<br>
            {{ $clientName }}
        </p>
    </div>

    <div class="footer">
        <p>This is an automated message from the HRM System. Please do not reply directly to this email.</p>
        <p>For any questions, please contact our recruitment team.</p>
    </div>
</body>

</html>