"""
Test script for Feedback and Comments API endpoints.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"


def test_feedback_system():
    """Test feedback and comments endpoints."""
    print("🧪 Testing Feedback System API\n")
    
    # 1. Login as employee
    print("1️⃣ Login as employee...")
    emp_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "employee@company.com", "password": "Employee123!"}
    )
    if emp_login.status_code != 200:
        print(f"❌ Employee login failed: {emp_login.text}")
        return
    
    emp_token = emp_login.json()["access_token"]
    emp_headers = {"Authorization": f"Bearer {emp_token}"}
    print(f"✅ Employee logged in successfully\n")
    
    # 2. Login as HR
    print("2️⃣ Login as HR...")
    hr_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "hr@company.com", "password": "Hr123!"}
    )
    hr_token = hr_login.json()["access_token"]
    hr_headers = {"Authorization": f"Bearer {hr_token}"}
    print(f"✅ HR logged in successfully\n")
    
    # 3. Employee submits feedback
    print("3️⃣ Employee submits feedback...")
    feedback_data = {
        "title": "Office temperature too cold",
        "content": "The AC is set too low in the office. Many employees are complaining about the cold temperature affecting productivity.",
        "category": "workplace",
        "is_anonymous": False
    }
    create_response = requests.post(
        f"{BASE_URL}/feedback",
        headers=emp_headers,
        json=feedback_data
    )
    if create_response.status_code == 201:
        feedback = create_response.json()
        feedback_id = feedback["id"]
        print(f"✅ Created feedback (ID: {feedback_id})")
        print(f"   Status: {feedback['status']}")
        print(f"   Submitter: {feedback['submitter_name']}\n")
    else:
        print(f"❌ Failed to create feedback: {create_response.text}\n")
        return
    
    # 4. Employee submits anonymous feedback
    print("4️⃣ Employee submits anonymous feedback...")
    anon_feedback = {
        "title": "Management communication issues",
        "content": "There's a lack of clear communication from management about company decisions.",
        "category": "management",
        "is_anonymous": True
    }
    anon_response = requests.post(
        f"{BASE_URL}/feedback",
        headers=emp_headers,
        json=anon_feedback
    )
    if anon_response.status_code == 201:
        anon_id = anon_response.json()["id"]
        print(f"✅ Created anonymous feedback (ID: {anon_id})\n")
    else:
        print(f"❌ Failed to create anonymous feedback: {anon_response.text}\n")
        return
    
    # 5. Employee lists their feedback
    print("5️⃣ Employee lists their feedback...")
    emp_list = requests.get(f"{BASE_URL}/feedback", headers=emp_headers)
    emp_feedback = emp_list.json()
    print(f"✅ Employee has {emp_feedback['total']} feedback items:")
    for fb in emp_feedback['feedback']:
        print(f"   • {fb['title']} - Status: {fb['status']}")
    print()
    
    # 6. HR lists all feedback
    print("6️⃣ HR lists all feedback...")
    hr_list = requests.get(f"{BASE_URL}/feedback", headers=hr_headers)
    hr_feedback = hr_list.json()
    print(f"✅ HR sees {hr_feedback['total']} feedback items:")
    for fb in hr_feedback['feedback']:
        submitter = fb.get('submitter_name', 'Unknown')
        print(f"   • {fb['title']} by {submitter}")
    print()
    
    # 7. HR gets feedback details
    print("7️⃣ HR gets feedback details...")
    detail_response = requests.get(f"{BASE_URL}/feedback/{feedback_id}", headers=hr_headers)
    detail = detail_response.json()
    print(f"✅ Feedback details:")
    print(f"   Title: {detail['title']}")
    print(f"   Category: {detail['category']}")
    print(f"   Status: {detail['status']}")
    print(f"   Comments: {detail['comment_count']}\n")
    
    # 8. Employee adds a comment
    print("8️⃣ Employee adds a comment...")
    comment_data = {"content": "This has been an issue for weeks now."}
    comment_response = requests.post(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=emp_headers,
        json=comment_data
    )
    if comment_response.status_code == 201:
        comment = comment_response.json()
        print(f"✅ Comment added by {comment['user_name']}\n")
    else:
        print(f"❌ Failed to add comment: {comment_response.text}\n")
    
    # 9. HR adds an internal comment
    print("9️⃣ HR adds an internal comment (HR-only)...")
    internal_comment = {
        "content": "Need to check with facilities team about thermostat settings.",
        "is_internal": True
    }
    hr_comment_response = requests.post(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=hr_headers,
        json=internal_comment
    )
    if hr_comment_response.status_code == 201:
        print(f"✅ Internal comment added\n")
    else:
        print(f"❌ Failed to add internal comment: {hr_comment_response.text}\n")
    
    # 10. Employee tries to add internal comment (should fail)
    print("🔟 Employee tries to add internal comment (should fail)...")
    emp_internal = {
        "content": "This should not work",
        "is_internal": True
    }
    emp_internal_response = requests.post(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=emp_headers,
        json=emp_internal
    )
    if emp_internal_response.status_code == 403:
        print(f"✅ Correctly blocked: {emp_internal_response.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_internal_response.status_code}\n")
    
    # 11. Employee views comments (won't see internal)
    print("1️⃣1️⃣ Employee views comments (internal hidden)...")
    emp_comments = requests.get(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=emp_headers
    )
    emp_comment_list = emp_comments.json()
    print(f"✅ Employee sees {len(emp_comment_list)} comment(s)\n")
    
    # 12. HR views comments (sees all including internal)
    print("1️⃣2️⃣ HR views comments (including internal)...")
    hr_comments = requests.get(
        f"{BASE_URL}/feedback/{feedback_id}/comments",
        headers=hr_headers
    )
    hr_comment_list = hr_comments.json()
    print(f"✅ HR sees {len(hr_comment_list)} comment(s):")
    for c in hr_comment_list:
        internal_flag = " [INTERNAL]" if c['is_internal'] else ""
        print(f"   • {c['user_name']}: {c['content'][:50]}...{internal_flag}")
    print()
    
    # 13. Get HR user ID for assignment
    print("1️⃣3️⃣ Get HR user details...")
    hr_me = requests.get(f"{BASE_URL}/users/me", headers=hr_headers)
    hr_user = hr_me.json()
    hr_user_id = hr_user["id"]
    print(f"✅ HR user ID: {hr_user_id}\n")
    
    # 14. HR updates feedback status
    print("1️⃣4️⃣ HR updates feedback status...")
    status_update = {
        "status": "reviewed",
        "assigned_to": hr_user_id
    }
    status_response = requests.patch(
        f"{BASE_URL}/feedback/{feedback_id}/status",
        headers=hr_headers,
        json=status_update
    )
    if status_response.status_code == 200:
        updated = status_response.json()
        print(f"✅ Status updated to: {updated['status']}")
        print(f"   Assigned to: {updated['assignee_name']}\n")
    else:
        print(f"❌ Failed to update status: {status_response.text}\n")
    
    # 15. Employee tries to update reviewed feedback (should fail)
    print("1️⃣5️⃣ Employee tries to update reviewed feedback (should fail)...")
    update_attempt = {
        "title": "This should not work"
    }
    update_response = requests.patch(
        f"{BASE_URL}/feedback/{feedback_id}",
        headers=emp_headers,
        json=update_attempt
    )
    if update_response.status_code == 403 or update_response.status_code == 400:
        print(f"✅ Correctly blocked: Cannot modify reviewed feedback\n")
    else:
        print(f"❌ Should have been blocked but got: {update_response.status_code}\n")
    
    # 16. Filter feedback by status
    print("1️⃣6️⃣ Filter feedback by status (pending)...")
    pending_response = requests.get(
        f"{BASE_URL}/feedback?status_filter=pending",
        headers=hr_headers
    )
    pending_feedback = pending_response.json()
    print(f"✅ Found {pending_feedback['total']} pending feedback items\n")
    
    # 17. HR resolves feedback
    print("1️⃣7️⃣ HR resolves feedback...")
    resolve_update = {"status": "resolved"}
    resolve_response = requests.patch(
        f"{BASE_URL}/feedback/{feedback_id}/status",
        headers=hr_headers,
        json=resolve_update
    )
    if resolve_response.status_code == 200:
        print(f"✅ Feedback marked as resolved\n")
    
    # 18. Final feedback list
    print("1️⃣8️⃣ Final feedback summary...")
    final_list = requests.get(f"{BASE_URL}/feedback", headers=hr_headers)
    final = final_list.json()
    print(f"✅ Total feedback: {final['total']}")
    for fb in final['feedback']:
        print(f"   • [{fb['status']}] {fb['title']}")
    
    print("\n🎉 All tests completed!")


if __name__ == "__main__":
    test_feedback_system()
