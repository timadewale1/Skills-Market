import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

conn = sqlite3.connect(db)

print("=== TURN 32 ===")

turn = conn.execute("""
SELECT id, session_id, turn_index, timestamp, user_message
FROM turns
WHERE session_id = ? AND turn_index = 32
""", (SESSION,)).fetchone()

print(turn)

print("\n=== FTS RECORD FOR TURN 32 ===")

fts = conn.execute("""
SELECT rowid, content, session_id, source_type, source_id
FROM search_index
WHERE source_id = ?
""", (f"{SESSION}:turn:32",)).fetchall()

for row in fts:
    print("ROWID:", row[0])
    print("CONTENT:")
    print(row[1])
    print("SESSION:", row[2])
    print("SOURCE TYPE:", row[3])
    print("SOURCE ID:", row[4])

print("\n=== ALL FTS RECORDS CONTAINING ATTACHMENT TEXT ===")

rows = conn.execute("""
SELECT rowid, source_id, substr(content, 1, 500)
FROM search_index
WHERE content MATCH 'attachment'
AND session_id = ?
ORDER BY rowid
""", (SESSION,)).fetchall()

for row in rows:
    print(row)

conn.close()
