#!/bin/bash
cd /sessions/amazing-nice-ride/mnt/neo-cube
NEXT_TEST_WASM_DIR=/sessions/amazing-nice-ride/mnt/neo-cube/node_modules/@next/swc-wasm-nodejs \
  ./node_modules/.bin/next build > /sessions/amazing-nice-ride/mnt/neo-cube/build_output.txt 2>&1
echo "EXIT_CODE=$?" >> /sessions/amazing-nice-ride/mnt/neo-cube/build_output.txt
