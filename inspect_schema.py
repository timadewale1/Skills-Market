import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

conn = sqlite3.connect(db)

print("=" * 80)
print("ALL DATABASE TABLES / VIEWS / TRIGGERS")
print("=" * 80)

objects = conn.execute("""
SELECT type, name, tbl_name, sql
FROM sqlite_master
WHERE type IN ('table', 'view', 'trigger', 'index')
ORDER BY type, name
""").fetchall()

for obj_type, name, tbl_name, sql in objects:
    print("\n---")
    print("TYPE:", obj_type)
    print("NAME:", name)
    print("TABLE:", tbl_name)
    if sql:
        print(sql)

print("\n" + "=" * 80)
print("TABLE ROW COUNTS")
print("=" * 80)

tables = conn.execute("""
SELECT name
FROM sqlite_master
WHERE type = 'table'
AND name NOT LIKE 'sqlite_%'
ORDER BY name
""").fetchall()

for (table,) in tables:
    try:
        count = conn.execute(
            f'SELECT COUNT(*) FROM "{table}"'
        ).fetchone()[0]
        print(f"{table}: {count}")
    except Exception as e:
        print(f"{table}: ERROR {e}")

print("\n" + "=" * 80)
print("TARGET SESSION REFERENCES ACROSS TEXT COLUMNS")
print("=" * 80)

SESSION = "4dd287b7-71dc-4619-8fb8-82ba65b1e1ed"

for (table,) in tables:
    try:
        columns = conn.execute(
            f'PRAGMA table_info("{table}")'
        ).fetchall()

        text_columns = [
            col[1]
            for col in columns
            if col[2].upper() in (
                "TEXT",
                "VARCHAR",
                "CHAR",
                "CLOB"
            )
        ]

        if not text_columns:
            continue

        for column in text_columns:
            try:
                rows = conn.execute(
                    f'''
                    SELECT rowid, "{column}"
                    FROM "{table}"
                    WHERE "{column}" LIKE ?
                    ''',
                    (f"%{SESSION}%",)
                ).fetchall()

                if rows:
                    print(f"\nTABLE: {table}")
                    print(f"COLUMN: {column}")

                    for rowid, value in rows:
                        print("ROWID:", rowid)
                        print("VALUE:")
                        print(str(value)[:10000])

            except Exception:
                pass

print("\n" + "=" * 80)
print("TARGET SESSION ID AS BLOB")
print("=" * 80)

session_bytes = SESSION.encode("utf-8")

for (table,) in tables:
    try:
        columns = conn.execute(
            f'PRAGMA table_info("{table}")'
        ).fetchall()

        for col in columns:
            column = col[1]
            coltype = (col[2] or "").upper()

            if "BLOB" not in coltype:
                continue

            try:
                rows = conn.execute(
                    f'SELECT rowid, "{column}" FROM "{table}"'
                ).fetchall()

                for rowid, value in rows:
                    if value and session_bytes in value:
                        print(
                            f"FOUND SESSION ID IN BLOB: "
                            f"{table}.{column}, rowid={rowid}"
                        )

            except Exception:
                pass

    except Exception:
        pass

print("\n" + "=" * 80)
print("INTEGRITY")
print("=" * 80)

print(conn.execute("PRAGMA integrity_check").fetchone()[0])

conn.close()
