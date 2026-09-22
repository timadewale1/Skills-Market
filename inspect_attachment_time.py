import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

conn = sqlite3.connect(db)

rows = conn.execute("""
SELECT
    id,
    turn_index,
    timestamp,
    user_message,
    substr(assistant_response, 1, 300)
FROM turns
WHERE session_id = ?
  AND timestamp BETWEEN '2026-09-19T21:30:00' AND '2026-09-19T23:30:00'
ORDER BY turn_index
""", (SESSION,)).fetchall()

for row in rows:
    print("\n========================================")
    print("ID:", row[0])
    print("TURN:", row[1])
    print("TIMESTAMP:", row[2])
    print("USER MESSAGE:")
    print(repr(row[3]))
    print("ASSISTANT PREVIEW:")
    print(repr(row[4]))

conn.close()
