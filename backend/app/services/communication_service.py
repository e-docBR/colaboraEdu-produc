import requests
from flask import current_app
from flask_mail import Mail, Message
from loguru import logger
from ..core.config import settings

# Initialize Mail lazily or via app factory
mail = Mail()

class CommunicationService:
    @staticmethod
    def send_email(to_email: str, subject: str, body: str):
        """Sends an email using Flask-Mail."""
        if not to_email:
            logger.warning("No recipient email provided.")
            return False
            
        try:
            msg = Message(
                subject=subject,
                recipients=[to_email],
                body=body,
                sender=settings.smtp_from
            )
            mail.send(msg)
            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    @staticmethod
    def send_whatsapp(phone: str, message: str):
        """Sends a WhatsApp message via an external API (e.g., Evolution API)."""
        if not phone or not settings.whatsapp_api_url:
            logger.warning("Phone number or WhatsApp API URL missing.")
            return False
            
        # Clean phone number (remove non-digits)
        clean_phone = "".join(filter(str.isdigit, phone))
        
        # Assume a standard Evolution API / Z-API structure
        url = f"{settings.whatsapp_api_url}/message/sendText/{settings.whatsapp_instance}"
        headers = {
            "apikey": settings.whatsapp_api_token,
            "Content-Type": "application/json"
        }
        payload = {
            "number": clean_phone,
            "text": message
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            logger.info(f"WhatsApp message sent to {clean_phone}")
            return True
        except Exception as e:
            logger.error(f"Failed to send WhatsApp to {clean_phone}: {e}")
            return False
