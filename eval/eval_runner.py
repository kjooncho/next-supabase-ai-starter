#!/usr/bin/env python3
"""
Cultural Correction Detection — Eval Runner
============================================

My Niche 앱의 문화 교정 자동 감지 프롬프트를 골든 데이터셋으로 평가하는 스크립트.

Usage:
    # 실제 Claude API 호출 (ANTHROPIC_API_KEY 필요)
    python eval_runner.py --dataset golden_dataset.yaml --prompt cultural_correction_prompt.yaml

    # API 호출 없이 스크립트 검증만 (dry run)
    python eval_runner.py --dataset golden_dataset.yaml --prompt cultural_correction_prompt.yaml --dry-run

    # 처음 N개만 테스트
    python eval_runner.py --dataset golden_dataset.yaml --prompt cultural_correction_prompt.yaml --limit 10

    # 결과를 JSON으로 저장
    python eval_runner.py --dataset golden_dataset.yaml --prompt cultural_correction_prompt.yaml --output results.json

Requirements:
    pip install anthropic pyyaml

Pass Criteria (자동 판정):
    - Binary accuracy ≥ 85%
    - Type accuracy (positive only) ≥ 75%
    - False positive rate ≤ 15%
    - False negative rate ≤ 25%   [v1.1 추가]
"""

import argparse
import json
import os
import sys
import time
from collections import Counter, defaultdict
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Optional

import yaml

# Anthropic SDK는 dry-run에서는 불필요하므로 lazy import
# from anthropic import Anthropic

MODEL = "claude-haiku-4-5-20251001"
MAX_TOKENS = 1024
TEMPERATURE = 0.0  # 재현성 보장

# 한국어 유형명 → 스키마 enum 매핑
TYPE_KR_TO_EN = {
    "수치": "number_unit",
    "가족호칭": "family_title",
    "경어": "keigo",
    "나이": "age",
    "겸양": "humility",
    "감정표현": "emotion",
    "문화어휘": "cultural_term",
    "none": "none",
}

# 역매핑 (리포트 출력용)
TYPE_EN_TO_KR = {v: k for k, v in TYPE_KR_TO_EN.items()}


@dataclass
class EvalResult:
    """단일 케이스 평가 결과."""

    case_id: str
    input_kr: str
    expected_needs: bool
    expected_type: str  # 한국어
    predicted_needs: Optional[bool] = None
    predicted_types: list = field(default_factory=list)  # 한국어 list
    predicted_severity: Optional[str] = None
    binary_correct: Optional[bool] = None
    type_correct: Optional[bool] = None  # positive case 한정
    error: Optional[str] = None  # API 실패 시
    raw_response: Optional[dict] = None
    latency_ms: Optional[int] = None


