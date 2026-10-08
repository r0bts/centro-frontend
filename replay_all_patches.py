import json
import os
import subprocess

transcript_file = '/Users/alejandro/.gemini/antigravity/brain/e4604e59-76d8-407e-9db9-23433aac07f7/.system_generated/logs/transcript_full.jsonl'

commands = []
with open(transcript_file, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    args = tc.get('args', {})
                    if tc['name'] == 'run_command':
                        cmd = args.get('CommandLine', '')
                        # Only take commands that modified files (sed -i, or python scripts)
                        if ('sed -i' in cmd or 'cat << \'EOF\' > patch_' in cmd or 'cat << \'EOF\' > rewrite_' in cmd) and not 'patch_actividades_map.py' in cmd:
                            date = data.get('created_at')
                            # We only want commands from yesterday (up to end of day)
                            if date < '2026-10-07T00:00:00Z':
                                commands.append(cmd)
        except:
            pass

# Let's ensure the files are pristine from git first
os.system("git checkout src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.ts src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.scss src/app/models/deportivo/actividad.model.ts src/app/components/deportivo/actividades/deportivo-actividades.html src/app/components/deportivo/actividades/deportivo-actividades.ts src/Controller/Api/Deportivo/ActividadesController.php src/Controller/Api/Deportivo/EquiposController.php")

for i, cmd in enumerate(commands):
    print(f"Executing patch {i}...")
    try:
        subprocess.run(cmd, shell=True, check=True)
    except Exception as e:
        print(f"Error on patch {i}: {e}")

print("Done replaying yesterday's changes.")
