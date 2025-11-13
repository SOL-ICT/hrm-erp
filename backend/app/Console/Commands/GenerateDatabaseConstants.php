<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class GenerateDatabaseConstants extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'generate:db-constants 
                            {--output=app/Constants/DatabaseFields.php : Output file path}
                            {--backup : Create backup of existing file}
                            {--force : Overwrite existing file without confirmation}
                            {--env=development : Environment (development|staging|production)}';

    /**
     * The console command description.
     */
    protected $description = 'Generate database field constants from existing database schema';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $environment = $this->option('env');

        // Production safety checks
        if ($environment === 'production') {
            $this->warn('⚠️  Running in PRODUCTION environment!');

            if (!$this->option('force') && !$this->confirm('Are you sure you want to regenerate database constants in production?')) {
                $this->info('Operation cancelled.');
                return 1;
            }
        }

        $this->info('Scanning database schema...');

        $outputPath = $this->option('output');
        $fullPath = base_path($outputPath);

        // Create backup if requested or in production
        if ($this->option('backup') || $environment === 'production') {
            $this->createBackup($fullPath);
        }

        $tables = $this->getAllTables();
        $constants = $this->generateConstants($tables);

        $this->writeConstantsFile($fullPath, $constants, $environment);

        $this->info("✅ Database constants generated successfully!");
        $this->info("📁 File: {$fullPath}");
        $this->info("📊 Tables processed: " . count($tables));

        if ($environment === 'production') {
            $this->warn("🔄 Remember to clear application cache: php artisan config:clear");
        }

        return 0;
    }

    /**
     * Get all tables from the database
     */
    private function getAllTables(): array
    {
        $tables = [];
        $tableNames = DB::select('SHOW TABLES');
        $dbName = DB::getDatabaseName();
        $tableKey = "Tables_in_{$dbName}";

        foreach ($tableNames as $table) {
            $tableName = $table->$tableKey;

            // Skip system tables and views
            if ($this->shouldSkipTable($tableName)) {
                continue;
            }

            $columns = $this->getTableColumns($tableName);
            $enums = $this->getEnumValues($tableName);

            $tables[$tableName] = [
                'columns' => $columns,
                'enums' => $enums
            ];
        }

        return $tables;
    }

    /**
     * Get columns for a specific table
     */
    private function getTableColumns(string $tableName): array
    {
        $columns = DB::select("DESCRIBE {$tableName}");
        $columnData = [];

        foreach ($columns as $column) {
            $columnData[] = [
                'name' => $column->Field,
                'type' => $column->Type,
                'null' => $column->Null === 'YES',
                'key' => $column->Key,
                'default' => $column->Default,
                'extra' => $column->Extra
            ];
        }

        return $columnData;
    }

    /**
     * Get enum values for columns in a table
     */
    private function getEnumValues(string $tableName): array
    {
        $enums = [];
        $columns = DB::select("SHOW COLUMNS FROM {$tableName}");

        foreach ($columns as $column) {
            if (strpos($column->Type, 'enum') === 0) {
                preg_match('/enum\((.*)\)/', $column->Type, $matches);
                if (isset($matches[1])) {
                    $values = str_getcsv($matches[1], ',', "'");
                    $enums[$column->Field] = $values;
                }
            }
        }

        return $enums;
    }

    /**
     * Check if table should be skipped
     */
    private function shouldSkipTable(string $tableName): bool
    {
        $skipTables = [
            'migrations',
            'password_reset_tokens',
            'personal_access_tokens',
            'cache',
            'cache_locks',
            'sessions'
        ];

        $skipPrefixes = ['view_'];

        // Skip system tables
        if (in_array($tableName, $skipTables)) {
            return true;
        }

        // Skip views
        foreach ($skipPrefixes as $prefix) {
            if (strpos($tableName, $prefix) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Generate constants array from tables data
     */
    private function generateConstants(array $tables): array
    {
        $constants = [
            'tables' => [],
            'enums' => [],
            'relationships' => [],
            'metadata' => []
        ];

        foreach ($tables as $tableName => $tableData) {
            $constantName = strtoupper($tableName);
            $constants['tables'][$constantName] = [];

            // Add column constants
            foreach ($tableData['columns'] as $column) {
                $columnConstant = strtoupper($column['name']);
                $constants['tables'][$constantName][$columnConstant] = $column['name'];

                // Track foreign keys for relationships
                if ($column['key'] === 'MUL' && str_ends_with($column['name'], '_id')) {
                    $constants['relationships'][] = [
                        'table' => $tableName,
                        'column' => $column['name'],
                        'foreign_table' => $this->guessForeignTable($column['name'])
                    ];
                }
            }

            // Add enum constants
            foreach ($tableData['enums'] as $columnName => $enumValues) {
                $enumConstant = strtoupper($tableName . '_' . $columnName);
                $constants['enums'][$enumConstant] = $enumValues;
            }

            // Add table metadata
            $constants['metadata'][$constantName] = [
                'table_name' => $tableName,
                'column_count' => count($tableData['columns']),
                'has_timestamps' => $this->hasTimestamps($tableData['columns']),
                'has_soft_deletes' => $this->hasSoftDeletes($tableData['columns']),
                'primary_key' => $this->getPrimaryKey($tableData['columns'])
            ];
        }

        return $constants;
    }

    /**
     * Guess foreign table name from foreign key column
     */
    private function guessForeignTable(string $foreignKey): string
    {
        // Remove _id suffix and try to guess table name
        $baseName = str_replace('_id', '', $foreignKey);

        // Handle common patterns
        $patterns = [
            'client' => 'clients',
            'user' => 'users',
            'staff' => 'staff',
            'candidate' => 'candidates'
        ];

        return $patterns[$baseName] ?? Str::plural($baseName);
    }

    /**
     * Check if table has timestamp columns
     */
    private function hasTimestamps(array $columns): bool
    {
        $timestampColumns = ['created_at', 'updated_at'];
        $columnNames = array_column($columns, 'name');

        return count(array_intersect($timestampColumns, $columnNames)) === 2;
    }

    /**
     * Check if table has soft delete column
     */
    private function hasSoftDeletes(array $columns): bool
    {
        $columnNames = array_column($columns, 'name');
        return in_array('deleted_at', $columnNames);
    }

    /**
     * Get primary key column
     */
    private function getPrimaryKey(array $columns): ?string
    {
        foreach ($columns as $column) {
            if ($column['key'] === 'PRI') {
                return $column['name'];
            }
        }
        return null;
    }

    /**
     * Write constants to PHP file
     */
    private function writeConstantsFile(string $filePath, array $constants, string $environment = 'development'): void
    {
        $content = $this->generateFileContent($constants, $environment);

        // Ensure directory exists
        $directory = dirname($filePath);
        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        file_put_contents($filePath, $content);
    }

    /**
     * Create backup of existing file
     */
    private function createBackup(string $filePath): void
    {
        if (file_exists($filePath)) {
            $timestamp = date('Y-m-d_H-i-s');
            $backupPath = $filePath . '.backup.' . $timestamp;
            copy($filePath, $backupPath);
            $this->info("📋 Backup created: {$backupPath}");
        }
    }

    /**
     * Generate the PHP file content
     */
    private function generateFileContent(array $constants, string $environment = 'development'): string
    {
        $date = now()->format('Y-m-d H:i:s');
        $user = get_current_user() ?: 'system';

        $content = "<?php\n\n";
        $content .= "namespace App\\Constants;\n\n";
        $content .= "/**\n";
        $content .= " * Auto-generated database field constants\n";
        $content .= " * Generated on: {$date}\n";
        $content .= " * Generated by: {$user}\n";
        $content .= " * Environment: {$environment}\n";
        $content .= " * Tables: " . count($constants['tables']) . "\n";
        $content .= " * \n";
        $content .= " * DO NOT EDIT THIS FILE MANUALLY!\n";
        $content .= " * Run 'php artisan generate:db-constants' to regenerate\n";
        if ($environment === 'production') {
            $content .= " * \n";
            $content .= " * PRODUCTION DEPLOYMENT:\n";
            $content .= " * - Ensure database is stable before regenerating\n";
            $content .= " * - Test thoroughly in staging first\n";
            $content .= " * - Clear application cache after deployment\n";
        }
        $content .= " */\n";
        $content .= "class DatabaseFields\n{\n";

        // Generate table constants
        $content .= "    // ============================================\n";
        $content .= "    // TABLE FIELD CONSTANTS\n";
        $content .= "    // ============================================\n\n";

        foreach ($constants['tables'] as $tableName => $columns) {
            $content .= "    /**\n";
            $content .= "     * {$tableName} table fields\n";
            $content .= "     */\n";
            $content .= "    const {$tableName} = [\n";

            foreach ($columns as $constantName => $columnName) {
                $content .= "        '{$constantName}' => '{$columnName}',\n";
            }

            $content .= "    ];\n\n";
        }

        // Generate enum constants
        if (!empty($constants['enums'])) {
            $content .= "    // ============================================\n";
            $content .= "    // ENUM VALUE CONSTANTS\n";
            $content .= "    // ============================================\n\n";

            foreach ($constants['enums'] as $enumName => $enumValues) {
                $content .= "    /**\n";
                $content .= "     * {$enumName} enum values\n";
                $content .= "     */\n";
                $content .= "    const {$enumName} = [\n";

                foreach ($enumValues as $value) {
                    $constantKey = strtoupper(str_replace(['-', ' '], '_', $value));
                    $content .= "        '{$constantKey}' => '{$value}',\n";
                }

                $content .= "    ];\n\n";
            }
        }

        // Generate table metadata
        $content .= "    // ============================================\n";
        $content .= "    // TABLE METADATA\n";
        $content .= "    // ============================================\n\n";

        $content .= "    /**\n";
        $content .= "     * Table metadata information\n";
        $content .= "     */\n";
        $content .= "    const TABLE_METADATA = [\n";

        foreach ($constants['metadata'] as $tableName => $metadata) {
            $content .= "        '{$tableName}' => [\n";
            $content .= "            'table_name' => '{$metadata['table_name']}',\n";
            $content .= "            'column_count' => {$metadata['column_count']},\n";
            $content .= "            'has_timestamps' => " . ($metadata['has_timestamps'] ? 'true' : 'false') . ",\n";
            $content .= "            'has_soft_deletes' => " . ($metadata['has_soft_deletes'] ? 'true' : 'false') . ",\n";
            $content .= "            'primary_key' => " . ($metadata['primary_key'] ? "'{$metadata['primary_key']}'" : 'null') . ",\n";
            $content .= "        ],\n";
        }

        $content .= "    ];\n\n";

        // Helper methods
        $content .= "    // ============================================\n";
        $content .= "    // HELPER METHODS\n";
        $content .= "    // ============================================\n\n";

        $content .= "    /**\n";
        $content .= "     * Get all field names for a table\n";
        $content .= "     */\n";
        $content .= "    public static function getTableFields(string \$tableName): array\n";
        $content .= "    {\n";
        $content .= "        \$constantName = strtoupper(\$tableName);\n";
        $content .= "        return constant('self::' . \$constantName) ?? [];\n";
        $content .= "    }\n\n";

        $content .= "    /**\n";
        $content .= "     * Get field name by constant key\n";
        $content .= "     */\n";
        $content .= "    public static function getField(string \$tableName, string \$fieldKey): ?string\n";
        $content .= "    {\n";
        $content .= "        \$fields = self::getTableFields(\$tableName);\n";
        $content .= "        return \$fields[\$fieldKey] ?? null;\n";
        $content .= "    }\n\n";

        $content .= "}\n";

        return $content;
    }
}
