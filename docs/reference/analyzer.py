"""
승요 판독기 - 알고리즘 프로토타입 (A그룹 피처만 사용)
날짜 계산 + 캘린더 미신 피처로 '억지 승요 조건'을 찾는다.
"""

from datetime import date, timedelta
from itertools import combinations
from collections import defaultdict


# ----------------------------
# 1. 피처 생성 (A그룹: 날짜 계산 + 캘린더)
# ----------------------------

def digit_sum_reduce(n: int) -> int:
    """한 자리가 될 때까지 자릿수 합 반복 (수비학 스타일)"""
    n = abs(n)
    while n >= 10:
        n = sum(int(d) for d in str(n))
    return n


def get_digits(*numbers) -> set:
    """숫자들의 모든 자릿수를 집합으로"""
    digits = set()
    for n in numbers:
        for d in str(abs(n)):
            digits.add(int(d))
    return digits


WEEKDAY_KR = ["월", "화", "수", "목", "금", "토", "일"]


def extract_raw_values(d: date) -> dict:
    """날짜 하나에서 원시 값(카테고리/숫자/불린)들을 뽑는다. 아직 one-hot 아님."""
    y, m, day = d.year, d.month, d.day
    weekday_idx = d.weekday()  # 0=월요일

    month_plus_day = m + day
    month_times_day = m * day
    month_minus_day = abs(m - day)
    concat_md = int(f"{m}{day}")  # 8월6일 -> 86
    digit_sum = digit_sum_reduce(month_plus_day)

    all_digits = get_digits(m, day, month_plus_day, month_times_day, concat_md)
    is_palindrome_md = str(m) == str(day)[::-1] or str(day) == str(m)[::-1]

    return {
        "요일": WEEKDAY_KR[weekday_idx],
        "주말여부": weekday_idx >= 5,
        "평일여부": weekday_idx < 5,
        "일_짝수": day % 2 == 0,
        "일_홀수": day % 2 == 1,
        "월_짝수": m % 2 == 0,
        "월_홀수": m % 2 == 1,
        "월일합": month_plus_day,
        "월일합_짝수": month_plus_day % 2 == 0,
        "월일합_3의배수": month_plus_day % 3 == 0,
        "월일곱": month_times_day,
        "월일차": month_minus_day,
        "자릿수합": digit_sum,
        "팰린드롬_월일": is_palindrome_md,
        "손없는날_근사": day % 10 in (9, 0),
        "_month": m,
        "_day": day,
        "_concat_md": concat_md,
    }


def build_feature_matrix(raw_list: list) -> list:
    """
    raw_list: [extract_raw_values(d) for d in dates] 형태의 리스트.
    전체 데이터셋을 보고 카테고리형 값들을 일관된 one-hot 피처로 변환한다.
    숫자 포함 여부는 '어떤 계산에서 나왔는지'별로 분리한다 (월일덧셈/월일곱셈/자릿수합/월일자체).
    """
    categorical_keys = ["요일", "월일합", "월일곱", "월일차", "자릿수합"]
    boolean_keys = [
        "주말여부", "평일여부", "일_짝수", "일_홀수", "월_짝수", "월_홀수",
        "월일합_짝수", "월일합_3의배수", "팰린드롬_월일", "손없는날_근사",
    ]
    # 숫자 포함 체크를 소스별로 분리
    digit_source_keys = {
        "월일덧셈": "월일합",
        "월일곱셈": "월일곱",
        "자릿수합": "자릿수합",
        "월일이어붙임": "_concat_md",
    }

    # 카테고리형 값들의 전체 유니크 값 수집
    unique_values = {k: sorted(set(r[k] for r in raw_list), key=str) for k in categorical_keys}

    feature_matrix = []
    for raw in raw_list:
        feats = {}
        for k in boolean_keys:
            feats[k] = raw[k]
        for k in categorical_keys:
            for v in unique_values[k]:
                feats[f"{k}={v}"] = (raw[k] == v)
        # 월/일 자체에 숫자가 들어가는지
        for n in range(10):
            feats[f"월일자체_숫자{n}포함"] = (str(n) in str(raw["_month"]) or str(n) in str(raw["_day"]))
        # 소스별 계산 결과에 숫자가 들어가는지
        for label, source_key in digit_source_keys.items():
            value = raw[source_key]
            for n in range(10):
                feats[f"{label}_숫자{n}포함"] = (str(n) in str(value))
        feature_matrix.append(feats)
    return feature_matrix


