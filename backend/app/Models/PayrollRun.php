<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Payroll Run Model
 * 
 * Represents a monthly payroll execution for a client
 * Workflow: draft → calculated → approved → exported → cancelled
 */
class PayrollRun extends Model
{
    protected $table = 'payroll_runs';

    protected $fillable = [
        'client_id',
        'month',
        'year',
        'attendance_upload_id',
        'status',
        'total_staff_count',
        'total_gross_pay',
        'total_deductions',
        'total_net_pay',
        'total_credit_to_bank',
        'calculation_date',
        'approved_at',
        'exported_at',
        'export_file_path',
        'notes',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'total_gross_pay' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net_pay' => 'decimal:2',
        'total_credit_to_bank' => 'decimal:2',
        'calculation_date' => 'datetime',
        'approved_at' => 'datetime',
        'exported_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function attendanceUpload(): BelongsTo
    {
        return $this->belongsTo(AttendanceUpload::class);
    }

    public function payrollItems(): HasMany
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scopes
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    public function scopeForPeriod($query, $month, $year)
    {
        return $query->where('month', $month)->where('year', $year);
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Check if payroll can be edited
     */
    public function canEdit(): bool
    {
        return in_array($this->status, ['draft', 'calculated']);
    }

    /**
     * Check if payroll can be calculated
     */
    public function canCalculate(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if payroll can be approved
     */
    public function canApprove(): bool
    {
        return $this->status === 'calculated';
    }

    /**
     * Check if payroll can be exported
     */
    public function canExport(): bool
    {
        return in_array($this->status, ['approved', 'exported']);
    }

    /**
     * Transition to calculated status
     */
    public function markAsCalculated(): void
    {
        $this->update([
            'status' => 'calculated',
            'calculation_date' => now(),
        ]);
    }

    /**
     * Transition to approved status
     */
    public function markAsApproved($userId): void
    {
        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => $userId,
        ]);
    }

    /**
     * Transition to exported status
     */
    public function markAsExported($filePath): void
    {
        $this->update([
            'status' => 'exported',
            'exported_at' => now(),
            'export_file_path' => $filePath,
        ]);
    }

    /**
     * Cancel payroll run
     */
    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
    }

    /**
     * Recalculate aggregate totals from payroll items
     */
    public function recalculateTotals(): void
    {
        $totals = $this->payrollItems()
            ->selectRaw('
                COUNT(*) as staff_count,
                SUM(monthly_gross) as gross_pay,
                SUM(total_deductions) as deductions,
                SUM(net_pay) as net_pay,
                SUM(credit_to_bank) as credit_to_bank
            ')
            ->first();

        $this->update([
            'total_staff_count' => $totals->staff_count ?? 0,
            'total_gross_pay' => $totals->gross_pay ?? 0,
            'total_deductions' => $totals->deductions ?? 0,
            'total_net_pay' => $totals->net_pay ?? 0,
            'total_credit_to_bank' => $totals->credit_to_bank ?? 0,
        ]);
    }
}
