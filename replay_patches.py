import json
import os

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
                        if 'cat << \'EOF\' >' in cmd and 'patch_' in cmd:
                            date = data.get('created_at')
                            if date < '2026-10-07T00:00:00Z':
                                commands.append(cmd)
        except:
            pass

for i, cmd in enumerate(commands):
    print(f"--- Patch {i} ---")
    print(cmd[:150] + "...")