# ----------------------------
# 1.5 피처 카테고리 태깅 + 우선순위 티어 (다양성/선택 점수용)
# ----------------------------

# 티어가 낮을수록(숫자 작을수록) "공감 가는" 카테고리, 높을수록 "억지스러운" 카테고리.
CATEGORY_TIER = {
    # 티어 1: KBO 경기조건
    "홈원정": 1,
    "구장": 1,
    "상대팀": 1,
    "시리즈차수": 1,
    "선발투수": 1,
    "연승연패": 1,
    "낮밤경기": 1,

    # 티어 2: 캘린더/미신
    "요일": 2,
    "주말여부": 2,
    "손없는날": 2,
    "월령": 2,  # 미구현, 자리만

    # 티어 3: 날짜 사칙연산 (단순 계산)
    "월홀짝": 3,
    "일홀짝": 3,
    "월일덧셈": 3,
    "월일곱셈": 3,
    "월일차": 3,
    "팰린드롬": 3,

    # 티어 4: 숫자놀이 (가장 추상적, 억지력 최고)
    "월일자체숫자": 4,
    "자릿수합": 4,
    "월일이어붙임": 4,

    "기타": 3,
}


def get_feature_category(fname: str) -> str:
    """피처가 어느 카테고리에 속하는지 반환. 다양성 점수 + 티어 우선순위 계산에 사용."""
    if fname.startswith("요일="):
        return "요일"
    if fname in ("주말여부", "평일여부"):
        return "주말여부"
    if fname in ("월_짝수", "월_홀수"):
        return "월홀짝"
    if fname in ("일_짝수", "일_홀수"):
        return "일홀짝"
    if fname.startswith("월일자체_숫자"):
        return "월일자체숫자"
    if fname.startswith("월일덧셈_숫자") or fname.startswith("월일합="):
        return "월일덧셈"
    if fname in ("월일합_짝수", "월일합_3의배수"):
        return "월일덧셈"
    if fname.startswith("월일곱셈_숫자") or fname.startswith("월일곱="):
        return "월일곱셈"
    if fname.startswith("자릿수합_숫자") or fname.startswith("자릿수합="):
        return "자릿수합"
    if fname.startswith("월일이어붙임_숫자"):
        return "월일이어붙임"
    if fname.startswith("월일차="):
        return "월일차"
    if fname == "팰린드롬_월일":
        return "팰린드롬"
    if fname == "손없는날_근사":
        return "손없는날"
    if fname.startswith("홈원정="):
        return "홈원정"
    if fname.startswith("상대팀="):
        return "상대팀"
    if fname.startswith("구장="):
        return "구장"
    if fname.startswith("시리즈차수="):
        return "시리즈차수"
    if fname in ("직전연승중", "직전연패중"):
        return "연승연패"
    return "기타"


def get_category_tier(category: str) -> int:
    return CATEGORY_TIER.get(category, 3)


def condition_priority_score(condition) -> tuple:
    """
    조건(피처 조합)의 우선순위 점수. 낮을수록 좋음(더 그럴듯함/공감 가능).
    (최소티어, 평균티어) 순으로 비교 -> 조합 안에 티어1(KBO)이 하나라도 있으면 우대,
    그 다음 전체적으로 낮은 티어(공감 가는 카테고리)로 구성됐는지를 본다.
    """
    tiers = [get_category_tier(get_feature_category(f)) for f in condition]
    return (min(tiers), sum(tiers) / len(tiers))


def diversity_score(condition) -> int:
    """조건(피처 조합)에 서로 다른 카테고리가 몇 개 섞였는지"""
    return len(set(get_feature_category(f) for f in condition))


# ----------------------------
# 2. 탐색 알고리즘
# ----------------------------

