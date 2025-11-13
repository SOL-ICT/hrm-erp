<?php

echo "Checking client fee configuration fields...\n";

try {
    $client = \App\Models\Client::first();

    if (!$client) {
        echo "No clients found in database\n";
        exit(1);
    }

    echo "Client: {$client->organisation_name}\n";
    echo "ID: {$client->id}\n";

    // Check if these fields exist
    $fields = ['management_fee_percentage', 'vat_rate', 'wht_rate'];

    foreach ($fields as $field) {
        if (isset($client->$field)) {
            echo ucfirst(str_replace('_', ' ', $field)) . ": " . $client->$field . "\n";
        } else {
            echo ucfirst(str_replace('_', ' ', $field)) . ": FIELD DOES NOT EXIST\n";
        }
    }

    // Show all client attributes
    echo "\nAll client attributes:\n";
    $attributes = $client->getAttributes();
    foreach ($attributes as $key => $value) {
        echo "- {$key}: {$value}\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "This likely means the fee fields don't exist in the clients table\n";
}
