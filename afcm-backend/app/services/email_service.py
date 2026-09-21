import logging
import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

log = logging.getLogger("afcm.email")


def send_email(to: str, subject: str, body: str) -> None:
    """Sends through SMTP when SMTP_HOST is set. Otherwise logs the message (handy in development)."""
    settings = get_settings()
    if not settings.smtp_host:
        log.warning("SMTP is not configured. Email to %s not sent.\nSubject: %s\n%s", to, subject, body)
        return

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_use_tls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    except (smtplib.SMTPException, OSError):
        # The API always answers the same way for forgot-password, so never surface mail failures to the caller.
        log.exception("Could not send email to %s", to)
