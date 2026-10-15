"""Bounded readiness checks for local test fixtures."""
import time
import urllib.request
end = time.monotonic() + 90
pending = {"http://127.0.0.1:8001/api/health", "http://127.0.0.1:3000"}
while pending and time.monotonic() < end:
    for address in tuple(pending):
        try:
            with urllib.request.urlopen(address, timeout=2) as response:
                if response.status == 200:
                    pending.remove(address)
        except (OSError, TimeoutError):
            pass
    if pending:
        time.sleep(1)
if pending:
    raise SystemExit("Fixture readiness failed: " + ", ".join(sorted(pending)))
print("Frontend and resume API are ready.")
