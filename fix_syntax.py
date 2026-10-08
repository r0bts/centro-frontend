html_path = 'src/app/components/deportivo/actividades/actividad-wizard/actividad-wizard.html'
with open(html_path, 'r') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if line.strip() == "}":
        if lines[i-1].strip() == "</div>":
            continue
            
# Let's just find the exact block and replace it:
#                   </div>
#
#               }
#             </div>
#           }

# We need:
#                   </div>
#                 </div> <!-- close horario-panel -->
#               }

with open(html_path, 'r') as f:
    content = f.read()

bad_str = "                  </div>\n\n              }\n            </div>"
good_str = "                  </div>\n                </div>\n              }\n            </div>"

content = content.replace(bad_str, good_str)
with open(html_path, 'w') as f:
    f.write(content)
print("Syntax fixed")
