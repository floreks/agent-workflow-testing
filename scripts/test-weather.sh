#!/usr/bin/env bash
#
# scripts/test-weather.sh - Test suite for weather.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEATHER_SCRIPT="${SCRIPT_DIR}/weather.sh"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track overall test status
failed=0

# Create a temporary directory for mocked binaries
MOCK_DIR=$(mktemp -d)
trap 'rm -rf "$MOCK_DIR"' EXIT

# Path to the log where curl arguments will be saved
export MOCK_LOG="${MOCK_DIR}/mock_curl.log"
touch "$MOCK_LOG"

# Create a mock curl binary to simulate various scenarios
cat << 'EOF' > "${MOCK_DIR}/curl"
#!/usr/bin/env bash
# Log the arguments called
echo "$*" >> "$MOCK_LOG"

# Check URL queried
if [[ "$*" == *"https://wttr.in/Paris?format=3"* ]]; then
  echo "Paris: ☀️  +28°C"
  exit 0
elif [[ "$*" == *"https://wttr.in/Munich"* ]]; then
  echo "Munich: 🌧️  +15°C"
  exit 0
elif [[ "$*" == *"https://wttr.in/fail"* ]]; then
  echo "Could not resolve host" >&2
  exit 6
elif [[ "$*" == *"https://wttr.in/html-error"* ]]; then
  echo "<html><head><title>502 Bad Gateway</title></head><body>An error occurred.</body></html>"
  exit 0
elif [[ "$*" == *"format=3&m"* ]]; then
  echo "Metric short format"
  exit 0
elif [[ "$*" == *"format=3&u"* ]]; then
  echo "Imperial short format"
  exit 0
else
  echo "Default mocked weather output"
  exit 0
fi
EOF
chmod +x "${MOCK_DIR}/curl"

# Add mock directory to the front of PATH so weather.sh uses our mock curl
export PATH="${MOCK_DIR}:${PATH}"

assert_exit_code() {
  local expected="$1"
  local actual="$2"
  local msg="$3"
  if [[ "$expected" -ne "$actual" ]]; then
    echo -e "${RED}FAIL: ${msg} (Expected exit code ${expected}, got ${actual})${NC}" >&2
    failed=$((failed + 1))
  else
    echo -e "${GREEN}PASS: ${msg}${NC}"
  fi
}

assert_contains() {
  local pattern="$1"
  local content="$2"
  local msg="$3"
  if ! echo "$content" | grep -q "$pattern"; then
    echo -e "${RED}FAIL: ${msg} (Expected to contain '${pattern}' in output)${NC}" >&2
    echo "Output was:" >&2
    echo "---" >&2
    echo "$content" >&2
    echo "---" >&2
    failed=$((failed + 1))
  else
    echo -e "${GREEN}PASS: ${msg}${NC}"
  fi
}

# Ensure the weather script is executable
if [[ ! -x "$WEATHER_SCRIPT" ]]; then
  echo -e "${RED}FAIL: weather.sh is not executable${NC}" >&2
  failed=$((failed + 1))
fi

echo "=== Running weather.sh Tests ==="

# Test 1: Help options
echo "Testing help options..."
out=$("$WEATHER_SCRIPT" -h)
assert_exit_code 0 $? "Help option (-h) exit code"
assert_contains "Usage:" "$out" "Help option output contains usage"
assert_contains "Options:" "$out" "Help option output contains options"

out=$("$WEATHER_SCRIPT" --help)
assert_exit_code 0 $? "Help option (--help) exit code"
assert_contains "Usage:" "$out" "Help option output contains usage"

# Test 2: Invalid options
echo "Testing invalid options..."
out=$("$WEATHER_SCRIPT" --invalid-flag 2>&1) && exit_code=0 || exit_code=$?
assert_exit_code 1 $exit_code "Invalid option exit code"
assert_contains "Unknown option" "$out" "Invalid option displays error message"

# Test 3: Standard behavior with location
echo "Testing standard query..."
> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" Munich 2>&1) && exit_code=0 || exit_code=$?
assert_exit_code 0 $exit_code "Query for Munich exit code"
assert_contains "Munich: 🌧️  +15°C" "$out" "Output matches mocked query"
last_curl_call=$(tail -n 1 "$MOCK_LOG")
assert_contains "https://wttr.in/Munich" "$last_curl_call" "Constructed URL contains location"

# Test 4: Short format flag (-s / --short)
echo "Testing short format flag..."
> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" -s Paris 2>&1) && exit_code=0 || exit_code=$?
assert_exit_code 0 $exit_code "Short option exit code"
assert_contains "Paris: ☀️  +28°C" "$out" "Short option output matches mock"
last_curl_call=$(tail -n 1 "$MOCK_LOG")
assert_contains "https://wttr.in/Paris?format=3" "$last_curl_call" "Short option adds correct query param"

# Test 5: Metric / Imperial flags (-c, -f)
echo "Testing metric (-c) and imperial (-f) flags..."
> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" -s -c London 2>&1) && exit_code=0 || exit_code=$?
last_curl_call=$(tail -n 1 "$MOCK_LOG")
assert_contains "format=3&m" "$last_curl_call" "Metric short option has correct query string"

> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" -s -f London 2>&1) && exit_code=0 || exit_code=$?
last_curl_call=$(tail -n 1 "$MOCK_LOG")
assert_contains "format=3&u" "$last_curl_call" "Imperial short option has correct query string"

# Test 6: Network / curl failure handling
echo "Testing network/curl failure handling..."
> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" fail 2>&1) && exit_code=0 || exit_code=$?
assert_exit_code 3 $exit_code "Curl error exit code"
assert_contains "Failed to fetch weather data" "$out" "Curl error displays informative message"

# Test 7: HTML response error handling
echo "Testing HTML error response handling..."
> "$MOCK_LOG"
out=$("$WEATHER_SCRIPT" html-error 2>&1) && exit_code=0 || exit_code=$?
assert_exit_code 4 $exit_code "HTML error response exit code"
assert_contains "Received HTML response" "$out" "HTML error displays informative message"

# Final results
echo ""
if [[ $failed -eq 0 ]]; then
  echo -e "${GREEN}ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}SOME TESTS FAILED ($failed failures).${NC}" >&2
  exit 1
fi
