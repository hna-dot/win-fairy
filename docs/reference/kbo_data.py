"""
kbo-dashboard.co.kr/results/samsung-lions/ 에서 가져온 실제 데이터 (2026-06-12 ~ 2026-07-09)
컬럼: 날짜, 원정팀, 점수(원정-홈), 홈팀, 구장, 상태
"""

from datetime import date

# (날짜, 원정팀, 원정점수, 홈점수, 홈팀, 구장)
RAW_GAMES = [
    ("2026-07-09", "LG", 5, 6, "삼성", "대구"),
    ("2026-07-08", "LG", 8, 2, "삼성", "대구"),
    ("2026-07-07", "LG", 2, 9, "삼성", "대구"),
    ("2026-07-05", "삼성", 13, 3, "SSG", "인천"),
    ("2026-07-04", "삼성", 13, 7, "SSG", "인천"),
    ("2026-07-03", "삼성", 6, 4, "SSG", "인천"),
    ("2026-07-02", "삼성", 6, 1, "NC", "창원"),
    ("2026-07-01", "삼성", 5, 10, "NC", "창원"),
    ("2026-06-30", "삼성", 13, 7, "NC", "창원"),
    ("2026-06-28", "KT", 4, 7, "삼성", "대구"),
    ("2026-06-27", "KT", 3, 4, "삼성", "대구"),
    ("2026-06-26", "KT", 1, 9, "삼성", "대구"),
    ("2026-06-25", "삼성", 13, 6, "LG", "잠실"),
    ("2026-06-24", "삼성", 0, 2, "LG", "잠실"),
    ("2026-06-23", "삼성", 3, 4, "LG", "잠실"),
    ("2026-06-21", "삼성", 3, 1, "한화", "대전"),
    ("2026-06-20", "삼성", 4, 10, "한화", "대전"),
    ("2026-06-19", "삼성", 3, 3, "한화", "대전"),  # 무승부 -> 제외 예정
    ("2026-06-18", "키움", 3, 4, "삼성", "대구"),
    ("2026-06-17", "키움", 0, 1, "삼성", "대구"),
    ("2026-06-16", "키움", 1, 4, "삼성", "대구"),
    ("2026-06-14", "SSG", 8, 10, "삼성", "대구"),
    ("2026-06-13", "SSG", 6, 7, "삼성", "대구"),
    ("2026-06-12", "SSG", 5, 3, "삼성", "대구"),
]


def parse_kbo_games():
    """삼성 기준으로 정리: 날짜, 홈/원정, 상대팀, 구장, 승/패/무 결과"""
    games = []
    # 날짜 오름차순 정렬 (스트릭 계산 위해)
    sorted_raw = sorted(RAW_GAMES, key=lambda g: g[0])
    for d_str, away, away_score, home_score, home, stadium in sorted_raw:
        y, m, day = map(int, d_str.split("-"))
        d = date(y, m, day)
        if home == "삼성":
            is_home = True
            opponent = away
            my_score, opp_score = home_score, away_score
        else:
            is_home = False
            opponent = home
            my_score, opp_score = away_score, home_score

        if my_score > opp_score:
            result = "승"
        elif my_score < opp_score:
            result = "패"
        else:
            result = "무"

        games.append({
            "date": d,
            "홈원정": "홈" if is_home else "원정",
            "상대팀": opponent,
            "구장": stadium,
            "result": result,
        })
    return games


def compute_series_and_streak(games):
    """시리즈차수, 직전 연승/연패 스트릭 계산 (같은 상대팀 연속 등장 = 시리즈)"""
    prev_opponent = None
    series_no = 0
    streak = 0  # 양수=연승, 음수=연패, 0=시작
    for g in games:
        if g["상대팀"] != prev_opponent:
            series_no = 1
        else:
            series_no += 1
        g["시리즈차수"] = series_no
        prev_opponent = g["상대팀"]

        g["직전연승중"] = streak >= 2  # 직전까지 2연승 이상이었는지
        g["직전연패중"] = streak <= -2

        if g["result"] == "승":
            streak = streak + 1 if streak >= 0 else 1
        elif g["result"] == "패":
            streak = streak - 1 if streak <= 0 else -1
        else:
            streak = 0
    return games


if __name__ == "__main__":
    games = parse_kbo_games()
    games = compute_series_and_streak(games)
    for g in games:
        print(g["date"], g["홈원정"], g["상대팀"], g["구장"], g["시리즈차수"], "차전", g["result"],
              "(연승중)" if g["직전연승중"] else "", "(연패중)" if g["직전연패중"] else "")
