<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveApplicationSubmittedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $staff;
    public $leaveApplication;
    public $supervisor;

    /**
     * Create a new message instance.
     */
    public function __construct($staff, $leaveApplication, $supervisor)
    {
        $this->staff = $staff;
        $this->leaveApplication = $leaveApplication;
        $this->supervisor = $supervisor;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Leave Application Submitted - ' . $this->leaveApplication->leave_type,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.leave-submitted',
            with: [
                'staffName' => $this->staff->first_name . ' ' . $this->staff->last_name,
                'leaveType' => $this->leaveApplication->leaveType->name ?? 'Leave',
                'startDate' => $this->leaveApplication->start_date,
                'endDate' => $this->leaveApplication->end_date,
                'supervisorName' => $this->supervisor->supervisor_name ?? 'Your Supervisor',
                'reason' => $this->leaveApplication->reason,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
