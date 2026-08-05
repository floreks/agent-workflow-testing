#!/usr/bin/env bash
# test_weather.sh - Automated tests for weather.sh using a mocked curl

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEATHER_SH="${SCRIPT_DIR}/weather.sh"

# Colors for test output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test tracking
tests_run=0
tests_passed=0
tests_failed=0

assert_equals() {
  local expected="$1"
  local actual="$2"
  local msg="${3:-Assertion failed}"
  
  if [[ "$expected" != "$actual" ]]; then
    echo -e "  ${RED}FAIL: ${msg}${NC}"
    echo "    Expected: '${expected}'"
    echo "    Actual:   '${actual}'"
    tests_failed=$((tests_failed + 1))
    return 1
  else
    tests_passed=$((tests_passed + 1))
    return 0
  fi
}

run_test_case() {
  local name="$1"
  tests_run=$((tests_run + 1))
  echo "Running test: ${name}..."
}

# Create temporary directories for test artifacts
TEST_TMP_DIR=$(mktemp -d)
MOCK_BIN_DIR="${TEST_TMP_DIR}/bin"
mkdir -p "$MOCK_BIN_DIR"

CURL_LOG="${TEST_TMP_DIR}/curl-calls.log"
FAIL_TRIGGER="${TEST_TMP_DIR}/fail-trigger"

# Create mock curl executable
cat > "${MOCK_BIN_DIR}/curl" << EOF
#!/usr/bin/env bash
# Record call details
echo "\$*" >> "${CURL_LOG}"

if [[ -f "${FAIL_TRIGGER}" ]]; then
  echo "Simulated curl network failure" >&2
  exit 6
fi

