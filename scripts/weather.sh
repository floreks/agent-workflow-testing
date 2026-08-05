#!/usr/bin/env bash
#
# scripts/weather.sh - Check and display the weather using wttr.in
#
# Usage: ./scripts/weather.sh [options] [location]
#

set -euo pipefail

# Default values
FORMAT=""
NARROW=false
LOCATION=""

show_help() {
  cat << EOF
Weather CLI Script - Query and display weather forecasts

Usage:
  $(basename "$0") [options] [location]

Arguments:
  location       Optional city name or location (e.g., "Paris", "New York", "Munich").
                 If omitted, the weather for your current IP-based location is shown.

Options:
  -h, --help     Show this help message and exit
  -s, --short    Show a brief one-line weather summary
  -n, --narrow   Show narrow terminal format (no color/simple ASCII)
  -c, --celsius  Force metric units (Celsius)
  -f, --fahrenheit Force US units (Fahrenheit)

Examples:
  $(basename "$0")
  $(basename "$0") Paris
  $(basename "$0") --short Munich
  $(basename "$0") -c "New York"
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -s|--short)
      FORMAT="format=3"
      shift
      ;;
    -n|--narrow)
      NARROW=true
      shift
      ;;
    -c|--celsius)
      if [[ -z "$FORMAT" ]]; then
        FORMAT="m"
      else
        FORMAT="${FORMAT}&m"
      fi
      shift
      ;;
    -f|--fahrenheit)
      if [[ -z "$FORMAT" ]]; then
        FORMAT="u"
      else
        FORMAT="${FORMAT}&u"
      fi
      shift
      ;;
    -*)
      echo "Error: Unknown option '$1'" >&2
      show_help >&2
      exit 1
      ;;
    *)
      if [[ -z "$LOCATION" ]]; then
        LOCATION="$1"
      else
        LOCATION="$LOCATION $1"
      fi
      shift
      ;;
  esac
done

# Ensure curl is installed
if ! command -v curl &>/dev/null; then
  echo "Error: curl is not installed. Please install curl to run this script." >&2
  exit 2
fi

# URL encode location if provided
ENCODED_LOCATION=""
if [[ -n "$LOCATION" ]]; then
  ENCODED_LOCATION="${LOCATION// /+}"
fi

# Build wttr.in query URL
URL="https://wttr.in/${ENCODED_LOCATION}"

# Build query parameters
PARAMS=()
if [[ "$NARROW" == "true" ]]; then
  PARAMS+=("n")
fi
if [[ -n "$FORMAT" ]]; then
  PARAMS+=("$FORMAT")
fi

# Construct final URL with params
if [[ ${#PARAMS[@]} -gt 0 ]]; then
  IFS="&"
  URL="${URL}?${PARAMS[*]}"
  unset IFS
fi

# Fetch and display weather with user-agent 'curl' to ensure wttr.in responds with CLI output
EXIT_CODE=0
RESPONSE=$(curl -sS -A "curl" --max-time 10 "$URL" 2>&1) && EXIT_CODE=0 || EXIT_CODE=$?

if [[ $EXIT_CODE -ne 0 ]]; then
  echo "Error: Failed to fetch weather data (exit code $EXIT_CODE)." >&2
  echo "Details: $RESPONSE" >&2
  exit 3
fi

# Check if response looks like an HTML error page from a proxy or wttr.in down
if echo "$RESPONSE" | grep -qiE "<html|<head|<body"; then
  echo "Error: Received HTML response. wttr.in might be experiencing issues or the location '$LOCATION' was not found." >&2
  exit 4
fi

# Print response
echo "$RESPONSE"
