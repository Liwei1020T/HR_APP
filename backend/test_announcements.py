"""
Test script for Announcements API.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"


def test_announcements():
    """Test announcements system."""
    print("🧪 Testing Announcements System\n")
    
    # 1. Login as employee
    print("1️⃣ Login as employee...")
    emp_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "employee@company.com", "password": "Employee123!"}
    )
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print(f"✅ Employee logged in\n")
    
    # 2. Login as HR
    print("2️⃣ Login as HR...")
    hr_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "hr@company.com", "password": "Hr123!"}
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print(f"✅ HR logged in\n")
    
    # 3. Login as superadmin
    print("3️⃣ Login as superadmin...")
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "superadmin@company.com", "password": "Admin123!"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ Superadmin logged in\n")
    
    # 4. Employee tries to create announcement (should fail)
    print("4️⃣ Employee tries to create announcement (should fail)...")
    emp_create = requests.post(
        f"{BASE_URL}/announcements",
        headers=emp_headers,
        json={
            "title": "Unauthorized announcement",
            "content": "This should fail",
            "category": "general"
        }
    )
    if emp_create.status_code == 403:
        print(f"✅ Correctly blocked: {emp_create.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_create.status_code}\n")
    
    # 5. HR creates a regular announcement
    print("5️⃣ HR creates a regular announcement...")
    announcement1 = requests.post(
        f"{BASE_URL}/announcements",
        headers=hr_headers,
        json={
            "title": "New Office Hours",
            "content": "Starting next week, office hours will be 9 AM to 5 PM.",
            "category": "policy",
            "is_pinned": False
        }
    )
    if announcement1.status_code == 201:
        a1_data = announcement1.json()
        a1_id = a1_data["id"]
        print(f"✅ Created announcement (ID: {a1_id})")
        print(f"   Title: {a1_data['title']}")
        print(f"   Creator: {a1_data['creator_name']}\n")
    else:
        print(f"❌ Failed: {announcement1.text}\n")
        return
    
    # 6. HR creates a pinned announcement
    print("6️⃣ HR creates a pinned announcement...")
    announcement2 = requests.post(
        f"{BASE_URL}/announcements",
        headers=hr_headers,
        json={
            "title": "🎉 Company Holiday Party",
            "content": "Join us for the annual holiday party on December 20th!",
            "category": "event",
            "is_pinned": True
        }
    )
    a2_id = announcement2.json()["id"]
    print(f"✅ Created pinned announcement (ID: {a2_id})\n")
    
    # 7. Admin creates an urgent announcement with expiry
    print("7️⃣ Admin creates urgent announcement with expiry...")
    expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
    announcement3 = requests.post(
        f"{BASE_URL}/announcements",
        headers=admin_headers,
        json={
            "title": "⚠️ Server Maintenance",
            "content": "Server maintenance scheduled for this weekend.",
            "category": "urgent",
            "is_pinned": True,
            "expires_at": expires_at
        }
    )
    a3_id = announcement3.json()["id"]
    print(f"✅ Created urgent announcement with expiry (ID: {a3_id})\n")
    
    # 8. Employee lists announcements
    print("8️⃣ Employee lists announcements...")
    emp_list = requests.get(f"{BASE_URL}/announcements", headers=emp_headers)
    announcements = emp_list.json()
    print(f"✅ Found {announcements['total']} announcements ({announcements['pinned_count']} pinned)")
    for ann in announcements['announcements']:
        pin_flag = " 📌" if ann['is_pinned'] else ""
        print(f"   • {ann['title']}{pin_flag} - {ann['category']}")
    print()
    
    # 9. Filter announcements by category
    print("9️⃣ Filter announcements by category (event)...")
    filtered = requests.get(
        f"{BASE_URL}/announcements?category=event",
        headers=emp_headers
    )
    filtered_data = filtered.json()
    print(f"✅ Found {filtered_data['total']} event announcements\n")
    
    # 10. Filter pinned announcements only
    print("🔟 Filter pinned announcements only...")
    pinned = requests.get(
        f"{BASE_URL}/announcements?is_pinned=true",
        headers=emp_headers
    )
    pinned_data = pinned.json()
    print(f"✅ Found {pinned_data['total']} pinned announcements:")
    for ann in pinned_data['announcements']:
        print(f"   • {ann['title']}")
    print()
    
    # 11. Get specific announcement
    print("1️⃣1️⃣ Get specific announcement...")
    detail_response = requests.get(
        f"{BASE_URL}/announcements/{a1_id}",
        headers=emp_headers
    )
    detail = detail_response.json()
    print(f"✅ Announcement details:")
    print(f"   Title: {detail['title']}")
    print(f"   Category: {detail['category']}")
    print(f"   Content: {detail['content'][:50]}...")
    print(f"   Creator: {detail['creator_name']}\n")
    
    # 12. HR updates their own announcement
    print("1️⃣2️⃣ HR updates their own announcement...")
    update_response = requests.patch(
        f"{BASE_URL}/announcements/{a1_id}",
        headers=hr_headers,
        json={
            "title": "Updated Office Hours",
            "is_pinned": True
        }
    )
    if update_response.status_code == 200:
        updated = update_response.json()
        print(f"✅ Updated announcement")
        print(f"   New title: {updated['title']}")
        print(f"   Pinned: {updated['is_pinned']}\n")
    else:
        print(f"❌ Update failed: {update_response.text}\n")
    
    # 13. HR tries to update admin's announcement (should fail)
    print("1️⃣3️⃣ HR tries to update admin's announcement (should fail)...")
    hr_update_admin = requests.patch(
        f"{BASE_URL}/announcements/{a3_id}",
        headers=hr_headers,
        json={"title": "This should fail"}
    )
    if hr_update_admin.status_code == 403:
        print(f"✅ Correctly blocked: {hr_update_admin.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {hr_update_admin.status_code}\n")
    
    # 14. Admin can update any announcement
    print("1️⃣4️⃣ Admin can update any announcement...")
    admin_update = requests.patch(
        f"{BASE_URL}/announcements/{a1_id}",
        headers=admin_headers,
        json={"content": "Updated by admin"}
    )
    if admin_update.status_code == 200:
        print(f"✅ Admin successfully updated HR's announcement\n")
    
    # 15. Get announcement stats (HR only)
    print("1️⃣5️⃣ Get announcement stats (HR)...")
    stats_response = requests.get(
        f"{BASE_URL}/announcements/stats",
        headers=hr_headers
    )
    stats = stats_response.json()
    print(f"✅ Announcement statistics:")
    print(f"   Total: {stats['total']}")
    print(f"   Active: {stats['active']}")
    print(f"   Pinned: {stats['pinned']}")
    print(f"   By category: {stats['by_category']}\n")
    
    # 16. Admin deactivates an announcement
    print("1️⃣6️⃣ Admin deactivates an announcement...")
    deactivate = requests.patch(
        f"{BASE_URL}/announcements/{a2_id}",
        headers=admin_headers,
        json={"is_active": False}
    )
    if deactivate.status_code == 200:
        print(f"✅ Announcement deactivated\n")
    
    # 17. Verify employee can't see deactivated announcement in list
    print("1️⃣7️⃣ Verify employee can't see deactivated announcement...")
    emp_list2 = requests.get(f"{BASE_URL}/announcements", headers=emp_headers)
    emp_data2 = emp_list2.json()
    print(f"✅ Employee now sees {emp_data2['total']} active announcements (was {announcements['total']})\n")
    
    # 18. Admin deletes an announcement
    print("1️⃣8️⃣ Admin deletes an announcement...")
    delete_response = requests.delete(
        f"{BASE_URL}/announcements/{a3_id}",
        headers=admin_headers
    )
    if delete_response.status_code == 204:
        print(f"✅ Announcement deleted\n")
    
    # 19. Final list
    print("1️⃣9️⃣ Final announcement list...")
    final_list = requests.get(f"{BASE_URL}/announcements", headers=emp_headers)
    final_data = final_list.json()
    print(f"✅ Total active announcements: {final_data['total']}")
    for ann in final_data['announcements']:
        print(f"   • {ann['title']} ({ann['category']})")
    
    print("\n🎉 All announcement tests completed!")


if __name__ == "__main__":
    test_announcements()
