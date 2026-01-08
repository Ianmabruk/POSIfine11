#!/usr/bin/env python3
import subprocess
import sys
import os

def install_requirements():
    """Install Python requirements if needed"""
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Python dependencies installed successfully")
    except subprocess.CalledProcessError:
        print("❌ Failed to install Python dependencies")
        sys.exit(1)

def run_backend():
    """Run the Flask backend server"""
    try:
        print("🚀 Starting Universal POS Backend (Flask)...")
        subprocess.run([sys.executable, 'src/backend/app.py'])
    except KeyboardInterrupt:
        print("\n🛑 Backend server stopped")
    except Exception as e:
        print(f"❌ Error running backend: {e}")

if __name__ == '__main__':
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt not found")
        sys.exit(1)
    
    install_requirements()
    run_backend()