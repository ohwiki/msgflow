"""Feishu OAuth — one-time authorization to get user_access_token."""
from __future__ import annotations

import json
import sys
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode

from pycore import env, logger
from pycore.http import post as http_post, HttpError

log = logger("feishu.oauth")

APP_ID = env("FEISHU_APP_ID")
APP_SECRET = env("FEISHU_APP_SECRET")
REDIRECT_URI = "http://localhost:9999/callback"
TOKEN_FILE = str(__import__("pathlib").Path.home() / ".feishu_token.json")

auth_code: str | None = None


class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        global auth_code
        query = parse_qs(urlparse(self.path).query)
        auth_code = query.get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<h1>OK</h1><p>Authorization successful. You can close this tab.</p>")

    def log_message(self, format: str, *args: object) -> None:
        pass


def get_auth_url() -> str:
    params = urlencode({
        "app_id": APP_ID,
        "redirect_uri": REDIRECT_URI,
        "state": "msgflow",
        "scope": "docx:document:readonly wiki:wiki:readonly docs:document.media:download",
    })
    return f"https://open.feishu.cn/open-apis/authen/v1/authorize?{params}"


def exchange_code(code: str) -> None:
    """Exchange authorization code for user_access_token."""
    try:
        # Get app_access_token
        app_resp = http_post(
            "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
            json={"app_id": APP_ID, "app_secret": APP_SECRET},
            timeout=10,
        )
        app_token = app_resp.json().get("app_access_token")
        if not app_token:
            log.error("Failed to get app_access_token")
            sys.exit(1)

        # Exchange code for user token
        resp = http_post(
            "https://open.feishu.cn/open-apis/authen/v1/oidc/access_token",
            json={"grant_type": "authorization_code", "code": code},
            headers={"Authorization": f"Bearer {app_token}"},
            timeout=10,
        )
        data = resp.json()
    except HttpError as e:
        log.error("Token exchange failed", status=e.status)
        sys.exit(1)

    if data.get("code") != 0:
        log.error("Token exchange error", msg=data.get("msg"))
        sys.exit(1)

    token_data = data["data"]
    save_token(token_data)
    log.info("Authorization successful", expires_in=token_data.get("expires_in", 0))
    print(f"✅ Authorization successful!")
    print(f"   user_access_token expires in {token_data.get('expires_in', 0)}s")
    print(f"   refresh_token expires in {token_data.get('refresh_expires_in', 0)}s")
    print(f"   Saved to {TOKEN_FILE}")


def save_token(data: dict) -> None:
    with open(TOKEN_FILE, "w") as f:
        json.dump(data, f, indent=2)


def main() -> None:
    if not APP_ID or not APP_SECRET:
        log.error("FEISHU_APP_ID and FEISHU_APP_SECRET must be set")
        sys.exit(1)

    url = get_auth_url()
    print(f"Opening browser for authorization...")
    print(f"If browser doesn't open, visit:\n{url}\n")
    webbrowser.open(url)

    print("Waiting for callback on localhost:9999...")
    server = HTTPServer(("localhost", 9999), CallbackHandler)
    server.handle_request()

    if auth_code:
        print("Got authorization code, exchanging for token...")
        exchange_code(auth_code)
    else:
        log.error("No authorization code received")
        sys.exit(1)


if __name__ == "__main__":
    main()
