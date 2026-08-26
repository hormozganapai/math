import re

with open('games/kakuro/game.html', 'r') as f:
    content = f.read()

content = content.replace('<option value="medium">متوسط (۶×۶)</option>', '<option value="medium">متوسط (۶×۶)</option>')
content = content.replace('<option value="hard">سخت (۸×۸)</option>', '<option value="hard">سخت (۸×۸)</option>')

with open('games/kakuro/game.html', 'w') as f:
    f.write(content)
