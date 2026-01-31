from loguru import logger
from ..core.database import session_scope
from ..models import Ocorrencia, Aluno
from ..services.communication_service import CommunicationService

def notify_occurrence_task(ocorrencia_id: int):
    """Background task to send occurrence notifications via Email and WhatsApp."""
    logger.info(f"Starting notification task for occurrence {ocorrencia_id}")
    
    with session_scope() as session:
        occurrence = session.get(Ocorrencia, ocorrencia_id)
        if not occurrence:
            logger.error(f"Occurrence {ocorrencia_id} not found.")
            return

        aluno = occurrence.aluno
        if not aluno:
            logger.error(f"Student not linked to occurrence {ocorrencia_id}")
            return

        # Prepare message
        tipo_label = occurrence.tipo.capitalize()
        data_str = occurrence.data_registro.strftime("%d/%m/%Y")
        
        subject = f"🔔 Comunicado Escolar - {tipo_label}: {aluno.nome}"
        
        severity_label = occurrence.gravidade.capitalize() if occurrence.gravidade else "Leve"
        
        message_body = (
            f"Prezados Pais/Responsáveis,\n\n"
            f"Informamos o registro de uma ocorrência para o aluno(a) {aluno.nome}.\n\n"
            f"📅 Data: {data_str}\n"
            f"📝 Tipo: {tipo_label}\n"
            f"⚠️ Gravidade: {severity_label}\n"
            f"📄 Descrição: {occurrence.descricao}\n"
        )
        
        if occurrence.observacao_pais:
            message_body += f"\n💡 Observação/Ação Necessária: {occurrence.observacao_pais}\n"
            
        message_body += (
            f"\nCaso julguem necessário, favor comparecer à escola para maiores esclarecimentos.\n\n"
            f"Atenciosamente,\n"
            f"Coordenação Pedagógica - ColaboraFREI"
        )

        status_email = False
        status_whatsapp = False

        # Send Email
        if aluno.email:
            status_email = CommunicationService.send_email(
                to_email=aluno.email,
                subject=subject,
                body=message_body
            )
        
        # Send WhatsApp
        if aluno.telefones:
            status_whatsapp = CommunicationService.send_whatsapp(
                phone=aluno.telefones,
                message=message_body
            )

        # Update Ocorrencia status
        if status_email or status_whatsapp:
            occurrence.notificacao_status = "Enviado"
            if not status_email and aluno.email:
                 occurrence.notificacao_status = "Erro (Email)"
            if not status_whatsapp and aluno.telefones:
                  occurrence.notificacao_status = "Erro (WhatsApp)"
        else:
            occurrence.notificacao_status = "Falha"
            
        session.add(occurrence)
        session.commit()
        logger.info(f"Notification task for occurrence {ocorrencia_id} finished. Status: {occurrence.notificacao_status}")
