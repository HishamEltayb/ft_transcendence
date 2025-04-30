from elasticsearch import Elasticsearch
import os

ELASTICSEARCH_HOSTS = os.environ.get("ELASTICSEARCH_HOSTS")
# ELASTICSEARCH_USER = os.environ.get("ELASTICSEARCH_USER", "elastic")
# ELASTICSEARCH_PASS = os.environ.get("ELASTICSEARCH_PASSWORD1", "elastic")




es = Elasticsearch(
    hosts=[ELASTICSEARCH_HOSTS],
    # basic_auth=(ELASTICSEARCH_USER, ELASTICSEARCH_PASS),
    verify_certs=False,  # For local dev/self-signed certs
    ssl_show_warn=False,
    headers={"Accept": "application/json", "Content-Type": "application/json"}
)
