#!/bin/bash
cd /home/kavia/workspace/code-generation/note-keeper-244518-244532/react_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

