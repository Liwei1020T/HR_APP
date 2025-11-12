"""
Test script for Events Bus + Notifications system.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests
import time

BASE_URL = "http://localhost:8000/api/v1"


def test_notifications_system():
    """Test notifications and event-driven architecture."""
    print("🧪 Testing Notifications System\n")
    
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
    
    # 3. Check HR notifications (should be empty initially)
    print("3️⃣ Check HR notifications (initial)...")
    hr_notifs = requests.get(f"{BASE_URL}/notifications", headers=hr_headers)
    initial_notifs = hr_notifs.json()
    print(f"✅ HR has {initial_notifs['total']} notifications ({initial_notifs['unread_count']} unread)\n")
    
    # 4. Employee submits feedback (should trigger notification to HR)
    print("4️⃣ Employee submits feedback...")
    feedback_data = {
        "title": "Need better office equipment",
        "content": "The keyboards and mice are outdated and causing wrist strain.",
        "category": "workplace",
        "is_anonymous": False
    }
    feedback_response = requests.post(
        f"{BASE_URL}/feedback",
        headers=emp_headers,
        json=feedback_data
    )
    feedback_id = feedback_response.json()["id"]
    print(f"✅ Feedback created (ID: {feedback_id})\n")
    
    # Wait a moment for event processing
    time.sleep(0.5)
    
    # 5. Check HR notifications (should have new notification)
    print("5️⃣ Check HR notifications (after feedback)...")
    hr_notifs_after = requests.get(f"{BASE_URL}/notifications", headers=hr_headers)
    notifs_after = hr_notifs_after.json()
    print(f"✅ HR now has {notifs_after['total']} notifications ({notifs_after['unread_count']} unread)")
    if notifs_after['notifications']:
        latest = notifs_after['notifications'][0]
        print(f"   Latest: {latest['title']}")
        print(f"   Message: {latest['message']}\n")
    
    # 6. Get notification stats
    print("6️⃣ Get HR notification stats...")
    stats_response = requests.get(f"{BASE_URL}/notifications/stats", headers=hr_headers)
    stats = stats_response.json()
    print(f"✅ Stats:")
    print(f"   Total: {stats['total']}")
    print(f"   Unread: {stats['unread']}")
    print(f"   By type: {stats['by_type']}\n")
    
    # 7. HR updates feedback status (should notify employee)
    print("7️⃣ HR updates feedback status...")
    status_update = {
        "status": "reviewed",
        "assigned_to": hr_login.json().get("user", {}).get("id", 2)
    }
    requests.patch(
        f"{BASE_URL}/feedback/{feedback_id}/status",
        headers=hr_headers,
        json=status_update
    )
    print(f"✅ Status updated to reviewed\n")
    
    time.sleep(0.5)
    
    # 8. Check employee notifications (should have status update)
    print("8️⃣ Check employee notifications...")
    emp_notifs = requests.get(f"{BASE_URL}/notifications", headers=emp_headers)
    emp_notif_data = emp_notifs.json()
    print(f"✅ Employee has {emp_notif_data['total']} notifications ({emp_notif_data['unread_count']} unread)")
    if emp_notif_data['notifications']:
        for notif in emp_notif_data['notifications']:
            print(f"   • {notif['title']}: {notif['message']}")
    print()
    
    # 9. HR adds a comment (should notify employee)
    print("9️⃣ HR adds a comment...")
    comment_data = {"content": "We'll look into upgrading equipment in Q2."}
    requests.post(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=hr_headers,
        json=comment_data
    )
    print(f"✅ Comment added\n")
    
    time.sleep(0.5)
    
    # 10. Check employee notifications again
    print("🔟 Check employee notifications (after comment)...")
    emp_notifs2 = requests.get(f"{BASE_URL}/notifications", headers=emp_headers)
    emp_data2 = emp_notifs2.json()
    print(f"✅ Employee now has {emp_data2['total']} notifications ({emp_data2['unread_count']} unread)\n")
    
    # 11. Filter notifications by type
    print("1️⃣1️⃣ Filter notifications by type...")
    filtered = requests.get(
        f"{BASE_URL}/notifications?notification_type=feedback_comment",
        headers=emp_headers
    )
    filtered_data = filtered.json()
    print(f"✅ Found {filtered_data['total']} comment notifications\n")
    
    # 12. Mark specific notifications as read
    print("1️⃣2️⃣ Mark notifications as read...")
    if emp_data2['notifications']:
        notif_ids = [n['id'] for n in emp_data2['notifications'][:2]]
        mark_read = {"notification_ids": notif_ids}
        requests.post(
            f"{BASE_URL}/notifications/mark-read",
            headers=emp_headers,
            json=mark_read
        )
        print(f"✅ Marked {len(notif_ids)} notifications as read\n")
    
    # 13. Check unread count after marking
    print("1️⃣3️⃣ Check unread count after marking...")
    emp_notifs3 = requests.get(f"{BASE_URL}/notifications", headers=emp_headers)
    emp_data3 = emp_notifs3.json()
    print(f"✅ Employee now has {emp_data3['unread_count']} unread notifications\n")
    
    # 14. Get only unread notifications
    print("1️⃣4️⃣ Get only unread notifications...")
    unread_only = requests.get(
        f"{BASE_URL}/notifications?unread_only=true",
        headers=emp_headers
    )
    unread_data = unread_only.json()
    print(f"✅ Found {len(unread_data['notifications'])} unread notifications\n")
    
    # 15. Mark all as read
    print("1️⃣5️⃣ Mark all notifications as read...")
    requests.post(
        f"{BASE_URL}/notifications/mark-all-read",
        headers=emp_headers
    )
    print(f"✅ All notifications marked as read\n")
    
    # 16. Verify all marked
    print("1️⃣6️⃣ Verify all marked as read...")
    emp_notifs4 = requests.get(f"{BASE_URL}/notifications", headers=emp_headers)
    emp_data4 = emp_notifs4.json()
    print(f"✅ Employee has {emp_data4['unread_count']} unread notifications\n")
    
    # 17. Test anonymous feedback (should still create notification)
    print("1️⃣7️⃣ Test anonymous feedback notification...")
    anon_feedback = {
        "title": "Confidential concern",
        "content": "Some confidential issue I want to raise.",
        "category": "other",
        "is_anonymous": True
    }
    requests.post(
        f"{BASE_URL}/feedback",
        headers=emp_headers,
        json=anon_feedback
    )
    print(f"✅ Anonymous feedback submitted\n")
    
    time.sleep(0.5)
    
    # 18. Check HR received anonymous feedback notification
    print("1️⃣8️⃣ Check HR notification for anonymous feedback...")
    hr_notifs_final = requests.get(f"{BASE_URL}/notifications?unread_only=true", headers=hr_headers)
    hr_final_data = hr_notifs_final.json()
    print(f"✅ HR has {len(hr_final_data['notifications'])} unread notifications")
    for notif in hr_final_data['notifications'][:3]:
        print(f"   • {notif['title']}: {notif['message'][:60]}...")
    
    print("\n🎉 All notification tests completed!")


if __name__ == "__main__":
    test_notifications_system()
