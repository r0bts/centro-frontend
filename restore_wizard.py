import re

# 1. Read original HTML from git
with open('/tmp/original_wizard.html', 'r') as f:
    html = f.read()

# 2. In Step 2 (Operación), remove the Profesor and Costo blocks
# Because the user wanted them moved to Step 4.
# The Profesor block starts with <!-- Profesor Asignado --> and ends with </div>
profesor_pattern = r'<!-- Profesor Asignado -->.*?</div>\s*</div>\s*</div>'
# Wait, let's just use string replace to be safe. Let's see what is exactly in Step 2 of the original file.
