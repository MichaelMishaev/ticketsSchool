#!/usr/bin/env python3

import requests
import time
import sys

def check_deployment():
    print("🔄 Monitoring Railway deployment...")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print()

    for i in range(1, 21):
        try:
            response = requests.get("https://kartis.info/api/health", timeout=5)
            if response.ok:
                data = response.json()
                uptime = int(data.get('uptime', 0))

                if uptime < 300:  # Less than 5 minutes = new deployment
                    print()
                    print(f"🎉 NEW DEPLOYMENT LIVE!")
                    print(f"   Uptime: {uptime} seconds")
                    print()
                    print("✅ Deployment completed successfully!")
                    print()
                    print("Next steps:")
                    print("  1. Migrations should have run automatically")
                    print("  2. Backup API endpoint is now available")
                    print("  3. Run: ./scripts/download-qa-backup.sh")
                    print()
                    return True
                else:
                    days = uptime // 86400
                    print(f"[{i}/20] Still deploying... (uptime: {uptime}s, ~{days} days)")
        except Exception as e:
            print(f"[{i}/20] Checking... ({e})")

        if i < 20:
            time.sleep(15)

    print()
    print("⚠️  Deployment taking longer than expected.")
    print("   Check Railway dashboard: https://railway.app")
    return False

if __name__ == "__main__":
    success = check_deployment()
    sys.exit(0 if success else 1)
