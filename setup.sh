#! /bin/sh

# Source this file for environment overrides

## Store and discover llama.cpp models under XDG data
export LLAMA_ARG_MODELS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/llama.cpp/models"
