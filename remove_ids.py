import re

with open('backend/database/seeders/MissingStatesLgasSeeder.php', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all 'id' => number, patterns
content = re.sub(r"'id' => \d+, ", '', content)

with open('backend/database/seeders/MissingStatesLgasSeeder.php', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Removed all ID fields from seeder")
