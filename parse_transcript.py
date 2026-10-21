import json

transcript_file = '/Users/alejandro/.gemini/antigravity/brain/e4604e59-76d8-407e-9db9-23433aac07f7/.system_generated/logs/transcript_full.jsonl'

with open(transcript_file, 'r') as f:
    for line in f:
        try:
            data = json.loads(line)
            if 'tool_calls' in data:
                for tc in data['tool_calls']:
                    args = tc.get('args', {})
                    # If it's modifying actividad-wizard.html
                    if 'actividad-wizard.html' in str(args):
                        if tc['name'] == 'run_command':
                            cmd = args.get('CommandLine', '')
                            if 'sed' in cmd or 'cat' in cmd or 'python' in cmd:
                                print(f"[{data.get('created_at')}] run_command: {cmd[:100]}...")
                        elif tc['name'] == 'replace_file_content':
                            print(f"[{data.get('created_at')}] replace_file_content: {args.get('TargetContent', '')[:50]}...")
                        elif tc['name'] == 'write_to_file':
                            print(f"[{data.get('created_at')}] write_to_file: {args.get('TargetFile', '')}")
        except:
            pass
