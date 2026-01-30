"""Custom Flask CLI commands for database lifecycle."""
import random
from decimal import Decimal

import click

from .core.database import Base, engine, session_scope
from .core.security import hash_password
from .models import Aluno, Nota, Usuario, Tenant, AcademicYear
from .services.accounts import ensure_aluno_user


TURMAS = [
    ("6º A", "Matutino"),
    ("7º B", "Vespertino"),
    ("8º C", "Noturno"),
]
DISCIPLINAS = [
    "Matemática",
    "Língua Portuguesa",
    "Ciências",
    "História",
    "Geografia",
]


def register_cli(app):
    @app.cli.command("init-db")
    def init_db_command():
        """Create database tables using SQLAlchemy metadata."""
        Base.metadata.create_all(bind=engine)
        click.secho("Database schema initialized.", fg="green")

    @app.cli.command("drop-db")
    def drop_db_command():
        """Drop all database tables."""
        if click.confirm("This will delete ALL data. Continue?", abort=True):
            Base.metadata.drop_all(bind=engine)
            click.secho("Database schema dropped.", fg="red")

    @app.cli.command("seed-demo")
    def seed_demo_command():
        """Populate the database with demo data for local development."""
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            # Create default Tenant and Academic Year
            tenant = session.query(Tenant).filter(Tenant.slug == "default").first()
            if not tenant:
                tenant = Tenant(name="Escola ColaboraFREI", slug="default")
                session.add(tenant)
                session.flush()

            year = session.query(AcademicYear).filter(AcademicYear.tenant_id == tenant.id, AcademicYear.label == "2026").first()
            if not year:
                year = AcademicYear(tenant_id=tenant.id, label="2026", is_current=True)
                session.add(year)
                session.flush()

            if session.query(Aluno).count() > 0:
                click.secho("Demo data already exists, skipping seeding.", fg="yellow")
                return

            alunos: list[Aluno] = []
            for idx, (turma, turno) in enumerate(TURMAS, start=1):
                for seq in range(1, 9):
                    aluno = Aluno(
                        matricula=f"{idx}{seq:03}",
                        nome=f"Aluno {turma} #{seq}",
                        turma=turma,
                        turno=turno,
                        tenant_id=tenant.id,
                        academic_year_id=year.id,
                    )
                    session.add(aluno)
                    alunos.append(aluno)
            session.flush()

            for aluno in alunos:
                ensure_aluno_user(session, aluno)

            for aluno in alunos:
                for disciplina in DISCIPLINAS:
                    notas = [Decimal(str(random.uniform(12, 18))) for _ in range(3)]
                    total = sum(notas) / len(notas)
                    session.add(
                        Nota(
                            aluno_id=aluno.id,
                            disciplina=disciplina,
                            disciplina_normalizada=disciplina.upper(),
                            trimestre1=notas[0],
                            trimestre2=notas[1],
                            trimestre3=notas[2],
                            total=total,
                            faltas=random.randint(0, 10),
                            situacao="APR" if total >= 14 else "REC",
                            tenant_id=tenant.id,
                            academic_year_id=year.id,
                        )
                    )

            click.secho("Demo data seeded (includes admin/admin).", fg="green")

    @app.cli.command("create-superadmin")
    @click.option("--username", default="superadmin", help="Super Admin username")
    @click.option("--password", default="superadmin", help="Super Admin password")
    def create_superadmin_command(username, password):
        """Create a super admin user."""
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            admin = session.query(Usuario).filter(Usuario.username == username).first()
            if not admin:
                admin = Usuario(
                    username=username,
                    password_hash=hash_password(password),
                    role="super_admin",
                    is_admin=True,
                    tenant_id=None
                )
                session.add(admin)
                click.secho(f"Super Admin user '{username}' created with password '{password}'.", fg="green")
            else:
                admin.password_hash = hash_password(password)
                click.secho(f"Super Admin user '{username}' updated with password '{password}'.", fg="yellow")

    @app.cli.command("create-admin")
    @click.option("--username", default="admin", help="Admin username")
    @click.option("--password", default="admin", help="Admin password")
    def create_admin_command(username, password):
        """Create an admin user and default tenant/year if they don't exist."""
        Base.metadata.create_all(bind=engine)
        with session_scope() as session:
            tenant = session.query(Tenant).filter(Tenant.slug == "default").first()
            if not tenant:
                tenant = Tenant(name="Escola ColaboraFREI", slug="default")
                session.add(tenant)
                session.flush()
                click.echo(f"Tenant 'default' created.")

            year = session.query(AcademicYear).filter(AcademicYear.tenant_id == tenant.id, AcademicYear.label == "2026").first()
            if not year:
                year = AcademicYear(tenant_id=tenant.id, label="2026", is_current=True)
                session.add(year)
                session.flush()
                click.echo(f"Academic year '2026' created.")

            admin = session.query(Usuario).filter(Usuario.username == username).first()
            if not admin:
                admin = Usuario(
                    username=username,
                    password_hash=hash_password(password),
                    role="admin",
                    is_admin=True,
                    tenant_id=tenant.id
                )
                session.add(admin)
                click.secho(f"Admin user '{username}' created with password '{password}'.", fg="green")
            else:
                click.secho(f"User '{username}' already exists.", fg="yellow")

    @app.cli.command("reprocess-pdfs")
    def reprocess_pdfs_command():
        """Reprocess all PDFs in the upload folder."""
        from pathlib import Path
        from .core.config import settings
        from .services.ingestion import enqueue_pdf
        from .models import Tenant
        
        upload_path = Path(settings.upload_folder)
        if not upload_path.exists():
            click.echo("Cloud uploads folder not found.")
            return

        with session_scope() as session:
            tenant = session.query(Tenant).filter(Tenant.slug == "default").first()
            if not tenant:
                click.echo("Default tenant not found.")
                return
            
            count = 0
            # glob matches recursively
            for pdf_file in upload_path.rglob("*.pdf"):
                # Guess turno/turma from path if possible (assumes /data/uploads/TURNO/TURMA/file.pdf)
                rel_path = pdf_file.relative_to(upload_path)
                parts = rel_path.parts
                
                turno = parts[0] if len(parts) >= 2 else None
                turma = parts[1] if len(parts) >= 3 else None
                
                enqueue_pdf(pdf_file, turno=turno, turma=turma, tenant_id=tenant.id)
                count += 1
                click.echo(f"Enqueued: {rel_path}")
            
            click.secho(f"Enqueued {count} files for reprocessing.", fg="green")
