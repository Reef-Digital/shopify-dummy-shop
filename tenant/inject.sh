#!/usr/bin/env bash
#shellcheck disable=SC2317
_SCRIPT_VERSION="0.2"
_SCRIPT_NAME="FE INJECTOR"
# TODO: Add option to throw an error if a variable from the env is not found anywhere.
# TODO: Change inputs to be non-positional (named).
# TODO: Remove globals usage from functions.
# TODO: This will inject all variables from the env that start with TENANT_INJECT_* into the specified directory's files.
# TODO: Make this script to work with multiline vars.
# TODO: Improve the verbosity of logging - if no replacements are done, if any are done - on which line and how many occurences.
###########################
# Configuration
###########################
# Put your global configuration here.
_FE_INJECTOR_TARGET_DIR="${1:-}"
_FE_INJECTOR_CASE_SENSITIVE="${2:-false}"
_ERROR_ON_MISSING_ENV_VARS="${3:-true}"
_DEBUG_MODE="false"
_FE_INJECTOR_PATTERN_PREFIX="TENANT_INJECT_"

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

function check_empty() {
    local _vars=("$@")
    local _empty_vars=()
    for _var in "${_vars[@]}"; do
        if [[ -z "${!_var}" ]]; then
            _empty_vars+=("$_var")
        fi
    done

    if [[ ${#_empty_vars[@]} -gt 0 ]]; then

        log "Required variables are empty: ${_empty_vars[*]}" "ERROR"
        exit 1
    fi
}

function print_args() {
    local _vars=("$@")
    log "Script arguments:"
    for _var in "${_vars[@]}"; do
        log "$_var=${!_var}" "INFO"
    done
}

function load_env() {
    if [ -f .env ]; then
        export $(grep -v '^#' .env | xargs)
    fi
    log "Script env:"
    if [[ "$_DEBUG_MODE" == "true" ]]; then env; fi
}

function replace_in_files() {
    local _dir="$1"
    local _variables=$(env | grep "^${_FE_INJECTOR_PATTERN_PREFIX}" | cut -d'=' -f1)

    # Find all files in the directory once, and then iterate over them
    local _files=$(find "${_dir}" -type f)

    for _file in $_files; do
        local _changes_made=false

        # Skip files in the specified directories
        if [[ "$_file" =~ ^\./(sys|proc)/ ]]; then
            continue
        fi

        for _var in $_variables; do
            local _value="${!_var}"
            local _search_string="${_var}"

            # Check if the file contains the search string
            if grep -q "${_search_string}" "$_file"; then
                _changes_made=true
                log "Replacing ${_search_string} with ${_value} in ${_file}" "INFO"
                # Use the ASCII bell character as a delimiter
                sed -i "s|${_search_string}|${_value}|g" "$_file"
            fi
        done

        if [[ $_changes_made == true ]]; then
            log "Updated ${_file}" "INFO"
        else
            log "No replacements made in ${_file}" "INFO"
        fi
    done
}

###########################
# Error Handling
###########################
set -eE -o functrace
trap 'failure "${BASH_LINENO[*]}" "$LINENO" "${FUNCNAME[*]:-script}" "$?" "$BASH_COMMAND"' ERR

###########################
# Main
###########################
log "Starting script" "INFO"
check_empty _FE_INJECTOR_TARGET_DIR _FE_INJECTOR_CASE_SENSITIVE
if [[ "$_DEBUG_MODE" == "true" ]]; then print_args _FE_INJECTOR_TARGET_DIR _FE_INJECTOR_CASE_SENSITIVE; fi
load_env

# Log available TENANT_INJECT_* variables for debugging
log "Available TENANT_INJECT_* variables:" "INFO"
env | grep "^${_FE_INJECTOR_PATTERN_PREFIX}" | while IFS='=' read -r var_line; do
  var_name="${var_line%%=*}"
  var_value="${var_line#*=}"
  log "  $var_name=$var_value" "INFO"
done

# Count variables
var_count=$(env | grep -c "^${_FE_INJECTOR_PATTERN_PREFIX}" || echo "0")
log "Found $var_count ${_FE_INJECTOR_PATTERN_PREFIX}* variables to inject" "INFO"

replace_in_files "$_FE_INJECTOR_TARGET_DIR" "TENANT_INJECT_"

###########################
# Clean Exit
###########################
log "Performing clean exit" "INFO"
exit 0