import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

conn = sqlite3.connect(db)

print("=" * 80)
print("TABLES")
print("=" * 80)

tables = conn.execute("""
SELECT name
FROM sqlite_master
WHERE type IN ('table', 'view')
ORDER BY name
""").fetchall()

for (name,) in tables:
    print(name)

print("\n" + "=" * 80)
print("CHECKPOINTS FOR TARGET SESSION")
print("=" * 80)

try:
    rows = conn.execute("""
        SELECT *
        FROM checkpoints
        WHERE session_id = ?
        ORDER BY checkpoint_number
    """, (SESSION,)).fetchall()

    cols = [x[1] for x in conn.execute(
        "PRAGMA table_info(checkpoints)"
    ).fetchall()]

    print("Columns:", cols)
    print("Checkpoint count:", len(rows))

    for row in rows:
        print("\n--- CHECKPOINT ---")
        for col, value in zip(cols, row):
            if value is not None:
                text = str(value)
                print(f"{col}: {text[:3000]}")

except Exception as e:
    print("Checkpoint scan error:", e)

print("\n" + "=" * 80)
print("SEARCHING ALL TEXT COLUMNS FOR ATTACHMENT-RELATED TERMS")
print("=" * 80)

terms = [
    "vision_attachment_not_accessible",
    "attachment",
    "image/",
    "data:image",
    "Pasted text",
    "screenshot",
    "image"
]

for table, in tables:
    # Skip FTS shadow tables because their contents are managed internally.
    if table.startswith("search_index_"):
        continue

    try:
        columns = conn.execute(
            f'PRAGMA table_info("{table}")'
        ).fetchall()

        text_columns = [
            col[1] for col in columns
            if col[2] and any(x in col[2].upper() for x in ["TEXT", "CHAR", "CLOB"])
        ]

        if not text_columns:
            continue

        for column in text_columns:
            for term in terms:
                try:
                    query = f'''
                        SELECT rowid, "{column}"
                        FROM "{table}"
                        WHERE "{column}" LIKE ?
                        LIMIT 10
                    '''

                    matches = conn.execute(
                        query, (f"%{term}%",)
                    ).fetchall()

                    if matches:
                        print(
                            f"\nFOUND: table={table}, column={column}, term={term}"
                        )

                        for rowid, value in matches:
                            text = str(value)
                            print("ROWID:", rowid)
                            print("VALUE:", text[:5000])

                except Exception:
                    pass

    except Exception:
        pass

print("\n" + "=" * 80)
print("INTEGRITY")
print("=" * 80)
print(conn.execute("PRAGMA integrity_check").fetchone()[0])

conn.close()
