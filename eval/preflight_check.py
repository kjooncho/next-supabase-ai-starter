#!/usr/bin/env python3
"""
Pre-flight Check — Eval 실행 전 환경 점검 스크립트
====================================================

7월 첫 Eval 실행 전, 환경이 제대로 셋업됐는지 점검.

Usage:
    python preflight_check.py

이 스크립트는 다음을 검증합니다:
1. Python 버전 (3.10 이상)
2. 필수 패키지 설치 (anthropic, pyyaml)
3. API 키 환경변수
4. 산출물 파일 무결성 (golden_dataset, prompt, eval_runner)
5. Anthropic API 연결 (실제 1회 호출, ~$0.001)
6. 작업 디렉토리 쓰기 권한

이 스크립트가 모두 통과하면 eval_runner.py 실행 준비 완료.
"""

import os
import sys
import subprocess
from pathlib import Path

# 색상 코드 (터미널 가독성)
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def check(label):
    """체크 항목 데코레이터.
    함수는 (status, detail) 튜플을 반환:
      - (True, str|None): 통과 (✓), detail은 부가 정보 (선택)
      - (False, str): 실패 (✗), detail은 해결 방법
      - (None, str): 경고 (⚠), detail은 경고 사유
    """
    def decorator(fn):
        def wrapper(*args, **kwargs):
            try:
                result = fn(*args, **kwargs)
                # 함수가 단일 값만 반환한 경우 (호환성)
                if not isinstance(result, tuple):
                    result = (result, None)
                status, detail = result

                if status is True:
                    print(f"  {GREEN}✓{RESET} {label}")
                    if detail:
                        print(f"    {detail}")
                    return True
                elif status is False:
                    print(f"  {RED}✗{RESET} {label}")
                    if detail:
                        print(f"    {detail}")
                    return False
                else:  # None = 경고
                    print(f"  {YELLOW}⚠{RESET} {label}")
                    if detail:
                        print(f"    → {detail}")
                    return None
            except Exception as e:
                print(f"  {RED}✗{RESET} {label}")
                print(f"    → {type(e).__name__}: {e}")
                return False
        return wrapper
    return decorator


@check("Python 3.10+")
def check_python_version():
    if sys.version_info < (3, 10):
        return (False,
                f"현재 {sys.version_info.major}.{sys.version_info.minor} → "
                f"3.10 이상 필요. https://www.python.org/downloads/")
    return (True, f"버전: {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")


@check("anthropic 패키지 설치")
def check_anthropic_package():
    try:
        import anthropic
        version = getattr(anthropic, '__version__', 'unknown')
        return (True, f"버전: {version}")
    except ImportError:
        return (False, "설치: pip install anthropic")


@check("pyyaml 패키지 설치")
def check_pyyaml_package():
    try:
        import yaml
        return (True, None)
    except ImportError:
        return (False, "설치: pip install pyyaml")


@check("ANTHROPIC_API_KEY 환경변수")
def check_api_key():
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        return (False,
                "Mac/Linux: export ANTHROPIC_API_KEY=sk-ant-...\n"
                "    Windows: $env:ANTHROPIC_API_KEY=\"sk-ant-...\"")

    if not key.startswith("sk-ant-"):
        return (None, f"키 형식 비정상 (sk-ant-로 시작해야 함). 다시 확인해주세요.")

    return (True, f"키: sk-ant-...{key[-4:]}")


@check("golden_dataset.yaml 무결성")
def check_dataset():
    path = Path("golden_dataset.yaml")
    if not path.exists():
        return (False, f"파일 없음: {path.absolute()}")

    import yaml
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if len(data) != 90:
        return (False, f"케이스 수 비정상: {len(data)} (90 기대)")

    required = ["id", "input_kr", "category", "level",
                "needs_correction", "correction_type",
                "expected_jp", "explanation"]
    for case in data[:5]:
        missing = [f for f in required if f not in case]
        if missing:
            return (False, f"{case.get('id')} 필수 필드 누락: {missing}")

    return (True, "90 케이스 / 8 필드 모두 정상")


