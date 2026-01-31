#!/usr/bin/env python3
"""
Simple test script for PromptViz backend
Run this to verify the backend is working correctly
"""

import requests
import json
import time

BASE_URL = "http://localhost:5001"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health check passed: {data}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Is it running?")
        return False

def test_models():
    """Test models endpoint"""
    print("\n🔍 Testing models endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/models")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Models endpoint working: {len(data.get('models', []))} models available")
            return True
        else:
            print(f"❌ Models endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Models endpoint error: {e}")
        return False

def test_system_prompts():
    """Test system prompts endpoint"""
    print("\n🔍 Testing system prompts endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/system-prompts")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ System prompts endpoint working: {len(data.get('available_prompts', []))} prompts available")
            return True
        else:
            print(f"❌ System prompts endpoint failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ System prompts endpoint error: {e}")
        return False

def test_diagram_generation():
    """Test diagram generation endpoint"""
    print("\n🔍 Testing diagram generation endpoint...")
    
    # Simple test prompt
    test_prompt = {
        "prompt": "Create a simple workflow with start, process, and end steps",
        "model": "gpt-4",
        "diagram_type": "flowchart"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/generate-diagram",
            json=test_prompt,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Diagram generation working!")
                print(f"   Model used: {data.get('ai_model_used')}")
                print(f"   Processing time: {data.get('processing_time')}s")
                print(f"   Mermaid code length: {len(data.get('mermaid_code', ''))} chars")
                return True
            else:
                print(f"❌ Diagram generation failed: {data.get('error_message')}")
                return False
        elif response.status_code == 500:
            data = response.json()
            if "LLM service not available" in data.get('error', ''):
                print("⚠️  LLM service not available (API key not set)")
                print("   This is expected if OPENAI_API_KEY is not configured")
                return True  # This is not a backend failure
            else:
                print(f"❌ Diagram generation failed: {data.get('error')}")
                return False
        else:
            print(f"❌ Diagram generation failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Diagram generation error: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 PromptViz Backend Test Suite")
    print("=" * 40)
    
    tests = [
        test_health,
        test_models,
        test_system_prompts,
        test_diagram_generation
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        if test():
            passed += 1
        time.sleep(0.5)  # Small delay between tests
    
    print("\n" + "=" * 40)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is working correctly.")
    elif passed >= total - 1:
        print("✅ Most tests passed. Backend is mostly working.")
        print("   Check if you need to set OPENAI_API_KEY for full functionality.")
    else:
        print("❌ Several tests failed. Check backend logs and configuration.")
    
    print("\n💡 Next steps:")
    print("   1. Set OPENAI_API_KEY in your .env file")
    print("   2. Restart the backend")
    print("   3. Run tests again to verify full functionality")

if __name__ == "__main__":
    main() 