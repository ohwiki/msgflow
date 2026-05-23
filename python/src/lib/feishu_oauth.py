"""Feishu OAuth — one-time authorization to get user_access_token."""

import json
import os
import sys
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode

APP_ID = os.environ.get("FEISHU_APP_ID", "cli_aa9b29dea0b89bd0")
APP_SECRET = os.environ.get("FEISHU_APP_SECRET", "wZXRoMjzEtYoMQrdIwGOlt72m8tPnYJi")
REDIRECT_URI = "http://localhost:9999/callback"
TOKEN_FILE = os.path.expanduser("~/.feishu_token.json")

auth_code = None


class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        query = parse_qs(urlparse(self.path).query)
        auth_code = query.get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(b"<h1>OK</h1><p>Authorization successful. You can close this tab.</p>")

    def log_message(self, format, *args):
        pass  # Suppress logs


def get_auth_url():
    params = urlencode({
        "app_id": APP_ID,
        "redirect_uri": REDIRECT_URI,
        "state": "msgflow",
        "scope": "docx:document:readonly wiki:wiki:readonly docs:document.media:download",
    })
    return f"https://open.feishu.cn/open-apis/authen/v1/authorize?{params}"


def exchange_code(code):
    import urllib.request
    body = json.dumps({
        "grant_type": "authorization_code",
        "code": code,
    }).encode()

    # First get app_access_token
    app_body = json.dumps({"app_id": APP_ID, "app_secret": APP_SECRET}).encode()
    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
        data=app_body, headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        app_token = json.loads(resp.read())["app_access_token"]

    # Exchange code for user token
    req = urllib.request.Request(
        "https://open.feishu.cn/open-apis/authen/v1/oidc/access_token",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {app_token}",
        },
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())

    if data.get("code") != 0:
        print(f"Error: {data.get('msg')}")
        sys.exit(1)

    token_data = data["data"]
    save_token(token_data)
    print(f"✅ Authorization successful!")
    print(f"   user_access_token expires in {token_data.get('expires_in', 0)}s")
    print(f"   refresh_token expires in {token_data.get('refresh_expires_in', 0)}s")
    print(f"   Saved to {TOKEN_FILE}")


def save_token(data):
    with open(TOKEN_FILE, "w") as f:
        json.dump(data, f, indent=2)


def main():
    url = get_auth_url()
    print(f"Opening browser for authorization...")
    print(f"If browser doesn't open, visit:\n{url}\n")
    webbrowser.open(url)

    print("Waiting for callback on localhost:9999...")
    server = HTTPServer(("localhost", 9999), CallbackHandler)
    server.handle_request()

    if auth_code:
        print(f"Got authorization code, exchanging for token...")
        exchange_code(auth_code)
    else:
        print("Error: No authorization code received")
        sys.exit(1)


if __name__ == "__main__":
    main()
