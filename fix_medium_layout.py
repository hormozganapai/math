import re

with open('games/kakuro/game.js', 'r') as f:
    content = f.read()

# Replace medium layout
old_medium = """    medium: { // 5x5
        size: 5,
        layout: [
            [ 0,       {v: 17}, {v: 24}, 0,       0       ],
            [ {h: 16}, 1,       1,       {v: 23}, {v: 10} ],
            [ {h: 23}, 1,       1,       1,       1       ],
            [ 0,       {h: 24}, 1,       1,       1       ],
            [ 0,       0,       {h: 16}, 1,       1       ]
        ]
    }"""

new_medium = """    medium: { // 6x6
        size: 6,
        layout: [
            [ 0,       {v: 10}, {v: 16}, 0,       0,       0       ],
            [ {h: 11}, 1,       1,       {v: 21}, {v: 17}, 0       ],
            [ {h: 24}, 1,       1,       1,       1,       {v: 11} ],
            [ 0,       {h: 21}, 1,       1,       1,       1       ],
            [ 0,       0,       {h: 10}, 1,       1,       1       ],
            [ 0,       0,       0,       {h: 11}, 1,       1       ]
        ]
    }"""

content = content.replace(old_medium, new_medium)

with open('games/kakuro/game.js', 'w') as f:
    f.write(content)