def load_dataset(path: Path) -> list:
    """골든 데이터셋 YAML 로드."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_prompt(path: Path) -> dict:
    """프롬프트 YAML 로드."""
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def parse_tool_response(response) -> dict:
    """Claude API 응답에서 tool_use 블록을 추출하여 dict로 반환."""
    for block in response.content:
        if hasattr(block, "type") and block.type == "tool_use":
            return block.input
    # tool_use 블록이 없으면 빈 결과 반환 (파싱 실패로 처리)
    return {"needs_correction": None, "correction_items": []}


def evaluate_case(case: dict, predicted: dict) -> tuple[bool, Optional[bool]]:
    """
    예측 결과를 정답과 비교.

    Returns:
        binary_correct: needs_correction 일치 여부
        type_correct: positive 케이스 한정, correction_type 일치 여부 (negative면 None)
    """
    expected_needs = case["needs_correction"]
    predicted_needs = predicted.get("needs_correction")

    if predicted_needs is None:
        return False, None

    binary_correct = expected_needs == predicted_needs

    type_correct = None
    if expected_needs and binary_correct:
        # positive 케이스 + binary 맞음 → 유형도 검증
        expected_type_en = TYPE_KR_TO_EN.get(case["correction_type"], "unknown")
        predicted_types_en = [
            item.get("type") for item in predicted.get("correction_items", [])
        ]
        # 예측된 유형 중 하나라도 정답과 일치하면 OK (multi-issue 허용)
        type_correct = expected_type_en in predicted_types_en

    return binary_correct, type_correct


def call_claude(client, system: str, tool_def: dict, user_input: str) -> tuple[dict, int]:
    """Claude API 호출. 응답과 latency(ms) 반환."""
    start = time.time()
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        temperature=TEMPERATURE,
        system=system,
        tools=[tool_def],
        tool_choice={"type": "tool", "name": tool_def["name"]},
        messages=[{"role": "user", "content": f"한국어 입력: {user_input}"}],
    )
    latency_ms = int((time.time() - start) * 1000)
    return parse_tool_response(response), latency_ms


def run_eval(
    dataset: list,
    prompt_data: dict,
    api_key: Optional[str] = None,
    dry_run: bool = False,
    limit: Optional[int] = None,
    verbose: bool = False,
) -> list[EvalResult]:
    """전체 데이터셋에 대해 Eval 실행."""

    if limit:
        dataset = dataset[:limit]

    system = prompt_data["system_prompt"]
    tool_def = prompt_data["tool_definition"]

    client = None
    if not dry_run:
        try:
            from anthropic import Anthropic
            client = Anthropic(api_key=api_key) if api_key else Anthropic()
        except ImportError:
            print("ERROR: anthropic 패키지가 설치되지 않았습니다.")
            print("       pip install anthropic")
            sys.exit(1)

    results = []
    total = len(dataset)

    for i, case in enumerate(dataset, 1):
        result = EvalResult(
            case_id=case["id"],
            input_kr=case["input_kr"],
            expected_needs=case["needs_correction"],
            expected_type=case["correction_type"],
        )

        if dry_run:
            # API 호출 없이 데이터셋 무결성만 검증
            result.predicted_needs = case["needs_correction"]  # 정답 그대로 (100% 시뮬)
            result.binary_correct = True
            if case["needs_correction"]:
                result.predicted_types = [case["correction_type"]]
                result.type_correct = True
        else:
            try:
                predicted, latency_ms = call_claude(client, system, tool_def, case["input_kr"])
                result.predicted_needs = predicted.get("needs_correction")
                result.predicted_types = [
                    TYPE_EN_TO_KR.get(item.get("type"), item.get("type"))
                    for item in predicted.get("correction_items", [])
                ]
                # severity는 첫 항목 기준
                items = predicted.get("correction_items", [])
                result.predicted_severity = items[0].get("severity") if items else None
                result.raw_response = predicted
                result.latency_ms = latency_ms

                bc, tc = evaluate_case(case, predicted)
                result.binary_correct = bc
                result.type_correct = tc

            except Exception as e:
                result.error = f"{type(e).__name__}: {e}"

        results.append(result)

        # 진행 상황 출력
        if verbose:
            status = "?"
            if result.error:
                status = "✗ ERROR"
            elif result.binary_correct:
                status = "✓"
            else:
                status = "✗"
            print(f"  [{i:3d}/{total}] {result.case_id} {status} "
                  f"(expected={result.expected_needs}, predicted={result.predicted_needs})")
        else:
            # 진행률만 간단히
            if i % 10 == 0 or i == total:
                print(f"  진행: {i}/{total}")

    return results


def generate_report(results: list[EvalResult], criteria: str = "v1") -> dict:
    """평가 결과 통계 및 리포트 생성."""

    total = len(results)
    completed = [r for r in results if r.error is None]
    errors = [r for r in results if r.error is not None]

    # 1. Binary accuracy (전체)
    binary_correct = sum(1 for r in completed if r.binary_correct)
    binary_acc = binary_correct / len(completed) if completed else 0.0

    # 2. False positive (negative case를 positive로 오판정)
    negatives = [r for r in completed if not r.expected_needs]
    false_positives = [r for r in negatives if r.predicted_needs is True]
    fp_rate = len(false_positives) / len(negatives) if negatives else 0.0

    # 3. False negative (positive case를 negative로 오판정)
    positives = [r for r in completed if r.expected_needs]
    false_negatives = [r for r in positives if r.predicted_needs is False]
    fn_rate = len(false_negatives) / len(positives) if positives else 0.0

    # 4. Type accuracy (positive 한정, binary 맞은 것 중 type도 맞은 비율)
    positive_correct_binary = [r for r in positives if r.binary_correct]
    type_correct = sum(1 for r in positive_correct_binary if r.type_correct)
    type_acc = type_correct / len(positive_correct_binary) if positive_correct_binary else 0.0

    # 5. 카테고리별 정확도 (input_kr만으론 카테고리 모름, dataset 재참조 필요 → 결과에 미포함)
    # 6. 유형별 정확도 (positive 한정)
    by_type = defaultdict(lambda: {"total": 0, "correct": 0})
    for r in positives:
        t = r.expected_type
        by_type[t]["total"] += 1
        if r.type_correct:
            by_type[t]["correct"] += 1

    # 7. Severity 분포 (참고용)
    severity_dist = Counter(r.predicted_severity for r in completed if r.predicted_severity)

    # 8. Latency 통계
    latencies = [r.latency_ms for r in completed if r.latency_ms]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)] if latencies else 0

    # 9. Pass criteria 판정 (v1.2 — 단계 목표)
    # v1: 첫 실행 / v2: Few-shot 개선 후
    PASS_BINARY = 0.85
    PASS_TYPE = 0.70 if criteria == "v1" else 0.75
    PASS_FP = 0.15
    PASS_FN = 0.25

    pass_binary = binary_acc >= PASS_BINARY
    pass_type = type_acc >= PASS_TYPE
    pass_fp = fp_rate <= PASS_FP
    pass_fn = fn_rate <= PASS_FN
    overall_pass = pass_binary and pass_type and pass_fp and pass_fn

    return {
        "summary": {
            "total_cases": total,
            "completed": len(completed),
            "errors": len(errors),
            "criteria_version": criteria,  # v1.2 추가
        },
        "metrics": {
            "binary_accuracy": round(binary_acc, 4),
            "type_accuracy": round(type_acc, 4),
            "false_positive_rate": round(fp_rate, 4),
            "false_negative_rate": round(fn_rate, 4),
        },
        "pass_criteria": {
            "binary_accuracy": {
                "actual": round(binary_acc, 4),
                "threshold": PASS_BINARY,
                "passed": pass_binary,
            },
            "type_accuracy": {
                "actual": round(type_acc, 4),
                "threshold": PASS_TYPE,
                "passed": pass_type,
            },
            "false_positive_rate": {
                "actual": round(fp_rate, 4),
                "threshold": PASS_FP,
                "passed": pass_fp,
            },
            "false_negative_rate": {
                "actual": round(fn_rate, 4),
                "threshold": PASS_FN,
                "passed": pass_fn,
            },
            "overall_passed": overall_pass,
        },
        "by_type": {
            t: {
                "total": v["total"],
                "correct": v["correct"],
                "accuracy": round(v["correct"] / v["total"], 4) if v["total"] else 0.0,
            }
            for t, v in by_type.items()
        },
        "latency": {
            "avg_ms": round(avg_latency),
            "p95_ms": p95_latency,
        },
        "severity_distribution": dict(severity_dist),
        "failure_cases": [
            {
                "id": r.case_id,
                "input": r.input_kr[:60],
                "expected": r.expected_needs,
                "predicted": r.predicted_needs,
                "expected_type": r.expected_type,
                "predicted_types": r.predicted_types,
                "error": r.error,
            }
            for r in completed
            if not r.binary_correct or (r.expected_needs and not r.type_correct)
        ][:20],  # 최대 20개만
        "error_cases": [
            {"id": r.case_id, "error": r.error} for r in errors
        ],
    }


def print_report(report: dict):
    """리포트를 사람이 읽기 쉽게 출력."""
    print()
    print("=" * 70)
    print("  Eval 결과 리포트")
    print("=" * 70)

    s = report["summary"]
    print(f"\n[요약]")
    print(f"  총 케이스: {s['total_cases']}")
    print(f"  성공: {s['completed']} | 에러: {s['errors']}")
    if s.get("criteria_version"):
        crit_label = "v1 (첫 실행, type ≥70%)" if s["criteria_version"] == "v1" else "v2 (개선 후, type ≥75%)"
        print(f"  적용 기준: {crit_label}")

    m = report["metrics"]
    print(f"\n[정확도]")
    print(f"  Binary accuracy   : {m['binary_accuracy']:.1%}")
    print(f"  Type accuracy     : {m['type_accuracy']:.1%}  (positive 케이스 한정)")
    print(f"  False positive    : {m['false_positive_rate']:.1%}  (negative를 positive로 오판정)")
    print(f"  False negative    : {m['false_negative_rate']:.1%}  (positive를 negative로 놓침)")

    pc = report["pass_criteria"]
    print(f"\n[Pass Criteria 판정]")
    for key in ["binary_accuracy", "type_accuracy", "false_positive_rate", "false_negative_rate"]:
        item = pc[key]
        mark = "✓ PASS" if item["passed"] else "✗ FAIL"
        op = "≥" if "rate" not in key else "≤"
        print(f"  {mark}  {key}: {item['actual']:.1%} {op} {item['threshold']:.0%}")
    overall = "✓ 전체 통과 — 다음 단계 진행 가능" if pc["overall_passed"] else "✗ 전체 미통과 — 프롬프트 개선 필요"
    print(f"\n  >>> {overall}")

    print(f"\n[유형별 정확도]")
    if report["by_type"]:
        for t, v in sorted(report["by_type"].items(), key=lambda x: -x[1]["total"]):
            bar_len = int(v["accuracy"] * 20)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            print(f"  {t:8s} {bar} {v['accuracy']:.1%}  ({v['correct']}/{v['total']})")
    else:
        print("  (positive 케이스 데이터 없음)")

    if report["latency"]["avg_ms"]:
        print(f"\n[지연 시간]")
        print(f"  평균: {report['latency']['avg_ms']}ms | p95: {report['latency']['p95_ms']}ms")

    if report["failure_cases"]:
        print(f"\n[실패 케이스 상위 {min(20, len(report['failure_cases']))}개]")
        for fc in report["failure_cases"][:10]:
            mark = "△" if fc["expected"] != fc["predicted"] else "○"
            print(f"  {mark} {fc['id']}: \"{fc['input']}\"")
            print(f"      expected: needs={fc['expected']}, type={fc['expected_type']}")
            print(f"      predicted: needs={fc['predicted']}, types={fc['predicted_types']}")

    if report["error_cases"]:
        print(f"\n[API 에러 케이스]")
        for ec in report["error_cases"][:5]:
            print(f"  {ec['id']}: {ec['error']}")

    print("\n" + "=" * 70)


def main():
    parser = argparse.ArgumentParser(description="Cultural Correction Detection Eval")
    parser.add_argument("--dataset", required=True, type=Path, help="골든 데이터셋 YAML 경로")
    parser.add_argument("--prompt", required=True, type=Path, help="프롬프트 YAML 경로")
    parser.add_argument("--api-key", help="Anthropic API key (없으면 ANTHROPIC_API_KEY 환경변수 사용)")
    parser.add_argument("--dry-run", action="store_true", help="API 호출 없이 스크립트 동작만 검증 (정답 100%% 시뮬)")
    parser.add_argument("--limit", type=int, help="처음 N개 케이스만 실행")
    parser.add_argument("--output", type=Path, help="결과 JSON 저장 경로")
    parser.add_argument("--verbose", "-v", action="store_true", help="케이스별 상세 진행 출력")
    parser.add_argument(
        "--criteria",
        choices=["v1", "v2"],
        default="v1",
        help="Pass criteria 단계 (v1=70%% type 첫 실행 / v2=75%% type 개선 후). 자세한 내용은 EVAL_README.md 참조"
    )
    args = parser.parse_args()

    # 데이터셋 + 프롬프트 로드
    print(f"데이터셋 로드: {args.dataset}")
    dataset = load_dataset(args.dataset)
    print(f"  → {len(dataset)}개 케이스")

    print(f"프롬프트 로드: {args.prompt}")
    prompt_data = load_prompt(args.prompt)
    print(f"  → 시스템 프롬프트 {len(prompt_data['system_prompt'])} chars, "
          f"tool '{prompt_data['tool_definition']['name']}'")

    # API 키 확인
    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not args.dry_run and not api_key:
        print("\nERROR: API 키가 필요합니다.")
        print("  옵션 1: --api-key sk-ant-... 로 전달")
        print("  옵션 2: export ANTHROPIC_API_KEY=sk-ant-...")
        print("  옵션 3: --dry-run 으로 스크립트 동작만 검증")
        sys.exit(1)

    # Eval 실행
    mode = "DRY RUN" if args.dry_run else f"실제 호출 ({MODEL})"
    print(f"\n[Eval 시작] 모드: {mode}")
    if args.limit:
        print(f"  → 처음 {args.limit}개만 실행")
    print()

    results = run_eval(
        dataset=dataset,
        prompt_data=prompt_data,
        api_key=api_key,
        dry_run=args.dry_run,
        limit=args.limit,
        verbose=args.verbose,
    )

    # 리포트 생성 + 출력
    report = generate_report(results, criteria=args.criteria)
    print_report(report)

    # JSON 저장
    if args.output:
        output_data = {
            "report": report,
            "results": [asdict(r) for r in results],
        }
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"\n결과 저장: {args.output}")

    # 종료 코드 (CI 통합용)
    if not args.dry_run:
        sys.exit(0 if report["pass_criteria"]["overall_passed"] else 1)


if __name__ == "__main__":
    main()
