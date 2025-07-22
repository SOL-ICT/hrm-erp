<?php
// ===== app/Models/Staff.php =====
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    protected $table = 'staff';

    protected $fillable = [
        'employee_code',
        'staff_id',
        'first_name',
        'last_name',
        'email',
        'client_id',
        'status',
        'department',
        'designation'
    ];

    // Note to self - This can be expanded later
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function roles()
    {
        return $this->belongsToMany(Role::class, 'staff_roles');
    }
}