def find_forced_condition(records, max_depth=3, min_coverage_floor=1, _fallback_max_depth=4):
    """
    records: [{"date": date, "result": "승"/"패", "features": {featname: bool}}]

    탐색 순서: coverage(표본 큰 것)를 최우선으로 낮춰가며 시도.
    같은 target_coverage 안에서는 depth 1~max_depth를 전부 훑어서 후보를 다 모은 뒤,
    '티어(공감도) 우선 -> 다양성 -> 이름순' 으로 최종 후보를 고른다.

    성능 최적화: 기본은 max_depth=3까지만 탐색(빠름). 그래도 끝까지 하나도 못 찾으면
    (아주 드문 경우) max_depth=4로 한 번 더 시도한다 -> 무거운 depth4 탐색을 예외적인
    경우에만 실행해서 평균 속도를 확보.
    """
    result = _search(records, max_depth, min_coverage_floor)
    if result is not None:
        return result
    if max_depth < _fallback_max_depth:
        # depth3까지 다 뒤져도 안 나온 경우에만 depth4로 재시도
        return _search(records, _fallback_max_depth, min_coverage_floor)
    return None


def _search(records, max_depth, min_coverage_floor):
    wins = [r for r in records if r["result"] == "승"]
    losses = [r for r in records if r["result"] == "패"]

    if not wins:
        return None  # 승리 경기가 없으면 이 함수로는 못 찾음 (패배방지 모드로 별도 처리)

    if len(losses) == 0:
        return {"type": "완전승요", "coverage": len(wins), "condition": [], "depth": 0}

    all_feature_names = sorted(wins[0]["features"].keys())

    max_coverage = len(wins)
    for target_coverage in range(max_coverage, min_coverage_floor - 1, -1):
        candidates = []
        for depth in range(1, max_depth + 1):
            for combo in combinations(all_feature_names, depth):
                covered_wins = [
                    r for r in wins
                    if all(r["features"][f] for f in combo)
                ]
                if len(covered_wins) < target_coverage:
                    continue
                covered_losses = [
                    r for r in losses
                    if all(r["features"][f] for f in combo)
                ]
                if len(covered_losses) > 0:
                    continue
                candidates.append({
                    "condition": combo,
                    "coverage": len(covered_wins),
                    "depth": depth,
                    "covered_dates": [r["date"] for r in covered_wins],
                    "diversity": diversity_score(combo),
                })
        if candidates:
            # 우선순위: coverage 큰 것 > 티어 우선순위 낮은(=공감가는) 것 > 다양성 높은 것 > depth 얕은 것(가독성) > 이름순
            best = min(
                candidates,
                key=lambda c: (
                    -c["coverage"],
                    condition_priority_score(c["condition"]),
                    -c["diversity"],
                    c["depth"],
                    tuple(sorted(c["condition"])),
                )
            )
            best["type"] = "부분승요"
            return best
    return None


def find_loss_explanation(records, condition_features_used, max_depth=3):
    """패배 경기들의 공통점 중 승리 경기엔 없는 것 찾기 (억지 정당화용)"""
    wins = [r for r in records if r["result"] == "승"]
    losses = [r for r in records if r["result"] == "패"]
    if not losses:
        return None

    all_feature_names = sorted(losses[0]["features"].keys())
    for depth in range(1, max_depth + 1):
        for combo in combinations(all_feature_names, depth):
            covered_losses = [r for r in losses if all(r["features"][f] for f in combo)]
            if len(covered_losses) < len(losses):
                continue
            covered_wins = [r for r in wins if all(r["features"][f] for f in combo)]
            if len(covered_wins) > 0:
                continue
            return {"condition": combo, "coverage": len(covered_losses)}
    return None


# ----------------------------
# 3. 카피 생성 (간단 버전)
# ----------------------------

