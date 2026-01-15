<?php

namespace App\Models;

use App\Models\LeaveEngine\LpeStaffLevel as LeaveEngineLpeStaffLevel;

/**
 * Shim class for backward compatibility with artisan generators and code
 * expecting models under App\Models. Extends the real model in
 * App\Models\LeaveEngine.
 */
class LpeStaffLevel extends LeaveEngineLpeStaffLevel
{
    // Intentionally empty - inherits everything from LeaveEngine model
}
