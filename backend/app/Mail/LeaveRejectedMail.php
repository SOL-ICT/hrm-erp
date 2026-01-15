<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LeaveRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $staff;
    public $leaveApplication;
    public $rejectorName;
    public $comments;

    /**
     * Create a new message instance.
     */
    public function __construct($staff, $leaveApplication, $rejectorName, $comments = null)
    {
        $this->staff = $staff;
        $this->leaveApplication = $leaveApplication;
        $this->rejectorName = $rejectorName;
        $this->comments = $comments;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Leave Request Rejected - ' . $this->leaveApplication->leave_type,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.leave-rejected',
            with: [
                'staffName' => $this->staff->first_name . ' ' . $this->staff->last_name,
                'leaveType' => $this->leaveApplication->leaveType->name ?? 'Leave',
                'startDate' => $this->leaveApplication->start_date,
                'endDate' => $this->leaveApplication->end_date,
                'rejectorName' => $this->rejectorName,
                'comments' => $this->comments,
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