# Search for the URL in arguments
url=""
for arg in "\$@"; do
  if [[ "\$arg" =~ ^https://wttr.in/ ]]; then
    url="\$arg"
    break
  fi
done

if [[ -n "\$url" ]]; then
  if [[ "\$url" =~ "format=3" ]]; then
    echo "Paris: ☀️  +30°C"
  elif [[ "\$url" =~ "format=j1" ]]; then
    echo '{"current_condition": [{"temp_C": "30"}]}'
  else
    echo "Mocked Standard Weather Report"
  fi
  exit 0
fi

echo "Mocked curl default response"
exit 0
EOF
chmod +x "${MOCK_BIN_DIR}/curl"

# Save the original PATH and prepend mock bin dir to PATH for tests using curl
ORIG_PATH="$PATH"

# Test 1: Help message
run_test_case "Help Option"
# Run with original path, no mock needed
help_out=$("$WEATHER_SH" --help)
exit_code=$?
assert_equals "0" "$exit_code" "Help should exit with 0"
if [[ "$help_out" =~ "Usage:" ]] && [[ "$help_out" =~ "--unit" ]] && [[ "$help_out" =~ "--narrow" ]]; then
  assert_equals "1" "1" "Help content validation"
else
  assert_equals "1" "0" "Help content validation (Usage: or unit/narrow not found)"
fi

# Test 2: Invalid option
run_test_case "Invalid Option"
set +e
"$WEATHER_SH" --invalid-flag-xyz >/dev/null 2> "${TEST_TMP_DIR}/err_opt.log"
exit_code=$?
set -e
err_content=$(cat "${TEST_TMP_DIR}/err_opt.log")
assert_equals "1" "$exit_code" "Invalid option should exit with 1"
if [[ "$err_content" =~ "Error: Unknown option" ]]; then
  assert_equals "1" "1" "Error message validation"
else
  assert_equals "1" "0" "Error message validation: '${err_content}'"
fi

# Test 3: Invalid unit option
run_test_case "Invalid Unit"
set +e
"$WEATHER_SH" --unit kelvin "New York" >/dev/null 2> "${TEST_TMP_DIR}/err_unit.log"
exit_code=$?
set -e
err_content=$(cat "${TEST_TMP_DIR}/err_unit.log")
assert_equals "1" "$exit_code" "Invalid unit should exit with 1"
if [[ "$err_content" =~ "Error: Invalid unit" ]]; then
  assert_equals "1" "1" "Unit error message validation"
else
  assert_equals "1" "0" "Unit error message validation: '${err_content}'"
fi

# Test 4: Missing unit argument
run_test_case "Missing Unit Argument"
set +e
"$WEATHER_SH" --unit >/dev/null 2> "${TEST_TMP_DIR}/err_unit_arg.log"
exit_code=$?
set -e
err_content=$(cat "${TEST_TMP_DIR}/err_unit_arg.log")
assert_equals "1" "$exit_code" "Missing unit argument should exit with 1"
if [[ "$err_content" =~ "Error: --unit requires an argument" ]]; then
  assert_equals "1" "1" "Missing unit argument error message validation"
else
  assert_equals "1" "0" "Missing unit argument error message: '${err_content}'"
fi

# Test 5: Combining narrow and json options (mutually exclusive)
run_test_case "Mutually Exclusive Options"
set +e
"$WEATHER_SH" --narrow --json Paris >/dev/null 2> "${TEST_TMP_DIR}/err_excl.log"
exit_code=$?
set -e
err_content=$(cat "${TEST_TMP_DIR}/err_excl.log")
assert_equals "1" "$exit_code" "Combining --narrow and --json should exit with 1"
if [[ "$err_content" =~ "Error: Cannot combine --narrow and --json options" ]]; then
  assert_equals "1" "1" "Mutually exclusive error message validation"
else
  assert_equals "1" "0" "Mutually exclusive error message: '${err_content}'"
fi

# Now enable mock curl by modifying PATH
export PATH="${MOCK_BIN_DIR}:${PATH}"

# Test 6: Successful narrow weather fetching
run_test_case "Narrow Format Integration"
rm -f "${CURL_LOG}"
set +e
output=$("$WEATHER_SH" --narrow Paris)
exit_code=$?
set -e
assert_equals "0" "$exit_code" "Narrow fetch should exit with 0"
assert_equals "Paris: ☀️  +30°C" "$output" "Should print narrow weather info"
curl_args=$(cat "${CURL_LOG}" || echo "")
if [[ "$curl_args" =~ "https://wttr.in/Paris?format=3" ]]; then
  assert_equals "1" "1" "Narrow URL structure validation"
else
  assert_equals "1" "0" "Narrow URL structure validation. Args: '${curl_args}'"
fi

# Test 7: Successful JSON weather fetching
run_test_case "JSON Format Integration"
rm -f "${CURL_LOG}"
set +e
output=$("$WEATHER_SH" --json London)
exit_code=$?
set -e
assert_equals "0" "$exit_code" "JSON fetch should exit with 0"
if [[ "$output" =~ "current_condition" ]]; then
  assert_equals "1" "1" "Output should be JSON and contain current_condition"
else
  assert_equals "1" "0" "Output was: '${output}'"
fi
curl_args=$(cat "${CURL_LOG}" || echo "")
if [[ "$curl_args" =~ "https://wttr.in/London?format=j1" ]]; then
  assert_equals "1" "1" "JSON URL structure validation"
else
  assert_equals "1" "0" "JSON URL structure validation. Args: '${curl_args}'"
fi

# Test 8: Unit option passed to URL
run_test_case "Unit Flag Passed to URL"
rm -f "${CURL_LOG}"
set +e
output=$("$WEATHER_SH" --unit imperial "San Francisco")
exit_code=$?
set -e
assert_equals "0" "$exit_code" "Unit fetch should exit with 0"
curl_args=$(cat "${CURL_LOG}" || echo "")
if [[ "$curl_args" =~ "https://wttr.in/San%20Francisco?u" ]]; then
  assert_equals "1" "1" "Unit URL structure validation"
else
  assert_equals "1" "0" "Unit URL structure validation. Args: '${curl_args}'"
fi

# Test 9: Connection/service failure
run_test_case "Network/Service Connection Failure"
touch "${FAIL_TRIGGER}"
set +e
err_out=$("$WEATHER_SH" London 2> "${TEST_TMP_DIR}/err_fail.log")
exit_code=$?
set -e
err_content=$(cat "${TEST_TMP_DIR}/err_fail.log")
assert_equals "3" "$exit_code" "Connection failure should exit with 3"
if [[ "$err_content" =~ "Error: Failed to connect to weather service" ]]; then
  assert_equals "1" "1" "Connection failure error message validation"
else
  assert_equals "1" "0" "Connection failure error message: '${err_content}'"
fi
rm -f "${FAIL_TRIGGER}"

# Clean up
export PATH="$ORIG_PATH"
rm -rf "$TEST_TMP_DIR"

echo "--------------------------------------"
if [[ $tests_failed -eq 0 ]]; then
  echo -e "${GREEN}All ${tests_run} tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}${tests_failed} out of ${tests_run} tests failed.${NC}"
  exit 1
fi
