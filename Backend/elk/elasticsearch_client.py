from elasticsearch import Elasticsearch
import os
import time
import logging
from urllib3.exceptions import NewConnectionError, MaxRetryError

logger = logging.getLogger(__name__)

ELASTICSEARCH_HOSTS = os.environ.get("ELASTICSEARCH_HOSTS")

# Define a connection with retry logic
def get_elasticsearch_client(max_retries=5, retry_interval=2):
    retries = 0
    while retries < max_retries:
        try:
            client = Elasticsearch(
                hosts=[ELASTICSEARCH_HOSTS],
                verify_certs=False,  # For local dev/self-signed certs
                ssl_show_warn=False,
                headers={"Accept": "application/json", "Content-Type": "application/json"},
                retry_on_timeout=True,
                max_retries=3,
                request_timeout=10
            )
            # Ping to verify connection
            if client.ping():
                logger.info(f"Successfully connected to Elasticsearch at {ELASTICSEARCH_HOSTS}")
                return client
        except (ConnectionError, NewConnectionError, MaxRetryError) as e:
            retries += 1
            if retries < max_retries:
                logger.warning(f"Connection to Elasticsearch failed (attempt {retries}/{max_retries}): {str(e)}")
                time.sleep(retry_interval)
            else:
                logger.error(f"Failed to connect to Elasticsearch after {max_retries} attempts: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error connecting to Elasticsearch: {str(e)}")
            break
    
    # Return None or a dummy client that gracefully handles failures
    return DummyElasticsearchClient()

# Dummy client that silently handles errors when Elasticsearch is unavailable
class DummyElasticsearchClient:
    """A fallback client that absorbs errors when Elasticsearch is unavailable"""
    def __getattr__(self, name):
        def dummy_method(*args, **kwargs):
            return None
        return dummy_method

# Try to get a real client, fall back to dummy if it fails
es = get_elasticsearch_client()
