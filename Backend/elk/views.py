from django.http import JsonResponse
from .elasticsearch_client import es

def elasticsearch_test(request):
    index_name = "my-index"
    # Index a document and force refresh
    es.index(index=index_name, body={"title": "Hello", "content": "World"})
    es.indices.refresh(index=index_name)

    # Search for documents
    result = es.search(index=index_name, body={"query": {"match": {"title": "Hello"}}})

    hits = result['hits']['hits']
    if hits:
        return JsonResponse(hits[0]['_source'])
    else:
        return JsonResponse({"message": "No documents found."}, status=404)