import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL configuration - defaults to SQLite for local development, PostgreSQL for production
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./insurance.db")

# Fix Heroku/Render/AWS postgres:// prefix to postgresql:// for SQLAlchemy 2.0
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI Dependency for database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables and seed essential initial records."""
    import models_insurance  # noqa: F401
    Base.metadata.create_all(bind=engine)
    
    # Safe SQLite column migration for insurance_policies and insurance_claims
    if "sqlite" in DATABASE_URL:
        import sqlite3
        db_file = DATABASE_URL.replace("sqlite:///", "")
        if os.path.exists(db_file):
            try:
                con = sqlite3.connect(db_file)
                cursor = con.cursor()
                
                # Check policies columns
                cursor.execute("PRAGMA table_info(insurance_policies)")
                policy_cols = [r[1] for r in cursor.fetchall()]
                policy_additions = [
                    ("deductible", "REAL DEFAULT 5000.0"),
                    ("copay_percentage", "REAL DEFAULT 10.0"),
                    ("remaining_coverage", "REAL DEFAULT 450000.0"),
                    ("network_hospitals", "TEXT DEFAULT 'Apollo Multi-Specialty Hospital, Fortis Healthcare, Max Healthcare, Manipal Hospitals'")
                ]
                for col_name, col_def in policy_additions:
                    if col_name not in policy_cols:
                        cursor.execute(f"ALTER TABLE insurance_policies ADD COLUMN {col_name} {col_def}")

                # Check claims columns
                cursor.execute("PRAGMA table_info(insurance_claims)")
                claim_cols = [r[1] for r in cursor.fetchall()]
                claim_additions = [
                    ("patient_id_number", "TEXT"),
                    ("policyholder_name", "TEXT"),
                    ("admission_date", "TEXT"),
                    ("discharge_date", "TEXT"),
                    ("approved_amount", "REAL DEFAULT 0.0"),
                    ("settlement_reference", "TEXT"),
                    ("payment_date", "TEXT"),
                    ("expense_breakdown", "TEXT"),
                    ("requested_documents_note", "TEXT"),
                    ("rejection_reason", "TEXT"),
                    ("appeal_notes", "TEXT"),
                    ("is_ai_report_attached", "INTEGER DEFAULT 0"),
                    ("ai_report_id", "TEXT"),
                    ("ai_report_summary", "TEXT"),
                    ("idempotency_key", "TEXT")
                ]
                for col_name, col_def in claim_additions:
                    if col_name not in claim_cols:
                        cursor.execute(f"ALTER TABLE insurance_claims ADD COLUMN {col_name} {col_def}")

                con.commit()
                con.close()
            except Exception as e:
                print(f"Notice: SQLite migration info: {e}")

    # Ensure private uploads directory exists
    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads", "insurance")
    os.makedirs(upload_dir, exist_ok=True)

