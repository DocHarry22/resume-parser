"""Offline stdlib regression tests: probe retries never conceal other failures."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest.mock import Mock, patch
from email.message import Message
import urllib.error

spec = importlib.util.spec_from_file_location("low_memory_smoke", Path(__file__).with_name("low-memory-smoke.py"))
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class Response(io.BytesIO):
    def __init__(self, status=200, body=b"ok", headers=None):
        super().__init__(body)
        self.status = status
        self.headers = Message()
        for key, value in (headers or {}).items():
            self.headers[key] = value


def busy(retry_after="10", detail=probe.BUSY_DETAIL):
    headers = Message()
    if retry_after is not None:
        headers["Retry-After"] = retry_after
    return urllib.error.HTTPError("http://127.0.0.1/api/exports/resume/pdf", 429, "busy", headers,
                                  io.BytesIO(json.dumps({"detail": detail}).encode()))


class BackpressureTests(unittest.TestCase):
    def session(self, *responses):
        session = probe.Session("http://127.0.0.1:18002")
        session.opener = Mock()
        session.opener.open.side_effect = responses
        return session

    def test_busy_then_success_closes_response_honors_delay_and_replays_body(self):
        rejected, success = busy(), Response()
        session = self.session(rejected, success)
        with patch.object(probe.time, "sleep") as sleep:
            sleep.side_effect = lambda seconds: self.assertTrue(rejected.closed)
            body, _, _ = session.request("/api/exports/resume/pdf", method="POST", data={"summary": "fixture"})
        self.assertEqual(body, b"ok")
        sleep.assert_called_once_with(10)
        calls = session.opener.open.call_args_list
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0].args[0].data, calls[1].args[0].data)
        self.assertEqual(session.backpressure_retries, [{"method": "POST", "path": "/api/exports/resume/pdf",
            "status": 429, "retry": 1, "retryAfterSeconds": 10}])

    def test_persistent_busy_fails_after_two_retries_and_records_them(self):
        session = self.session(busy(), busy(), busy(), Response())
        with patch.object(probe.time, "sleep") as sleep:
            with self.assertRaisesRegex(AssertionError, "busy retries=2, waited=20s"):
                session.request("/api/exports/resume/pdf", method="POST")
        self.assertEqual(sleep.call_count, 2)
        self.assertEqual(session.opener.open.call_count, 3)
        self.assertEqual(len(session.backpressure_retries), 2)

    def test_total_wait_cap_does_not_shorten_retry_after(self):
        session = self.session(busy("20"), busy("20"), Response())
        with patch.object(probe.time, "sleep") as sleep:
            with self.assertRaisesRegex(AssertionError, "busy retries=1, waited=20s"):
                session.request("/api/exports/resume/pdf", method="POST")
        sleep.assert_called_once_with(20)

    def test_missing_invalid_or_oversized_retry_after_fails_without_retry(self):
        for value in (None, "", "0", "-1", "1.5", "tomorrow", "31", "100", " 10"):
            with self.subTest(value=value):
                session = self.session(busy(value), Response())
                with patch.object(probe.time, "sleep") as sleep, self.assertRaises(AssertionError):
                    session.request("/api/exports/resume/pdf", method="POST")
                sleep.assert_not_called()
                self.assertEqual(session.backpressure_retries, [])

    def test_quota_or_malformed_429_and_other_failures_are_not_retried(self):
        for response in (busy(detail="Rate limit exceeded"), Response(429, b"not json", {"Retry-After": "10"}),
                         Response(500), Response(413), Response(422)):
            with self.subTest(status=response.status):
                session = self.session(response, Response())
                with patch.object(probe.time, "sleep") as sleep, self.assertRaises(AssertionError):
                    session.request("/api/exports/resume/pdf", method="POST")
                sleep.assert_not_called()

    def test_unknown_or_persistent_routes_and_get_are_never_replayed(self):
        for path, method in (("/api/builder/create", "POST"), ("/api/workspace", "POST"),
                             ("/api/unknown", "POST"), ("/api/exports/resume/pdf", "GET")):
            with self.subTest(path=path, method=method):
                session = self.session(busy(), Response())
                with patch.object(probe.time, "sleep") as sleep, self.assertRaises(AssertionError):
                    session.request(path, method=method)
                sleep.assert_not_called()

    def test_expected_429_is_returned_without_retry(self):
        session = self.session(busy())
        with patch.object(probe.time, "sleep") as sleep:
            body, _, _ = session.request("/api/exports/resume/pdf", method="POST", expected=429)
        self.assertEqual(json.loads(body)["detail"], probe.BUSY_DETAIL)
        sleep.assert_not_called()

    def test_size_cap_request_can_wait_but_must_still_return_expected_422(self):
        for status in (422, 200):
            with self.subTest(final_status=status):
                session = self.session(busy(), Response(status, b'{"detail":"fixture cap"}'))
                with patch.object(probe.time, "sleep") as sleep:
                    if status == 422:
                        body, _, _ = session.request("/api/parse-resume", method="POST", expected=422)
                        self.assertEqual(json.loads(body)["detail"], "fixture cap")
                    else:
                        with self.assertRaisesRegex(AssertionError, "200, expected 422"):
                            session.request("/api/parse-resume", method="POST", expected=422)
                sleep.assert_called_once_with(10)

    def test_cookie_on_busy_response_fails_before_retry(self):
        response = busy()
        response.headers["Set-Cookie"] = "unexpected=1"
        session = self.session(response)
        with patch.object(probe.time, "sleep") as sleep, self.assertRaisesRegex(AssertionError, "cookie"):
            session.request("/api/exports/resume/pdf", method="POST")
        sleep.assert_not_called()


if __name__ == "__main__":
    unittest.main()
