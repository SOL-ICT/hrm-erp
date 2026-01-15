<?php

namespace App\Models;

use App\Models\LeaveEngine\LpeLeaveEntitlement as LeaveEngineLpeLeaveEntitlement;

/**
 * Shim class for backward compatibility with artisan generators and code
 * expecting models under App\Models. Extends the real model in
 * App\Models\LeaveEngine.
 */
class LpeLeaveEntitlement extends LeaveEngineLpeLeaveEntitlement
{
    // Intentionally empty - inherits everything from LeaveEngine model
}
