#!/usr/bin/env bash
#shellcheck disable=SC2317
_SCRIPT_VERSION="0.1"
_SCRIPT_NAME="FE BUILDER"
# TODO: Add option to throw an error if a variable from the env is not found anywhere.
###########################
# Configuration
###########################
# Put your global configuration here.
_ERROR_ON_MISSING_ENV_VARS="true"

###########################
# Functions
###########################
function log() {
    local _BRed='\e[1;31m'    # Red
    local _BYellow='\e[1;33m' # Yellow
    local _BBlue='\e[1;34m'   # Blue
    local _BWhite='\e[1;37m'  # White
    local _NC="\e[m"          # Color Reset
    local _message="$1"
    local _level="$2"
    local _nl="\n"
    _timestamp=$(date +%d.%m.%Y-%d:%H:%M:%S-%Z)
    case $(echo "$_level" | tr '[:upper:]' '[:lower:]') in
    "info" | "information")
        echo -ne "${_BWhite}[INFO][${_SCRIPT_NAME} ${_SCRIPT_VERSION}][${_timestamp}]: ${_message}${_NC}${_nl}"
        ;;
    "warn" | "warning")
        echo -ne "${_BYellow}[WARN][${_SCRIPT_NAME} ${_SCRIPT_VERSION}][${_timestamp}]: ${_message}${_NC}${_nl}"
        ;;
    "err" | "error")
        echo -ne "${_BRed}[ERR][${_SCRIPT_NAME} ${_SCRIPT_VERSION}][${_timestamp}]: ${_message}${_NC}${_nl}"
        ;;
    *)
        echo -ne "${_BBlue}[UNKNOWN][${_SCRIPT_NAME} ${_SCRIPT_VERSION}][${_timestamp}]: ${_message}${_NC}${_nl}"
        ;;
    esac
}

function failure() {
    local _lineno="$2"
    local _fn="$3"
    local _exitstatus="$4"
    local _msg="$5"
    local _lineno_fns="${1% 0}"
    if [[ "$_lineno_fns" != "0" ]]; then _lineno="${_lineno} ${_lineno_fns}"; fi
    log "Error in ${BASH_SOURCE[1]}:${_fn}[${_lineno}] Failed with status ${_exitstatus}: ${_msg}" "ERROR"
}


###########################
# Error Handling
###########################
set -eE -o functrace
trap 'failure "${BASH_LINENO[*]}" "$LINENO" "${FUNCNAME[*]:-script}" "$?" "$BASH_COMMAND"' ERR

# Check if the .env file exists
if [ -f .env ]; then
  # Use grep to filter lines that match the pattern 'VAR_NAME='
  # Then, use cut to extract the variable name (portion before '=')
  # Sort and remove duplicates with 'sort -u'
  variable_names=$(grep -o '^[A-Za-z_][A-Za-z_0-9]*=' .env | cut -d '=' -f 1 | sort -u)

  # Remove .env file FIRST so Vite doesn't read it
  log "Removing .env file so Vite uses exported environment variables" "INFO"
  rm .env

  # Loop through the variable names and export them as placeholders
  for var in $variable_names; do
    placeholder_value="TENANT_INJECT_$var"
    log "Setting variable $var=$placeholder_value" "INFO"
    export $var="$placeholder_value"
  done
else
  log "The .env file does not exist." "WARN"
fi

export VITE_SKIP_AUTH="true"

# Verify exports before building
log "Verifying exported placeholders:" "INFO"
env | grep "^VITE_INOPS" | head -10 || log "No VITE_INOPS variables found!" "WARN"

# Double-check critical variables
log "Checking critical exports:" "INFO"
for var in VITE_INOPS_API_BASE_URL VITE_INOPS_SEARCH_KEY VITE_INOPS_CAMPAIGN_ID VITE_INOPS_HOMEPAGE_URL VITE_DUMMY_SHOP_NAME; do
  if [ -n "${!var}" ]; then
    log "  ✓ $var=${!var}" "INFO"
  else
    log "  ✗ $var is NOT SET" "WARN"
  fi
done

# Run build with explicit env var passing
log "Starting Vite build..." "INFO"
npm run build

###########################
# Clean Exit
###########################
log "Performing clean exit" "INFO"
exit 0