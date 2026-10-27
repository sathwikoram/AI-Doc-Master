"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ──────────────────────────────────────────────────────────────────
    op.create_table('users',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name',         sa.String(150),   nullable=False),
        sa.Column('email',             sa.String(255),   nullable=False),
        sa.Column('phone',             sa.String(20),    nullable=True),
        sa.Column('hashed_password',   sa.String(255),   nullable=False),
        sa.Column('role',              sa.Enum('citizen', 'advocate', 'admin', name='userrole'), nullable=False),
        sa.Column('profile_picture',   sa.String(500),   nullable=True),
        sa.Column('address',           sa.Text(),        nullable=True),
        sa.Column('is_active',         sa.Boolean(),     nullable=True, default=True),
        sa.Column('is_verified',       sa.Boolean(),     nullable=True, default=False),
        sa.Column('created_at',        sa.DateTime(),    nullable=True),
        sa.Column('updated_at',        sa.DateTime(),    nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_id',    'users', ['id'])

    # ── advocates ─────────────────────────────────────────────────────────────
    op.create_table('advocates',
        sa.Column('id',                  postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id',             postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bar_council_number',  sa.String(100),  nullable=False),
        sa.Column('license_number',      sa.String(100),  nullable=True),
        sa.Column('qualification',       sa.String(200),  nullable=True),
        sa.Column('years_of_experience', sa.Integer(),    nullable=True, default=0),
        sa.Column('practice_areas',      postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('court_location',      sa.String(200),  nullable=True),
        sa.Column('city',                sa.String(100),  nullable=True),
        sa.Column('state',               sa.String(100),  nullable=True),
        sa.Column('total_cases',         sa.Integer(),    nullable=True, default=0),
        sa.Column('won_cases',           sa.Integer(),    nullable=True, default=0),
        sa.Column('rating',              sa.Float(),      nullable=True, default=0.0),
        sa.Column('rating_count',        sa.Integer(),    nullable=True, default=0),
        sa.Column('is_verified',         sa.Boolean(),    nullable=True, default=False),
        sa.Column('is_available',        sa.Boolean(),    nullable=True, default=True),
        sa.Column('availability_note',   sa.Text(),       nullable=True),
        sa.Column('profile_bio',         sa.Text(),       nullable=True),
        sa.Column('languages',           postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('documents',           postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at',          sa.DateTime(),   nullable=True),
        sa.Column('updated_at',          sa.DateTime(),   nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bar_council_number'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_advocates_id', 'advocates', ['id'])

    # ── cases ─────────────────────────────────────────────────────────────────
    op.create_table('cases',
        sa.Column('id',                    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_number',           sa.String(50),   nullable=True),
        sa.Column('citizen_id',            postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('advocate_id',           postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('original_advocate_id',  postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('title',                 sa.String(300),  nullable=False),
        sa.Column('description',           sa.Text(),       nullable=False),
        sa.Column('category',              sa.String(100),  nullable=True),
        sa.Column('sub_category',          sa.String(100),  nullable=True),
        sa.Column('priority',              sa.Enum('low','medium','high','urgent', name='casepriority'), nullable=True),
        sa.Column('status',                sa.Enum('pending','ai_analyzed','lawyer_assigned','accepted',
                                                   'in_progress','hearing_scheduled','adjourned',
                                                   'closed_won','closed_lost','closed_settled','rejected',
                                                   name='casestatus'), nullable=True),
        sa.Column('ai_analysis',           postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('suggested_advocate_ids', postgresql.ARRAY(sa.String()), nullable=True),
        sa.Column('court_name',            sa.String(200),  nullable=True),
        sa.Column('court_location',        sa.String(200),  nullable=True),
        sa.Column('filing_date',           sa.DateTime(),   nullable=True),
        sa.Column('created_at',            sa.DateTime(),   nullable=True),
        sa.Column('updated_at',            sa.DateTime(),   nullable=True),
        sa.Column('closed_at',             sa.DateTime(),   nullable=True),
        sa.Column('is_urgent',             sa.Boolean(),    nullable=True, default=False),
        sa.Column('tags',                  postgresql.ARRAY(sa.String()), nullable=True),
        sa.ForeignKeyConstraint(['citizen_id'],           ['users.id'],     ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['advocate_id'],          ['advocates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['original_advocate_id'], ['advocates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_number'),
    )
    op.create_index('ix_cases_id', 'cases', ['id'])

    # ── case_documents ────────────────────────────────────────────────────────
    op.create_table('case_documents',
        sa.Column('id',            postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id',       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('uploaded_by',   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name',     sa.String(300),  nullable=False),
        sa.Column('file_url',      sa.String(500),  nullable=False),
        sa.Column('file_type',     sa.String(50),   nullable=True),
        sa.Column('file_size',     sa.Integer(),    nullable=True),
        sa.Column('document_type', sa.String(100),  nullable=True),
        sa.Column('extracted_text',sa.Text(),       nullable=True),
        sa.Column('ai_summary',    sa.Text(),       nullable=True),
        sa.Column('is_verified',   sa.Boolean(),    nullable=True, default=False),
        sa.Column('created_at',    sa.DateTime(),   nullable=True),
        sa.ForeignKeyConstraint(['case_id'],     ['cases.id'],    ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── case_notes ────────────────────────────────────────────────────────────
    op.create_table('case_notes',
        sa.Column('id',         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id',    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('author_id',  postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('content',    sa.Text(),    nullable=False),
        sa.Column('is_private', sa.Boolean(), nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['case_id'],   ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['author_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── hearings ──────────────────────────────────────────────────────────────
    op.create_table('hearings',
        sa.Column('id',                   postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id',              postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('advocate_id',          postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('scheduled_date',       sa.DateTime(),  nullable=False),
        sa.Column('court_name',           sa.String(200), nullable=True),
        sa.Column('court_room',           sa.String(100), nullable=True),
        sa.Column('judge_name',           sa.String(150), nullable=True),
        sa.Column('status',               sa.Enum('scheduled','completed','adjourned','cancelled',
                                                   name='hearingstatus'), nullable=True),
        sa.Column('outcome',              sa.Text(),      nullable=True),
        sa.Column('next_date',            sa.DateTime(),  nullable=True),
        sa.Column('advocate_present',     sa.Boolean(),   nullable=True),
        sa.Column('citizen_present',      sa.Boolean(),   nullable=True),
        sa.Column('replaced_advocate_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('replacement_reason',   sa.Text(),      nullable=True),
        sa.Column('notes',                sa.Text(),      nullable=True),
        sa.Column('created_at',           sa.DateTime(),  nullable=True),
        sa.Column('updated_at',           sa.DateTime(),  nullable=True),
        sa.ForeignKeyConstraint(['case_id'],              ['cases.id'],     ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['advocate_id'],          ['advocates.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['replaced_advocate_id'], ['advocates.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── appointments ──────────────────────────────────────────────────────────
    op.create_table('appointments',
        sa.Column('id',               postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('citizen_id',       postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('advocate_id',      postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id',          postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('scheduled_at',     sa.DateTime(),  nullable=False),
        sa.Column('duration_minutes', sa.String(10),  nullable=True, default='30'),
        sa.Column('mode',             sa.String(20),  nullable=True, default='in_person'),
        sa.Column('status',           sa.Enum('requested','confirmed','cancelled','completed','no_show',
                                               name='appointmentstatus'), nullable=True),
        sa.Column('notes',            sa.Text(),      nullable=True),
        sa.Column('citizen_notes',    sa.Text(),      nullable=True),
        sa.Column('meet_link',        sa.String(300), nullable=True),
        sa.Column('reminder_sent',    sa.Boolean(),   nullable=True, default=False),
        sa.Column('created_at',       sa.DateTime(),  nullable=True),
        sa.Column('updated_at',       sa.DateTime(),  nullable=True),
        sa.ForeignKeyConstraint(['citizen_id'],  ['users.id'],     ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['advocate_id'], ['advocates.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['case_id'],     ['cases.id'],     ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table('notifications',
        sa.Column('id',         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id',    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title',      sa.String(200),  nullable=False),
        sa.Column('message',    sa.Text(),       nullable=False),
        sa.Column('type',       sa.Enum('case_update','hearing_reminder','appointment',
                                         'advocate_assigned','document_request',
                                         'ai_suggestion','system', name='notificationtype'), nullable=True),
        sa.Column('meta',       postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('is_read',    sa.Boolean(),    nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(),   nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # ── chat_messages ─────────────────────────────────────────────────────────
    op.create_table('chat_messages',
        sa.Column('id',         postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id',    postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id',    postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('role',       sa.String(20),  nullable=False),
        sa.Column('content',    sa.Text(),      nullable=False),
        sa.Column('is_ai',      sa.Boolean(),   nullable=True, default=False),
        sa.Column('created_at', sa.DateTime(),  nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('chat_messages')
    op.drop_table('notifications')
    op.drop_table('appointments')
    op.drop_table('hearings')
    op.drop_table('case_notes')
    op.drop_table('case_documents')
    op.drop_table('cases')
    op.drop_table('advocates')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_id',    table_name='users')
    op.drop_table('users')