@check("cultural_correction_prompt.yaml 무결성")
def check_prompt():
    path = Path("cultural_correction_prompt.yaml")
    if not path.exists():
        return (False, f"파일 없음: {path.absolute()}")

    import yaml
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    if "system_prompt" not in data or "tool_definition" not in data:
        return (False, "system_prompt 또는 tool_definition 섹션 누락")

    if len(data["system_prompt"]) < 1000:
        return (False, f"system_prompt이 너무 짧음 ({len(data['system_prompt'])} chars)")

    return (True, f"system_prompt {len(data['system_prompt'])} chars / tool '{data['tool_definition']['name']}'")


@check("eval_runner.py 실행 가능")
def check_eval_runner():
    path = Path("eval_runner.py")
    if not path.exists():
        return (False, f"파일 없음: {path.absolute()}")

    result = subprocess.run(
        [sys.executable, str(path), "--help"],
        capture_output=True,
        text=True,
        timeout=10,
    )
    if result.returncode != 0:
        return (False, f"--help 실행 실패: {result.stderr[:200]}")
    return (True, None)


@check("Anthropic API 실제 연결 (~$0.001 소비)")
def check_api_connection():
    try:
        from anthropic import Anthropic
    except ImportError:
        return (False, "anthropic 패키지 미설치")

    client = Anthropic()

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=10,
        messages=[{"role": "user", "content": "Hi"}],
    )

    if not response.content:
        return (False, "응답 비어있음")

    usage = response.usage
    cost = (usage.input_tokens * 1.00 + usage.output_tokens * 5.00) / 1_000_000
    return (True, f"응답 OK / 비용: ${cost:.5f} ({usage.input_tokens}+{usage.output_tokens} tokens)")


@check("작업 디렉토리 쓰기 권한")
def check_write_permission():
    test_file = Path(".preflight_test_tmp")
    try:
        test_file.write_text("test")
        test_file.unlink()
        return (True, None)
    except Exception as e:
        return (False, f"쓰기 실패: {e}")


def main():
    print(f"\n{BOLD}=== My Niche Eval — Pre-flight Check ==={RESET}\n")

    print(f"{BOLD}[환경]{RESET}")
    py_ok = check_python_version()
    pkg1_ok = check_anthropic_package()
    pkg2_ok = check_pyyaml_package()
    write_ok = check_write_permission()

    print(f"\n{BOLD}[인증]{RESET}")
    key_ok = check_api_key()

    print(f"\n{BOLD}[산출물 무결성]{RESET}")
    dataset_ok = check_dataset()
    prompt_ok = check_prompt()
    runner_ok = check_eval_runner()

    print(f"\n{BOLD}[API 연결]{RESET}")
    if key_ok and pkg1_ok:
        api_ok = check_api_connection()
    else:
        print(f"  {YELLOW}-{RESET} API 연결 테스트 스킵 (키 또는 패키지 미설정)")
        api_ok = None

    # 최종 판정
    all_checks = [py_ok, pkg1_ok, pkg2_ok, write_ok, key_ok,
                  dataset_ok, prompt_ok, runner_ok, api_ok]
    failed = [c for c in all_checks if c is False]
    warnings = [c for c in all_checks if c is None and c is not True]

    print(f"\n{BOLD}=== 결과 ==={RESET}")
    if not failed and not warnings:
        print(f"\n{GREEN}{BOLD}✓ 모든 체크 통과 — Eval 실행 준비 완료!{RESET}")
        print(f"\n다음 명령으로 실제 실행:")
        print(f"  python eval_runner.py \\")
        print(f"    --dataset golden_dataset.yaml \\")
        print(f"    --prompt cultural_correction_prompt.yaml \\")
        print(f"    --limit 10  # 처음엔 10개로 검증")
        return 0
    elif failed:
        print(f"\n{RED}{BOLD}✗ {len(failed)}건 실패 — 위 메시지에 따라 환경 수정 필요{RESET}")
        return 1
    else:
        print(f"\n{YELLOW}{BOLD}⚠ 주의 항목 있음 — 위 메시지 확인 후 진행{RESET}")
        return 0


if __name__ == "__main__":
    sys.exit(main())
