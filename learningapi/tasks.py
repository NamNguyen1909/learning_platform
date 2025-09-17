from celery import shared_task
from .models import Document
from .services.document_ingestion import ingest_document

@shared_task
def ingest_document_task(document_id):
    try:
        doc = Document.objects.get(id=document_id)
        ingest_document(doc)
    except Document.DoesNotExist:
        pass