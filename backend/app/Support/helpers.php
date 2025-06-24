<?php

/**
 * Generate the list of next steps for a user profile.
 *
 * @param  \App\Models\Profile|null  $profile
 * @param  bool  $hasEducation
 * @param  bool  $hasExperience
 * @param  bool  $hasEmergencyContact
 * @return array<int, string>
 */
if (! function_exists('getNextSteps')) {
    function getNextSteps($profile, $hasEducation, $hasExperience, $hasEmergencyContact)
    {
        $steps = [];

        if (
            ! $profile || ! $profile->first_name || ! $profile->last_name || ! $profile->date_of_birth ||
            ! $profile->gender || ! $profile->phone_primary
        ) {
            $steps[] = 'Complete your basic profile information';
        }
        if (! $hasEducation) {
            $steps[] = 'Add your educational background';
        }
        if (! $hasExperience) {
            $steps[] = 'Add your work experience';
        }
        if (! $hasEmergencyContact) {
            $steps[] = 'Add emergency contact information';
        }

        if (empty($steps)) {
            $steps[] = 'Your profile is complete! Wait for further instructions.';
        }

        return $steps;
    }
}