def feature_to_phrase(fname: str) -> str:
    """피처명을 사람이 읽는 문장으로 변환 (간단 매핑)"""
    if fname.startswith("요일="):
        return fname.replace("요일=", "") + "요일에 직관가면"
    if fname == "주말여부":
        return "주말에 직관가면"
    if fname == "평일여부":
        return "평일에 직관가면"
    if fname.startswith("월일자체_숫자") and fname.endswith("포함"):
        n = fname.replace("월일자체_숫자", "").replace("포함", "")
        return f"월 또는 일 자체에 {n}이 들어가면"
    if fname.startswith("월일덧셈_숫자") and fname.endswith("포함"):
        n = fname.replace("월일덧셈_숫자", "").replace("포함", "")
        return f"월+일 덧셈 값에 {n}이 들어가면"
    if fname.startswith("월일곱셈_숫자") and fname.endswith("포함"):
        n = fname.replace("월일곱셈_숫자", "").replace("포함", "")
        return f"월×일 곱셈 값에 {n}이 들어가면"
    if fname.startswith("자릿수합_숫자") and fname.endswith("포함"):
        n = fname.replace("자릿수합_숫자", "").replace("포함", "")
        return f"자릿수 계속 더한 값에 {n}이 들어가면"
    if fname.startswith("월일이어붙임_숫자") and fname.endswith("포함"):
        n = fname.replace("월일이어붙임_숫자", "").replace("포함", "")
        return f"월일을 이어붙인 숫자에 {n}이 들어가면"
    if fname.startswith("월일합="):
        v = fname.split("=")[1]
        return f"월+일 합이 {v}이면"
    if fname.startswith("월일곱="):
        v = fname.split("=")[1]
        return f"월×일 값이 {v}이면"
    if fname.startswith("자릿수합="):
        v = fname.split("=")[1]
        return f"날짜 자릿수를 계속 더한 값이 {v}이면"
    if fname == "팰린드롬_월일":
        return "월일이 팰린드롬(대칭) 구조면"
    if fname == "손없는날_근사":
        return "손없는날이면"
    if fname == "월_짝수":
        return "직관간 달이 짝수월이면"
    if fname == "월_홀수":
        return "직관간 달이 홀수월이면"
    if fname == "일_짝수":
        return "직관간 날짜(일)가 짝수면"
    if fname == "일_홀수":
        return "직관간 날짜(일)가 홀수면"
    if fname == "월일합_짝수":
        return "월+일 합이 짝수면"
    if fname == "월일합_3의배수":
        return "월+일 합이 3의 배수면"
    if fname.startswith("월일차="):
        v = fname.split("=")[1]
        return f"월-일 차이가 {v}이면"
    if fname.startswith("홈원정="):
        return f"{fname.split('=')[1]}경기면"
    if fname.startswith("상대팀="):
        return f"상대가 {fname.split('=')[1]}이면"
    if fname.startswith("구장="):
        return f"{fname.split('=')[1]}구장에서 직관하면"
    if fname.startswith("시리즈차수="):
        return f"시리즈 {fname.split('=')[1]}차전이면"
    if fname == "직전연승중":
        return "가기 전에 이미 연승중이었으면"
    if fname == "직전연패중":
        return "가기 전에 이미 연패중이었으면"
    return fname + "면"


def generate_result_text(records, kbo_games=None):
    result = find_forced_condition(records)
    if result is None:
        return "직관 기록에 승리가 없습니다. (패배방지 모드 필요)"

    if result["type"] == "완전승요":
        return f"🎉 완전승요! 직관간 {result['coverage']}경기 전부 승리! 당신 자체가 승요입니다."

    condition = result["condition"]
    coverage = result["coverage"]
    depth = result["depth"]
    covered_dates = result["covered_dates"]
    phrases = [feature_to_phrase(f) for f in condition]
    condition_text = " + ".join(phrases)

    loss_expl = find_loss_explanation(records, condition)
    loss_text = ""
    if loss_expl:
        loss_phrases = [feature_to_phrase(f) for f in loss_expl["condition"]]
        loss_text = f"\n(참고: 패배한 날은 전부 {' + '.join(loss_phrases).replace('면','였음')} → 역시 조건이 안 맞아서 진 것)"

    force_level = "★" * min(depth + (1 if coverage == 1 else 0), 5)

    kbo_by_date = {g["date"]: g for g in kbo_games} if kbo_games else {}

    # --- 근거 라인: 각 날짜별 실제 값 보여주기 ---
    evidence_lines = []
    for d in covered_dates:
        raw = extract_raw_values(d)
        line = f"  · {d.strftime('%m/%d')}: {format_date_summary(d, raw)}"
        g = kbo_by_date.get(d)
        if g:
            line += f", {g['홈원정']}·상대 {g['상대팀']}·{g['구장']}·{g['시리즈차수']}차전"
        evidence_lines.append(line)
    evidence_text = "\n".join(evidence_lines)

    return (
        f"🔮 당신의 승요 조건: {condition_text} 승요!\n"
        f"근거: 이 조건에서 {coverage}전 {coverage}승 (100%)\n"
        f"억지력: {force_level} (조건 개수: {depth}, 표본: {coverage}경기)\n"
        f"실제 계산:\n{evidence_text}"
        f"{loss_text}"
    )


