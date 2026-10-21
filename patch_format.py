import re

with open('src/Controller/Api/Deportivo/ActividadesController.php', 'r') as f:
    php = f.read()

target = "'club_id'         => $a->club_id,"
replacement = "'club_id'         => $a->club_id,\n            'profesor_id'     => $a->profesor_id,"

if target in php:
    php = php.replace(target, replacement)
    with open('src/Controller/Api/Deportivo/ActividadesController.php', 'w') as f:
        f.write(php)
    print("Patched _format")
else:
    print("Target not found")
