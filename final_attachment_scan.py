import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

conn = sqlite3.connect(db)

print("=== SESSION FILES ===")

rows = conn.execute("""
SELECT id, session_id, file_path, tool_name, turn_index, first_seen_at
FROM session_files
WHERE session_id = ?
ORDER BY turn_index, id
""", (SESSION,)).fetchall()

for row in rows:
    print(row)

print("\n=== SESSION REFS ===")

rows = conn.execute("""
SELECT id, session_id, ref_type, ref_value, turn_index, created_at
FROM session_refs
WHERE session_id = ?
ORDER BY turn_index, id
""", (SESSION,)).fetchall()

if rows:
    for row in rows:
        print(row)
else:
    print("No session_refs records.")

print("\n=== TURNS CONTAINING ATTACHMENT MARKERS ===")

rows = conn.execute("""
SELECT id, turn_index, timestamp, user_message
FROM turns
WHERE session_id = ?
  AND (
       lower(user_message) LIKE '%attachment%'
       OR lower(user_message) LIKE '%screenshot%'
       OR lower(user_message) LIKE '%pasted text%'
  )
ORDER BY turn_index
""", (SESSION,)).fetchall()

for row in rows:
    print(row)

print("\n=== DATABASE INTEGRITY ===")
print(conn.execute("PRAGMA integrity_check").fetchone()[0])

conn.close()
