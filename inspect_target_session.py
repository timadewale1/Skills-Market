import sqlite3
import json

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

conn = sqlite3.connect(db)

print("=" * 80)
print("TARGET SESSION")
print("=" * 80)
print(SESSION)

print("\n" + "=" * 80)
print("SESSION RECORD")
print("=" * 80)

session = conn.execute("""
SELECT *
FROM sessions
WHERE id = ?
""", (SESSION,)).fetchone()

print(session)

print("\n" + "=" * 80)
print("ALL TURNS IN TARGET SESSION WITH ATTACHMENT/IMAGE TERMS")
print("=" * 80)

rows = conn.execute("""
SELECT id, turn_index, timestamp, user_message, assistant_response
FROM turns
WHERE session_id = ?
ORDER BY turn_index
""", (SESSION,)).fetchall()

terms = [
    "attachment",
    "image/",
    "data:image",
    "screenshot",
    "pasted text",
    "vision"
]

for row_id, turn_index, timestamp, user_message, assistant_response in rows:
    combined = (user_message or "") + "\n" + (assistant_response or "")
    lower = combined.lower()

    matched = [term for term in terms if term in lower]

    if matched:
        print("\n--- MATCH ---")
        print("DB ID:", row_id)
        print("TURN:", turn_index)
        print("TIMESTAMP:", timestamp)
        print("MATCHED:", matched)
        print("USER:")
        print(repr(user_message))
        print("ASSISTANT:")
        print(repr(assistant_response[:3000] if assistant_response else ""))

print("\n" + "=" * 80)
print("FTS RECORDS FOR TARGET SESSION")
print("=" * 80)

fts_rows = conn.execute("""
SELECT rowid, source_id, content
FROM search_index
WHERE session_id = ?
ORDER BY rowid
""", (SESSION,)).fetchall()

print("FTS records:", len(fts_rows))

for rowid, source_id, content in fts_rows:
    lower = (content or "").lower()

    if any(term in lower for term in terms):
        print("\n--- FTS MATCH ---")
        print("ROWID:", rowid)
        print("SOURCE:", source_id)
        print("CONTENT:")
        print(content[:5000])

print("\n" + "=" * 80)
print("SESSION FILES")
print("=" * 80)

for row in conn.execute("""
SELECT *
FROM session_files
WHERE session_id = ?
ORDER BY id
""", (SESSION,)).fetchall():
    print(row)

print("\n" + "=" * 80)
print("SESSION REFS")
print("=" * 80)

refs = conn.execute("""
SELECT *
FROM session_refs
WHERE session_id = ?
ORDER BY id
""", (SESSION,)).fetchall()

print("Count:", len(refs))

for row in refs:
    print(row)

print("\n" + "=" * 80)
print("CHECKPOINTS")
print("=" * 80)

try:
    checkpoints = conn.execute("""
    SELECT *
    FROM checkpoints
    WHERE session_id = ?
    ORDER BY checkpoint_number
    """, (SESSION,)).fetchall()

    columns = [
        x[1]
        for x in conn.execute(
            "PRAGMA table_info(checkpoints)"
        ).fetchall()
    ]

    print("Count:", len(checkpoints))

    for row in checkpoints:
        print("\n--- CHECKPOINT ---")
        for column, value in zip(columns, row):
            if value is not None:
                value_text = str(value)
                if any(
                    term in value_text.lower()
                    for term in terms
                ):
                    print(column + ":")
                    print(value_text[:5000])

except Exception as e:
    print("Checkpoint error:", e)

print("\n" + "=" * 80)
print("INTEGRITY")
print("=" * 80)
print(conn.execute("PRAGMA integrity_check").fetchone()[0])

conn.close()
