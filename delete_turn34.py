import sqlite3
import os

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"
TURN_INDEX = 34
TURN_ID = 380
SOURCE_ID = f"{SESSION}:turn:{TURN_INDEX}"

conn = sqlite3.connect(db)
conn.execute("PRAGMA foreign_keys = ON")

try:
    # Verify the exact turn before touching anything.
    turn = conn.execute("""
        SELECT id, session_id, turn_index, user_message
        FROM turns
        WHERE id = ?
          AND session_id = ?
          AND turn_index = ?
    """, (TURN_ID, SESSION, TURN_INDEX)).fetchone()

    if not turn:
        raise RuntimeError("Target turn 34 was not found. Nothing was changed.")

    print("TARGET TURN FOUND:")
    print(turn)

    # Find the corresponding FTS document.
    fts = conn.execute("""
        SELECT rowid, content, session_id, source_type, source_id
        FROM search_index
        WHERE source_id = ?
    """, (SOURCE_ID,)).fetchall()

    print("\nFTS RECORDS FOUND:")
    for row in fts:
        print(row)

    conn.execute("BEGIN")

    # Delete the FTS record through the virtual table.
    # This lets SQLite maintain all FTS5 shadow tables correctly.
    for row in fts:
        conn.execute("""
            DELETE FROM search_index
            WHERE rowid = ?
        """, (row[0],))

    # Delete ONLY the problematic turn.
    deleted = conn.execute("""
        DELETE FROM turns
        WHERE id = ?
          AND session_id = ?
          AND turn_index = ?
    """, (TURN_ID, SESSION, TURN_INDEX)).rowcount

    if deleted != 1:
        raise RuntimeError(
            f"Expected to delete exactly 1 turn, but deleted {deleted}."
        )

    conn.commit()

    print("\nDeletion committed successfully.")

    # Verify turn 34 is gone.
    remaining = conn.execute("""
        SELECT id, session_id, turn_index, user_message
        FROM turns
        WHERE id = ?
           OR (session_id = ? AND turn_index = ?)
    """, (TURN_ID, SESSION, TURN_INDEX)).fetchall()

    print("\nTARGET TURN AFTER DELETE:")
    print(remaining)

    # Verify FTS reference is gone.
    remaining_fts = conn.execute("""
        SELECT rowid, content, session_id, source_type, source_id
        FROM search_index
        WHERE source_id = ?
    """, (SOURCE_ID,)).fetchall()

    print("\nFTS RECORD AFTER DELETE:")
    print(remaining_fts)

    # Verify neighboring turns still exist.
    neighbors = conn.execute("""
        SELECT id, turn_index, substr(user_message, 1, 100)
        FROM turns
        WHERE session_id = ?
          AND turn_index IN (33, 35)
        ORDER BY turn_index
    """, (SESSION,)).fetchall()

    print("\nNEIGHBORING TURNS:")
    for row in neighbors:
        print(row)

    # Database integrity check.
    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]

    print("\nDATABASE INTEGRITY CHECK:")
    print(integrity)

finally:
    conn.close()
