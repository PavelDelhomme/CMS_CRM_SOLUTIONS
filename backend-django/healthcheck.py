#!/usr/bin/env python
"""Healthcheck script for Django backend"""
import urllib.request
import urllib.error
import sys

try:
    # Use dedicated healthcheck endpoint (no auth required, no warnings)
    response = urllib.request.urlopen('http://localhost:8000/health/', timeout=3)
    if response.getcode() == 200:
        sys.exit(0)
    sys.exit(1)
except urllib.error.HTTPError as e:
    # Accept 2xx (health endpoint should return 200)
    if 200 <= e.code < 300:
        sys.exit(0)
    sys.exit(1)
except Exception:
    sys.exit(1)

