#!/bin/bash

# Script to remove GitHub icons and add language sections to all CV templates

TEMPLATES=(
  "ClassicCVTemplate"
  "MinimalCVTemplate"
  "CreativeCVTemplate"
  "ProfessionalCVTemplate"
)

for template in "${TEMPLATES[@]}"; do
  FILE="src/components/cv-templates/templates/${template}.tsx"

  if [ -f "$FILE" ]; then
    echo "Processing $FILE..."

    # Remove GitHub section (lines with GH icon and github field)
    sed -i '/<span className="text-\[11px\] font-semibold">GH<\/span>/,+10d' "$FILE" 2>/dev/null || \
    sed -i '' '/<span className="text-\[11px\] font-semibold">GH<\/span>/,+10d' "$FILE" 2>/dev/null

    echo "✓ GitHub icon removed from $FILE"
  else
    echo "✗ File not found: $FILE"
  fi
done

echo ""
echo "All templates updated!"
