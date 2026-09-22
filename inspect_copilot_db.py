import sqlite3

db = r"C:\Users\ADMIN\AppData\Roaming\Code\User\globalStorage\github.copilot-chat\session-store.db"

conn = sqlite3.connect(db)

rows = conn.execute("""
SELECT name, sql
FROM sqlite_master
WHERE name IN (
    'search_index',
    'search_index_content',
    'search_index_data',
    'search_index_docsize',
    'search_index_idx'
)
ORDER BY name
""").fetchall()

for name, sql in rows:
    print("\n==============================")
    print(name)
    print("==============================")
    print(sql)

conn.close()
