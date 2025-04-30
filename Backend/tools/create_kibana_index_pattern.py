import requests
import time

KIBANA_URL = "http://kibana:5601"
INDEX_PATTERN_ID = "users"
INDEX_PATTERN_TITLE = "users-*"

def wait_for_kibana(timeout=180, interval=5):
    """Poll Kibana's status API until it reports `available` or timeout."""
    attempts = int(timeout / interval)
    for _ in range(attempts):
        try:
            r = requests.get(f"{KIBANA_URL}/api/status", timeout=3)
            if r.status_code == 200:
                data = r.json()
                level = (
                    data.get("status", {})
                    .get("overall", {})
                    .get("level", "unknown")
                )
                if level == "available":
                    return True
        except Exception:
            pass
        time.sleep(interval)
    return False

def create_index_pattern():
    headers = {
        "kbn-xsrf": "true",
        "Content-Type": "application/json"
    }
    payload = {
        "attributes": {
            "title": INDEX_PATTERN_TITLE,
            # If your documents have a timestamp field, specify it here
            # "timeFieldName": "@timestamp"
        }
    }
    resp = requests.post(
        f"{KIBANA_URL}/api/saved_objects/index-pattern/{INDEX_PATTERN_ID}",
        json=payload,
        headers=headers,
    )
    if resp.status_code not in (200, 409):
        raise RuntimeError(
            f"Failed to create index pattern: {resp.status_code} {resp.text}"
        )

    # Set as default index so Discover picks it up automatically
    default_payload = {"changes": {"defaultIndex": INDEX_PATTERN_ID}}
    r2 = requests.post(
        f"{KIBANA_URL}/api/kibana/settings",
        json=default_payload,
        headers=headers,
    )
    if r2.status_code not in (200, 201):
        print("Warning: could not set default index", r2.text)
    else:
        print("Index pattern ready and set as default.")

if __name__ == "__main__":
    if wait_for_kibana():
        create_index_pattern()
    else:
        print("Kibana did not become available in time.")
