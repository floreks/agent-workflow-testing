#!/usr/bin/env bash
# weather.sh - A script to check and display weather information using wttr.in

set -euo pipefail

# Default configuration
UNIT=""
FORMAT=""
NARROW=false
LOCATION=""

show_help() {
  cat << EOF
Usage: $(basename "$0") [OPTIONS] [LOCATION]

Check and display weather information for a specified location.
If no location is provided, the script automatically detects your location based on IP.

Options:
  -u, --unit UNIT      Set unit of measurement:
                         metric (Celsius, km/h) [default]
                         imperial (Fahrenheit, mph)
  -n, --narrow         Display weather in a narrow, single-line format
  -j, --json           Display full weather details in JSON format
  -h, --help           Show this help message and exit

Examples:
  $(basename "$0") London
  $(basename "$0") --unit imperial "New York"
  $(basename "$0") --narrow Tokyo
EOF
}

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;
    -u|--unit)
      if [[ -z "${2:-}" ]]; then
        echo "Error: --unit requires an argument (metric|imperial)." >&2
        exit 1
      fi
      if [[ "$2" == "metric" ]]; then
        UNIT="m"
      elif [[ "$2" == "imperial" ]]; then
        UNIT="u"
      else
        echo "Error: Invalid unit '$2'. Use 'metric' or 'imperial'." >&2
        exit 1
      fi
      shift 2
      ;;
    -n|--narrow)
      if [[ "$FORMAT" == "j1" ]]; then
        echo "Error: Cannot combine --narrow and --json options." >&2
        exit 1
      fi
      NARROW=true
      shift
      ;;
    -j|--json)
      if [[ "$NARROW" == true ]]; then
        echo "Error: Cannot combine --narrow and --json options." >&2
        exit 1
      fi
      FORMAT="j1"
      shift
      ;;
    -*)
      echo "Error: Unknown option '$1'" >&2
      show_help >&2
      exit 1
      ;;
    *)
      if [[ -n "$LOCATION" ]]; then
        LOCATION="$LOCATION $1"
      else
        LOCATION="$1"
      fi
      shift
      ;;
  esac
done

# Check if curl is available
if ! command -v curl >/dev/null 2>&1; then
  echo "Error: curl is required but was not found on this system." >&2
  exit 2
fi

# URL encode the location
encoded_location=""
if [[ -n "$LOCATION" ]]; then
  # Simple URL encoding using jq if available, otherwise fallback to python or curl effective url
  if command -v jq >/dev/null 2>&1; then
    encoded_location=$(jq -rn --arg loc "$LOCATION" '$loc|@uri')
  elif command -v python3 >/dev/null 2>&1; then
    encoded_location=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$LOCATION'''))")
  else
    encoded_location=$(echo -n "$LOCATION" | curl -s -o /dev/null -w "%{url_effective}" --get --data-urlencode "= " "" | cut -c 3-)
  fi
fi

# Construct URL
URL="https://wttr.in/${encoded_location}"
PARAMS=()

if [[ "$NARROW" == true ]]; then
  # Format 3 is narrow: "London: ⛅️ +18°C ↙8km/h"
  PARAMS+=("format=3")
elif [[ "$FORMAT" == "j1" ]]; then
  PARAMS+=("format=j1")
fi

if [[ -n "$UNIT" ]]; then
  PARAMS+=("$UNIT")
fi

# Join params with & and append to URL
if [[ ${#PARAMS[@]} -gt 0 ]]; then
  joined_params=$(IFS=\&; echo "${PARAMS[*]}")
  URL="${URL}?${joined_params}"
fi

# Fetch and display weather with a timeout of 10 seconds
# User-Agent is set to curl/7.x to ensure wttr.in formats for terminal correctly
if ! response=$(curl -sS --connect-timeout 5 --max-time 10 -H "User-Agent: curl" "$URL"); then
  echo "Error: Failed to connect to weather service (wttr.in)." >&2
  exit 3
fi

# Check if response is empty
if [[ -z "$response" ]]; then
  echo "Error: Received empty response from weather service." >&2
  exit 3
fi

# Print response
echo "$response"
