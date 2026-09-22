import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"
TURN_INDEX = 32
TURN_ID = 378
SOURCE_ID = f"{SESSION}:turn:{TURN_INDEX}"

conn = sqlite3.connect(db)

try:
    # Verify the exact target.
    turn = conn.execute("""
        SELECT id, session_id, turn_index, timestamp, user_message
        FROM turns
        WHERE id = ?
          AND session_id = ?
          AND turn_index = ?
    """, (TURN_ID, SESSION, TURN_INDEX)).fetchone()

    if not turn:
        raise RuntimeError("Turn 32 was not found. Nothing was changed.")

    print("TARGET TURN:")
    print(turn)

    # Find its FTS5 record.
    fts = conn.execute("""
        SELECT rowid, source_id
        FROM search_index
        WHERE source_id = ?
    """, (SOURCE_ID,)).fetchall()

    print("\nFTS RECORD:")
    print(fts)

    conn.execute("BEGIN")

    # Remove the FTS record through the FTS5 virtual table.
    for row in fts:
        conn.execute(
            "DELETE FROM search_index WHERE rowid = ?",
            (row[0],)
        )

    # Remove ONLY turn 32.
    deleted = conn.execute("""
        DELETE FROM turns
        WHERE id = ?
          AND session_id = ?
          AND turn_index = ?
    """, (TURN_ID, SESSION, TURN_INDEX)).rowcount

    if deleted != 1:
        raise RuntimeError(
            f"Expected 1 deleted turn, got {deleted}"
        )

    conn.commit()

    print("\nDeletion committed.")

    # Verify turn 32 is gone.
    check = conn.execute("""
        SELECT id, turn_index, timestamp, user_message
        FROM turns
        WHERE session_id = ?
          AND turn_index = ?
    """, (SESSION, TURN_INDEX)).fetchall()

    print("\nTURN 32 AFTER DELETE:")
    print(check)

    # Verify FTS record is gone.
    fts_check = conn.execute("""
        SELECT rowid, source_id
        FROM search_index
        WHERE source_id = ?
    """, (SOURCE_ID,)).fetchall()

    print("\nFTS RECORD AFTER DELETE:")
    print(fts_check)

    # Verify surrounding turns.
    neighbors = conn.execute("""
        SELECT id, turn_index, timestamp, substr(user_message, 1, 120)
        FROM turns
        WHERE session_id = ?
          AND turn_index IN (31, 33, 35)
        ORDER BY turn_index
    """, (SESSION,)).fetchall()

    print("\nNEIGHBORING TURNS:")
    for row in neighbors:
        print(row)

    # Verify database integrity.
    integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]

    print("\nDATABASE INTEGRITY:")
    print(integrity)

finally:
    conn.close()
