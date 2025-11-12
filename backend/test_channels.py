"""
Test script for Channels and Memberships API endpoints.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"


def test_channels_and_memberships():
    """Test channels and memberships endpoints."""
    print("🧪 Testing Channels and Memberships API\n")
    
    # 1. Login as HR
    print("1️⃣ Login as HR...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "hr@company.com", "password": "Hr123!"}
    )
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.text}")
        return
    
    hr_token = login_response.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print(f"✅ HR logged in successfully\n")
    
    # 2. Login as employee
    print("2️⃣ Login as employee...")
    emp_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "employee@company.com", "password": "Employee123!"}
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print(f"✅ Employee logged in successfully\n")
    
    # 3. List all channels
    print("3️⃣ List all channels...")
    channels_response = requests.get(f"{BASE_URL}/channels", headers=hr_headers)
    channels = channels_response.json()
    print(f"✅ Found {channels['total']} channels:")
    for channel in channels['channels']:
        print(f"   • {channel['name']}: {channel['description']}")
    print()
    
    # 4. Create a new channel (HR only)
    print("4️⃣ Create new channel (HR)...")
    new_channel = requests.post(
        f"{BASE_URL}/channels",
        headers=hr_headers,
        json={
            "name": "engineering-team",
            "description": "Engineering team discussions",
            "is_public": False
        }
    )
    if new_channel.status_code == 201:
        channel_data = new_channel.json()
        channel_id = channel_data["id"]
        print(f"✅ Created channel: {channel_data['name']} (ID: {channel_id})\n")
    else:
        print(f"❌ Failed to create channel: {new_channel.text}\n")
        return
    
    # 5. Get channel details
    print("5️⃣ Get channel details...")
    detail_response = requests.get(f"{BASE_URL}/channels/{channel_id}", headers=hr_headers)
    detail = detail_response.json()
    print(f"✅ Channel details:")
    print(f"   Name: {detail['name']}")
    print(f"   Public: {detail['is_public']}")
    print(f"   Member count: {detail['member_count']}")
    print(f"   Is member: {detail['is_member']}\n")
    
    # 6. Get user's memberships
    print("6️⃣ Get HR memberships...")
    memberships_response = requests.get(f"{BASE_URL}/memberships", headers=hr_headers)
    memberships = memberships_response.json()
    print(f"✅ HR has {memberships['total']} memberships:")
    for membership in memberships['memberships']:
        print(f"   • Channel {membership['channel_id']}: {membership['role']}")
    print()
    
    # 7. Employee tries to create channel (should fail)
    print("7️⃣ Employee tries to create channel (should fail)...")
    emp_create = requests.post(
        f"{BASE_URL}/channels",
        headers=emp_headers,
        json={
            "name": "unauthorized-channel",
            "description": "This should fail",
            "is_public": True
        }
    )
    if emp_create.status_code == 403:
        print(f"✅ Correctly blocked: {emp_create.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_create.status_code}\n")
    
    # 8. Employee joins the engineering channel
    print("8️⃣ Employee joins engineering channel...")
    join_response = requests.post(
        f"{BASE_URL}/memberships/join",
        headers=emp_headers,
        json={"channel_id": channel_id}
    )
    if join_response.status_code == 201:
        print(f"✅ Employee joined channel\n")
    else:
        print(f"❌ Join failed: {join_response.text}\n")
        return
    
    # 9. Check channel member count
    print("9️⃣ Check channel member count...")
    detail_after = requests.get(f"{BASE_URL}/channels/{channel_id}", headers=hr_headers)
    print(f"✅ Member count now: {detail_after.json()['member_count']}\n")
    
    # 10. Get channel members
    print("🔟 Get channel members...")
    members_response = requests.get(
        f"{BASE_URL}/memberships?channel_id={channel_id}",
        headers=hr_headers
    )
    members = members_response.json()
    print(f"✅ Channel has {members['total']} members\n")
    
    # 11. Employee leaves channel
    print("1️⃣1️⃣ Employee leaves channel...")
    leave_response = requests.post(
        f"{BASE_URL}/memberships/leave",
        headers=emp_headers,
        json={"channel_id": channel_id}
    )
    if leave_response.status_code == 204:
        print(f"✅ Employee left channel\n")
    else:
        print(f"❌ Leave failed: {leave_response.text}\n")
    
    # 12. Update channel (owner only)
    print("1️⃣2️⃣ Update channel...")
    update_response = requests.patch(
        f"{BASE_URL}/channels/{channel_id}",
        headers=hr_headers,
        json={"description": "Updated engineering discussions"}
    )
    if update_response.status_code == 200:
        print(f"✅ Channel updated\n")
    else:
        print(f"❌ Update failed: {update_response.text}\n")
    
    # 13. List all channels again
    print("1️⃣3️⃣ List all channels (final)...")
    final_channels = requests.get(f"{BASE_URL}/channels", headers=hr_headers)
    final = final_channels.json()
    print(f"✅ Total channels: {final['total']}")
    for channel in final['channels']:
        print(f"   • {channel['name']}")
    
    print("\n🎉 All tests completed!")


if __name__ == "__main__":
    test_channels_and_memberships()
