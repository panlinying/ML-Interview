import os
from sqlalchemy import create_engine, text


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL") or os.environ.get("POSTGRES_URL")
    if not url:
        raise SystemExit("DATABASE_URL or POSTGRES_URL is required.")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


def run_migrations() -> None:
    statements = [
        """
        ALTER TABLE comments
        ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id);
        """,
        """
        CREATE INDEX IF NOT EXISTS comments_parent_id_idx
        ON comments(parent_id);
        """,
        """
        CREATE TABLE IF NOT EXISTS comment_votes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          comment_id INTEGER NOT NULL REFERENCES comments(id),
          vote INTEGER NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT uq_comment_vote_user UNIQUE (user_id, comment_id)
        );
        """,
        """
        CREATE INDEX IF NOT EXISTS comment_votes_comment_id_idx
        ON comment_votes(comment_id);
        """,
        """
        CREATE INDEX IF NOT EXISTS comment_votes_user_id_idx
        ON comment_votes(user_id);
        """,
    ]

    engine = create_engine(get_database_url(), pool_pre_ping=True)
    with engine.begin() as conn:
        for statement in statements:
            conn.execute(text(statement))

    print("Migrations complete.")


if __name__ == "__main__":
    run_migrations()
