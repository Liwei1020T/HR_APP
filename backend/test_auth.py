"""
Test script for authentication endpoints.
Usage: python test_auth.py
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"


def test_login():
    """Test login endpoint."""
    print("\n🔐 Testing Login...")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "superadmin@company.com",
            "password": "Admin123!"
        }
    )
    
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Response: {json.dumps(data, indent=2)}")
    
    if response.status_code == 200:
        return data["access_token"], data["refresh_token"]
    return None, None


def test_get_me(access_token):
    """Test get current user endpoint."""
    print("\n👤 Testing Get Current User...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_get_users(access_token):
    """Test get users endpoint."""
    print("\n👥 Testing Get Users...")
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/users", headers=headers)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def test_refresh_token(refresh_token):
    """Test refresh token endpoint."""
    print("\n🔄 Testing Refresh Token...")
    
    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")


def main():
    print("=" * 60)
    print("🧪 Testing HR App Authentication API")
    print("=" * 60)
    
    # Test login
    access_token, refresh_token = test_login()
    
    if access_token:
        # Test get current user
        test_get_me(access_token)
        
        # Test get users
        test_get_users(access_token)
        
        # Test refresh token
        test_refresh_token(refresh_token)
        
        print("\n" + "=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)
    else:
        print("\n❌ Login failed - cannot continue with other tests")


if __name__ == "__main__":
    main()