def build_synthetic_upcoming_schedule(last_date, last_opponent, n_games=15):
    """
    데모용 가상 다음 일정 생성기.
    실제 서비스에서는 KBO 공식 일정표(확정 상대팀/구장/홈원정)를 받아와야 하며,
    여기서는 '3연전 로테이션이 이어진다'고 가정한 placeholder만 만든다.
    """
    from datetime import timedelta
    opponents_cycle = ["LG", "KT", "SSG", "NC", "한화", "키움", "롯데", "두산"]
    if last_opponent in opponents_cycle:
        start_idx = (opponents_cycle.index(last_opponent) + 1) % len(opponents_cycle)
    else:
        start_idx = 0
    stadiums = {
        "LG": "잠실", "KT": "수원", "SSG": "인천", "NC": "창원",
        "한화": "대전", "키움": "고척", "롯데": "사직", "두산": "잠실",
    }
    games = []
    d = last_date
    opp_i = start_idx
    game_in_series = 0
    is_home = True  # 다음 시리즈부터 홈/원정 번갈아 가정
    while len(games) < n_games:
        d = d + timedelta(days=1)
        if d.weekday() == 0:  # 월요일은 보통 경기 없음(휴식일 가정)
            continue
        opponent = opponents_cycle[opp_i % len(opponents_cycle)]
        stadium = "대구" if is_home else stadiums.get(opponent, "구장미상")
        games.append({
            "date": d,
            "홈원정": "홈" if is_home else "원정",
            "상대팀": opponent,
            "구장": stadium,
        })
        game_in_series += 1
        if game_in_series >= 3:
            game_in_series = 0
            opp_i += 1
            is_home = not is_home
    return games


def find_next_matching_game(condition, upcoming_games):
    """
    조건(피처 조합)을 만족하는 가장 가까운 미래 경기를 찾는다.
    upcoming_games: [{"date":..., "홈원정":..., "상대팀":..., "구장":...}, ...] (결과 없음, 예정 경기)
    """
    for g in upcoming_games:
        raw = extract_raw_values(g["date"])
        # A그룹 단일 날짜의 boolean 피처 계산 (전체 데이터셋 아니라 이 날짜 하나만 판단하면 되는 것들만 정확히 체크 가능)
        satisfied = True
        for f in condition:
            if not _feature_true_for_single_date(f, g):
                satisfied = False
                break
        if satisfied:
            return g
    return None


def compute_rarity(condition, season_start=date(2026, 4, 1), season_end=date(2026, 10, 31)):
    """
    희귀도 = 조건을 만족하는 시즌 내 경기일 수 / 시즌 전체 경기일 수

    - 분모는 '월요일(보통 경기 없음)을 제외한 시즌 기간 내 날짜 수'로 근사.
    - condition 안에 KBO 피처(티어1: 홈원정/상대팀/구장/시리즈차수/연승연패 등)가 하나라도 섞여있으면
      전체 시즌 일정 데이터 없이는 정확히 셀 수 없으므로 None을 반환 (호출부에서 '계산 불가 -> 표시 생략' 처리).
    """
    for f in condition:
        if get_category_tier(get_feature_category(f)) == 1:
            return None  # KBO 피처 포함 -> 지금 데이터로는 계산 불가

    total_game_days = 0
    matched_days = 0
    d = season_start
    while d <= season_end:
        if d.weekday() != 0:  # 월요일(0) 제외
            total_game_days += 1
            if all(_feature_true_for_single_date(f, {"date": d}) for f in condition):
                matched_days += 1
        d += timedelta(days=1)

    if total_game_days == 0:
        return None
    return {
        "matched": matched_days,
        "total": total_game_days,
        "ratio": matched_days / total_game_days,
    }


