// 피처명 -> 사람이 읽는 문장 변환 (analyzer.py feature_to_phrase 포팅)

export function featureToPhrase(fname: string): string {
  if (fname.startsWith("요일=")) return fname.replace("요일=", "") + "요일에 직관가면";
  if (fname === "주말여부") return "주말에 직관가면";
  if (fname === "평일여부") return "평일에 직관가면";

  if (fname.startsWith("월일자체_숫자") && fname.endsWith("포함")) {
    const n = fname.replace("월일자체_숫자", "").replace("포함", "");
    return `월 또는 일에 ${n}이 들어가면`;
  }
  if (fname.startsWith("월일덧셈_숫자") && fname.endsWith("포함")) {
    const n = fname.replace("월일덧셈_숫자", "").replace("포함", "");
    return `월+일 덧셈 값에 ${n}이 들어가면`;
  }
  if (fname.startsWith("월일곱셈_숫자") && fname.endsWith("포함")) {
    const n = fname.replace("월일곱셈_숫자", "").replace("포함", "");
    return `월×일 곱셈 값에 ${n}이 들어가면`;
  }
  if (fname.startsWith("자릿수합_숫자") && fname.endsWith("포함")) {
    const n = fname.replace("자릿수합_숫자", "").replace("포함", "");
    return `자릿수 계속 더한 값에 ${n}이 들어가면`;
  }
  if (fname.startsWith("월일합=")) return `월+일 합이 ${fname.split("=")[1]}이면`;
  if (fname.startsWith("월일곱=")) return `월×일 값이 ${fname.split("=")[1]}이면`;
  if (fname.startsWith("자릿수합=")) return `날짜 자릿수를 계속 더한 값이 ${fname.split("=")[1]}이면`;
  if (fname === "팰린드롬_월일") return "월일이 대칭 구조면";
  if (fname === "손없는날_근사") return "손없는날이면";
  if (fname === "월_짝수") return "직관간 달이 짝수월이면";
  if (fname === "월_홀수") return "직관간 달이 홀수월이면";
  if (fname === "일_짝수") return "직관간 날짜가 짝수일이면";
  if (fname === "일_홀수") return "직관간 날짜가 홀수일이면";
  if (fname === "월일합_짝수") return "월+일 합이 짝수면";
  if (fname === "월일합_3의배수") return "월+일 합이 3의 배수면";
  if (fname.startsWith("월일차=")) return `월-일 차이가 ${fname.split("=")[1]}이면`;
  if (fname.startsWith("홈원정=")) return `${fname.split("=")[1]}경기면`;
  if (fname.startsWith("상대팀=")) return `상대가 ${fname.split("=")[1]}이면`;
  if (fname.startsWith("시리즈차수=")) return `시리즈 ${fname.split("=")[1]}차전이면`;
  if (fname === "직전연승중") return "직전에 연승중이었으면";
  if (fname === "직전연패중") return "직전에 연패중이었으면";
  return fname + "면";
}

/** 한글 음절의 종성(받침) 유무를 판정한다. 명사에 조사/서술격조사를 붙일 때 "이"를 넣을지 결정하는 데 쓴다. */
function hasFinalConsonant(text: string): boolean {
  const lastChar = text.trim().slice(-1);
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 명사(구)에 서술격조사 조건형("~이면"/"~면", 받침 유무에 맞춰)을 붙인다. "서"는 호출부(렌더링)에서 필요할 때 이어 붙인다. */
function attachConditional(noun: string): string {
  const i = hasFinalConsonant(noun) ? "이" : "";
  return noun + i + "면";
}

/**
 * 조건(피처 배열)을 문구 배열로 만든다. 홈원정/상대팀/시리즈차수는 하나의 압축된 덩어리로
 * 묶어 맨 앞에 오고("{홈|원정} {상대팀}전 시리즈N차전이면"), 나머지는 기존처럼 개별 문구다.
 * 모든 문구가 "~이면"/"~면"으로 끝나는 bare 형태라, 여러 개를 이어 붙일 땐 마지막 문구만 빼고
 * "서"를 붙이면(호출부에서 처리) "~하면서 ~하면서 ~하면" 형태의 자연스러운 문장이 된다.
 * 구장은 조건 탐색 자체에서 빠지므로(kboFeatures.ts) 여기서 다룰 필요가 없다 — 표시는 항상
 * 실제 KboGame.구장 값으로 이뤄진다.
 */
export function buildConditionPhrases(condition: readonly string[]): string[] {
  const used = new Set<string>();
  let homeAway: string | null = null;
  let opponent: string | null = null;
  let seriesNo: string | null = null;

  for (const f of condition) {
    if (f.startsWith("홈원정=")) {
      homeAway = f.split("=")[1];
      used.add(f);
    } else if (f.startsWith("상대팀=")) {
      opponent = f.split("=")[1];
      used.add(f);
    } else if (f.startsWith("시리즈차수=")) {
      seriesNo = f.split("=")[1];
      used.add(f);
    }
  }

  const parts: string[] = [];
  if (homeAway && opponent) parts.push(`${homeAway} ${opponent}전`);
  else if (homeAway) parts.push(`${homeAway}경기`);
  else if (opponent) parts.push(`${opponent}전`);
  if (seriesNo) parts.push(`시리즈${seriesNo}차전`);

  const rest = condition.filter((f) => !used.has(f)).map(featureToPhrase);
  if (parts.length === 0) return rest;

  return [attachConditional(parts.join(" ")), ...rest];
}

/** 조건(피처 배열)을 "A + B" 형태의 문장으로 합친다 (텍스트 전용 요약, 카드는 buildConditionPhrases 사용) */
export function conditionToText(condition: readonly string[]): string {
  return buildConditionPhrases(condition).join(" + ");
}
