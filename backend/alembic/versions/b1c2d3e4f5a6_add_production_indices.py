"""add production indices

Revision ID: b1c2d3e4f5a6
Revises: 7a87ebb77c54
Create Date: 2026-09-08 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = '7a87ebb77c54'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Indices on hot query columns for dashboard/analytics performance
    op.create_index(op.f('ix_cves_risk_level'), 'cves', ['risk_level'], unique=False)
    op.create_index(op.f('ix_cves_risk_score'), 'cves', ['risk_score'], unique=False)
    op.create_index(op.f('ix_cves_priority'), 'cves', ['priority'], unique=False)
    op.create_index(op.f('ix_alerts_read'), 'alerts', ['read'], unique=False)
    op.create_index(op.f('ix_alerts_alert_type'), 'alerts', ['alert_type'], unique=False)
    op.create_index(op.f('ix_remediation_records_status'), 'remediation_records', ['status'], unique=False)
    op.create_index(op.f('ix_remediation_records_priority'), 'remediation_records', ['priority'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_remediation_records_priority'), table_name='remediation_records')
    op.drop_index(op.f('ix_remediation_records_status'), table_name='remediation_records')
    op.drop_index(op.f('ix_alerts_alert_type'), table_name='alerts')
    op.drop_index(op.f('ix_alerts_read'), table_name='alerts')
    op.drop_index(op.f('ix_cves_priority'), table_name='cves')
    op.drop_index(op.f('ix_cves_risk_score'), table_name='cves')
    op.drop_index(op.f('ix_cves_risk_level'), table_name='cves')
