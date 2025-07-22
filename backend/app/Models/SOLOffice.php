<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SOLOffice extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'sol_offices';

    protected $fillable = [
        'office_name',
        'office_code',
        'zone',
        'state_name',
        'state_code',
        'control_type',
        'controlled_areas',
        'office_address',
        'office_phone',
        'office_email',
        'manager_name',
        'is_active',
        'created_by'
    ];

    protected $casts = [
        'controlled_areas' => 'array',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $attributes = [
        'is_active' => true,
        'controlled_areas' => '[]'
    ];

    /**
     * Get the user who created this office
     */
    // public function creator()
    // {
    //     return $this->belongsTo(User::class, 'created_by');
    // }

    /**
     * Get service locations assigned to this office
     */
    public function serviceLocations()
    {
        return $this->hasMany(ServiceLocation::class, 'sol_office_id');
    }

    /**
     * Get the controlled areas details based on control type
     */
    public function getControlledAreasDetailsAttribute()
    {
        if (!$this->controlled_areas || empty($this->controlled_areas)) {
            return collect();
        }

        if ($this->control_type === 'lga') {
            return StatesLga::whereIn('lga_code', $this->controlled_areas)
                ->select('lga_name as name', 'lga_code as code', 'state_name')
                ->get();
        } else {
            return StatesLga::whereIn('state_code', $this->controlled_areas)
                ->select('state_name as name', 'state_code as code')
                ->distinct()
                ->get();
        }
    }

    /**
     * Get count of controlled areas
     */
    public function getControlledAreasCountAttribute()
    {
        return count($this->controlled_areas ?? []);
    }

    /**
     * Get office display name with state
     */
    public function getDisplayNameAttribute()
    {
        return "{$this->office_name} ({$this->state_name})";
    }

    /**
     * Check if office controls a specific area
     */
    public function controlsArea($areaCode)
    {
        return in_array($areaCode, $this->controlled_areas ?? []);
    }

    /**
     * Scope to filter by state
     */
    public function scopeByState($query, $stateCode)
    {
        return $query->where('state_code', $stateCode);
    }

    /**
     * Scope to filter active offices
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by control type
     */
    public function scopeByControlType($query, $controlType)
    {
        return $query->where('control_type', $controlType);
    }

    /**
     * Scope to search offices
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('office_name', 'like', "%{$search}%")
                ->orWhere('office_code', 'like', "%{$search}%")
                ->orWhere('state_name', 'like', "%{$search}%")
                ->orWhere('manager_name', 'like', "%{$search}%");
        });
    }

    /**
     * Get offices that control a specific LGA
     */
    public static function getOfficeByLGA($lgaCode)
    {
        return static::where('control_type', 'lga')
            ->where('is_active', true)
            ->whereJsonContains('controlled_areas', $lgaCode)
            ->first();
    }

    /**
     * Get offices that control a specific state
     */
    public static function getOfficeByState($stateCode)
    {
        return static::where('control_type', 'state')
            ->where('is_active', true)
            ->whereJsonContains('controlled_areas', $stateCode)
            ->first();
    }

    /**
     * Auto-assign office based on location
     */
    public static function autoAssignOffice($stateCode, $lgaCode = null)
    {
        // First try LGA-level assignment if LGA is provided
        if ($lgaCode) {
            $office = static::getOfficeByLGA($lgaCode);
            if ($office) {
                return $office;
            }
        }

        // Fall back to state-level assignment
        return static::getOfficeByState($stateCode);
    }

    /**
     * Get summary statistics
     */
    public static function getSummaryStats()
    {
        return [
            'total' => static::count(),
            'active' => static::where('is_active', true)->count(),
            'inactive' => static::where('is_active', false)->count(),
            'lga_control' => static::where('control_type', 'lga')->count(),
            'state_control' => static::where('control_type', 'state')->count(),
            'states_covered' => static::distinct('state_code')->count(),
        ];
    }

    /**
     * Validation rules for creating/updating
     */
    public static function validationRules($id = null)
    {
        return [
            'office_name' => 'required|string|max:255',
            'office_code' => 'required|string|max:20|unique:sol_offices,office_code' . ($id ? ",{$id}" : ''),
            'state_name' => 'required|string|max:100',
            'state_code' => 'required|string|max:10',
            'zone' => 'required|in:north_central,north_east,north_west,south_east,south_south,south_west', // Updated validation
            'control_type' => 'required|in:lga,state',
            'controlled_areas' => 'nullable|array',
            'controlled_areas.*' => 'string|max:20',
            'office_address' => 'nullable|string',
            'office_phone' => 'nullable|string|max:20',
            'office_email' => 'nullable|email|max:255',
            'manager_name' => 'nullable|string|max:255',
            'is_active' => 'boolean'
        ];
    }
}
