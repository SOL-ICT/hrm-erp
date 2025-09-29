<?php

namespace App\Mail;

use App\Models\InterviewInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class InterviewInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invitation;

    /**
     * Create a new message instance.
     */
    public function __construct(InterviewInvitation $invitation)
    {
        $this->invitation = $invitation;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $subject = 'Interview Invitation - ' . ($this->invitation->recruitmentRequest->jobStructure->job_title ?? 'Position');

        return $this->from(config('mail.from.address'), config('mail.from.name'))
            ->subject($subject)
            ->view('emails.interview-invitation')
            ->with([
                'invitation' => $this->invitation,
                'candidate' => $this->invitation->candidate,
                'recruitmentRequest' => $this->invitation->recruitmentRequest,
                'jobTitle' => $this->invitation->recruitmentRequest->jobStructure->job_title ?? 'Position',
                'clientName' => $this->invitation->recruitmentRequest->client->organisation_name ?? 'Company',
            ]);
    }
}
