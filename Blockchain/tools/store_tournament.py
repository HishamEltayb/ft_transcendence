class tournament:
    name:str
    players:list[tuple]
    matches:list[tuple]


class data:
    name:str
    players:list[str]
    matches:list[tuple]
    scores:list[tuple]

def analyze_tournament(data: data):

    l = []
    for player in data.players:
        score = 0
        for i in range(len(data.matches)):
            if player in data.matches[i]:
                player_pos = data.matches[i].index(player)
                score += data.scores[i][player_pos]
        l.append((score, player))
    l.sort(reverse=True)
    T = tournament()
    T.name = data.name
    T.players = l
    T.matches = data.matches
    print("Players: ", T.players)
    print("Scores: ", l)
    print("Matches: ", data.matches)

    