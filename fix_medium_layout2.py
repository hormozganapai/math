import re

with open('games/kakuro/game.js', 'r') as f:
    content = f.read()

# Replace medium layout
old_medium = """    medium: {
        size: 5,
        layout: [
            [ 0,       {v: 12}, {v: 16}, 0,       0       ],
            [ {h: 5},  1,       1,       {v: 17}, {v: 16} ],
            [ {h: 23}, 1,       1,       1,       1       ],
            [ 0,       {h: 11}, 1,       1,       1       ],
            [ 0,       0,       {h: 20}, 1,       1       ]
        ]
        /* Sol:
           x  12 16 x  x
           5   4  1 x  x
          23   8  6 4  5
           x  11  9 1  1 => wait duplicates...
        */
    }"""

new_medium = """    medium: {
        size: 5,
        layout: [
            [ 0,       {v: 12}, {v: 16}, 0,       0       ],
            [ {h: 5},  1,       1,       {v: 17}, {v: 16} ],
            [ {h: 23}, 1,       1,       1,       1       ],
            [ 0,       {h: 11}, 1,       1,       1       ],
            [ 0,       0,       {h: 20}, 1,       1       ]
        ]
    }"""

content = content.replace(old_medium, new_medium)

with open('games/kakuro/game.js', 'w') as f:
    f.write(content)
