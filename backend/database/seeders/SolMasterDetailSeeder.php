<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SolMasterDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\SolMasterDetail::create([
            'purpose' => 'invoice',
            'bank_name' => 'First Bank Nigeria Limited',
            'account_name' => 'SOL ICT LIMITED',
            'account_number' => '2345678901',
            'sort_code' => '011-152489',
            'vat_registration_number' => 'VAT123456789',
            'tin' => 'TIN987654321',
            'compensation_officer' => 'John Doe',
            'company_accountant' => 'Jane Smith',
            'address' => 'Plot 123, Victoria Island, Lagos, Nigeria',
            'phone' => '+234 901 234 5678',
            'email' => 'info@sol-ict.com',
            'is_active' => true,
        ]);

        \App\Models\SolMasterDetail::create([
            'purpose' => 'reimbursement',
            'bank_name' => 'Access Bank Plc',
            'account_name' => 'SOL ICT LIMITED - REIMBURSEMENT',
            'account_number' => '0987654321',
            'sort_code' => '044-150149',
            'vat_registration_number' => 'VAT123456789',
            'tin' => 'TIN987654321',
            'compensation_officer' => 'John Doe',
            'company_accountant' => 'Jane Smith',
            'address' => 'Plot 123, Victoria Island, Lagos, Nigeria',
            'phone' => '+234 901 234 5678',
            'email' => 'reimbursement@sol-ict.com',
            'is_active' => true,
        ]);
    }
}
