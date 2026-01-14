<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveApprovalRequestMail extends Mailable
{
    use Queueable, SerializesModels;

    public $staff;
    public $leaveApplication;
    public $supervisor;
    public $approvalUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($staff, $leaveApplication, $supervisor, $approvalUrl)
    {
        $this->staff = $staff;
        $this->leaveApplication = $leaveApplication;
        $this->supervisor = $supervisor;
        $this->approvalUrl = $approvalUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Leave Approval Request - ' . $this->staff->name,
            to: [$this->supervisor->supervisor_email],
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.leave-approval-request',
            with: [
                'supervisorName' => $this->supervisor->supervisor_name ?? 'Supervisor',
                'staffName' => $this->staff->first_name . ' ' . $this->staff->last_name,
                'leaveType' => $this->leaveApplication->leaveType->name ?? 'Leave',
                'startDate' => $this->leaveApplication->start_date,
                'endDate' => $this->leaveApplication->end_date,
                'reason' => $this->leaveApplication->reason,
                'approvalUrl' => $this->approvalUrl,
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
