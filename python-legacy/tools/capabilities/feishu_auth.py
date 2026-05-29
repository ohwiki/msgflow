"""飞书 tenant_access_token 获取（共享）"""
import os
import requests

FEISHU_API_BASE = "https://open.feishu.cn/open-apis"


def get_tenant_access_token():
    app_id = os.environ.get("FEISHU_APP_ID")
    app_secret = os.environ.get("FEISHU_APP_SECRET")
    if not app_id or not app_secret:
        return None, "环境变量 FEISHU_APP_ID 或 FEISHU_APP_SECRET 未设置"
    resp = requests.post(f"{FEISHU_API_BASE}/auth/v3/tenant_access_token/internal",
                         json={"app_id": app_id, "app_secret": app_secret})
    data = resp.json()
    if data.get("code") != 0:
        return None, f"获取 token 失败: {data.get('msg', resp.text)}"
    return data["tenant_access_token"], None
