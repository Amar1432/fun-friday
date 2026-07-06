#!/bin/bash
# A simple script to pull the next ticket from TASKS.md into ACTIVE_TASK.md

echo "Enter the Ticket ID you want to start (e.g., FFH-002):"
read TICKET_ID

echo "# Active Task" > docs/ACTIVE_TASK.md
echo "" >> docs/ACTIVE_TASK.md

# This uses awk to extract the specific ticket block from TASKS.md
awk -v ticket="$TICKET_ID" '
  $0 ~ "## " ticket {flag=1; print; next}
  /^## FFH-/ && flag {flag=0}
  flag {print}
' docs/TASKS.md >> docs/ACTIVE_TASK.md

echo "✅ docs/ACTIVE_TASK.md updated with $TICKET_ID!"