<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'preferences', // Add this
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'preferences' => 'array', // Cast JSON to array automatically
        ];
    }

    /**
     * Get user preferences with defaults
     */
    public function getPreferencesAttribute($value)
    {
        $defaults = [
            'theme' => 'light',
            'language' => 'en',
            'primary_color' => '#6366f1',
        ];

        if (!$value) {
            return $defaults;
        }

        $preferences = is_string($value) ? json_decode($value, true) : $value;

        return array_merge($defaults, $preferences ?: []);
    }
}
