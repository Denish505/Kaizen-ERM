import sqlite3
import builtins

def main():
    con = sqlite3.connect('db.sqlite3')
    cur = con.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%department%'")
    tables = cur.fetchall()
    print("Found tables:", tables)
    for t in tables:
        table_name = t[0]
        print(f"\n--- Table: {table_name} ---")
        cur.execute(f"PRAGMA table_info({table_name})")
        cols = [col[1] for col in cur.fetchall()]
        print("Columns:", cols)
        
        cur.execute(f"SELECT * FROM {table_name}")
        rows = cur.fetchall()
        print(f"Rows ({len(rows)}):")
        for r in rows:
            print(dict(zip(cols, r)))
            
if __name__ == "__main__":
    main()