def rarity_to_stars(ratio: float) -> str:
    """희귀도(낮을수록 희귀) -> 별점 매핑. 낮은 비율일수록 별이 많음(=더 희귀하고 억지스러움)."""
    pct = ratio * 100
    if pct <= 2:
        return "★★★★★"
    if pct <= 5:
        return "★★★★☆"
    if pct <= 10:
        return "★★★☆☆"
    if pct <= 20:
        return "★★☆☆☆"
    return "★☆☆☆☆"


def _feature_true_for_single_date(fname, game):
    """단일 미래 경기(날짜+KBO정보)에 대해 피처 하나가 참인지 판정 (재계산 방식, one-hot 매트릭스 없이)"""
    d = game["date"]
    raw = extract_raw_values(d)
    m, day = d.month, d.day

    if fname.startswith("요일="):
        return WEEKDAY_KR[d.weekday()] == fname.split("=")[1]
    if fname == "주말여부":
        return d.weekday() >= 5
    if fname == "평일여부":
        return d.weekday() < 5
    if fname == "월_짝수":
        return m % 2 == 0
    if fname == "월_홀수":
        return m % 2 == 1
    if fname == "일_짝수":
        return day % 2 == 0
    if fname == "일_홀수":
        return day % 2 == 1
    if fname.startswith("월일합="):
        return raw["월일합"] == int(fname.split("=")[1])
    if fname == "월일합_짝수":
        return raw["월일합"] % 2 == 0
    if fname == "월일합_3의배수":
        return raw["월일합"] % 3 == 0
    if fname.startswith("월일곱="):
        return raw["월일곱"] == int(fname.split("=")[1])
    if fname.startswith("자릿수합="):
        return raw["자릿수합"] == int(fname.split("=")[1])
    if fname == "팰린드롬_월일":
        return raw["팰린드롬_월일"]
    if fname == "손없는날_근사":
        return raw["손없는날_근사"]
    if fname.startswith("월일자체_숫자"):
        n = fname.replace("월일자체_숫자", "").replace("포함", "")
        return n in str(m) or n in str(day)
    if fname.startswith("월일덧셈_숫자"):
        n = fname.replace("월일덧셈_숫자", "").replace("포함", "")
        return n in str(raw["월일합"])
    if fname.startswith("월일곱셈_숫자"):
        n = fname.replace("월일곱셈_숫자", "").replace("포함", "")
        return n in str(raw["월일곱"])
    if fname.startswith("자릿수합_숫자"):
        n = fname.replace("자릿수합_숫자", "").replace("포함", "")
        return n in str(raw["자릿수합"])
    if fname.startswith("월일이어붙임_숫자"):
        n = fname.replace("월일이어붙임_숫자", "").replace("포함", "")
        return n in str(raw["_concat_md"])
    # --- KBO 피처: game 딕셔너리에 정보 있을 때만 판단 가능 ---
    if fname.startswith("홈원정="):
        return game.get("홈원정") == fname.split("=")[1]
    if fname.startswith("상대팀="):
        return game.get("상대팀") == fname.split("=")[1]
    if fname.startswith("구장="):
        return game.get("구장") == fname.split("=")[1]
    if fname.startswith("시리즈차수="):
        return str(game.get("시리즈차수", "")) == fname.split("=")[1]
    if fname in ("직전연승중", "직전연패중"):
        return False  # 미래 경기 스트릭은 알 수 없음 -> 보수적으로 불만족 처리
    return False


# ----------------------------
# 4. 테스트 실행
# ----------------------------

def build_records(date_result_pairs, kbo_games=None):
    """
    date_result_pairs: [(날짜문자열, 결과), ...]
    kbo_games: 선택. kbo_data.compute_series_and_streak() 결과 리스트.
               제공되면 해당 날짜와 매칭해서 KBO 피처(홈원정/상대팀/구장/시리즈차수/스트릭)를 A그룹과 합친다.
    """
    dates = []
    results = []
    for d_str, result in date_result_pairs:
        y, m, day = map(int, d_str.split("-"))
        dates.append(date(y, m, day))
        results.append(result)

    raw_list = [extract_raw_values(d) for d in dates]
    feature_matrix = build_feature_matrix(raw_list)

    kbo_feature_matrix = None
    if kbo_games is not None:
        kbo_by_date = {g["date"]: g for g in kbo_games}
        kbo_raw_list = []
        for d in dates:
            g = kbo_by_date.get(d)
            if g is None:
                kbo_raw_list.append(None)
            else:
                kbo_raw_list.append(g)
        kbo_feature_matrix = build_kbo_feature_matrix(kbo_raw_list)

    records = []
    for i, (d, result, feats) in enumerate(zip(dates, results, feature_matrix)):
        merged = dict(feats)
        if kbo_feature_matrix is not None:
            merged.update(kbo_feature_matrix[i])
        records.append({"date": d, "result": result, "features": merged})
    return records


def build_kbo_feature_matrix(kbo_raw_list):
    """kbo_raw_list: [game_dict 또는 None, ...] -> boolean 피처 매트릭스 (one-hot, 데이터셋 전체 기준 통일)"""
    categorical_keys = ["홈원정", "상대팀", "구장", "시리즈차수"]
    boolean_keys = ["직전연승중", "직전연패중"]

    valid = [g for g in kbo_raw_list if g is not None]
    unique_values = {k: sorted(set(str(g[k]) for g in valid), key=str) for k in categorical_keys}

    feature_matrix = []
    for g in kbo_raw_list:
        feats = {}
        if g is None:
            # 매칭되는 KBO 데이터가 없는 날짜 -> 전부 False 처리
            for k in boolean_keys:
                feats[k] = False
            for k in categorical_keys:
                for v in unique_values[k]:
                    feats[f"{k}={v}"] = False
        else:
            for k in boolean_keys:
                feats[k] = g[k]
            for k in categorical_keys:
                for v in unique_values[k]:
                    feats[f"{k}={v}"] = (str(g[k]) == v)
        feature_matrix.append(feats)
    return feature_matrix


def run_case(title, sample):
    print(f"=== {title} ===")
    for d, r in sample:
        print(" ", d, r)
    records = build_records(sample)
    print(generate_result_text(records))
    print()


if __name__ == "__main__":
    # 케이스 1: 5경기, 3승2패 (기본 샘플)
    run_case("케이스1: 3승 2패", [
        ("2026-04-07", "승"),
        ("2026-04-14", "승"),
        ("2026-05-03", "패"),
        ("2026-06-09", "승"),
        ("2026-07-21", "패"),
    ])

    # 케이스 2: 전승
    run_case("케이스2: 전승 (4경기)", [
        ("2026-04-07", "승"),
        ("2026-05-14", "승"),
        ("2026-06-09", "승"),
        ("2026-07-21", "승"),
    ])

    # 케이스 3: 표본 많고 조건 찾기 어려운 경우 (10경기, 6승4패, 규칙성 거의 없게)
    run_case("케이스3: 10경기 6승 4패 (규칙성 낮게 임의구성)", [
        ("2026-03-05", "승"),
        ("2026-03-19", "패"),
        ("2026-04-02", "승"),
        ("2026-04-30", "패"),
        ("2026-05-11", "승"),
        ("2026-06-08", "패"),
        ("2026-06-23", "승"),
        ("2026-07-01", "패"),
        ("2026-07-15", "승"),
        ("2026-08-06", "승"),
    ])

    # 케이스 4: 1승 1패 (표본 극소)
    run_case("케이스4: 1승 1패", [
        ("2026-04-07", "승"),
        ("2026-05-03", "패"),
    ])

    # 케이스 5: 전패
    run_case("케이스5: 전패 (패배방지 모드 확인용)", [
        ("2026-04-07", "패"),
        ("2026-05-14", "패"),
        ("2026-06-09", "패"),
    ])
