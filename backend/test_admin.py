"""
Test script for Admin API.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"


def test_admin():
    """Test admin functionality."""
    print("🧪 Testing Admin Module\n")
    
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
    
    # 3. Login as admin
    print("3️⃣ Login as admin...")
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@company.com", "password": "Admin123!"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print(f"✅ Admin logged in\n")
    
    # 4. Login as superadmin
    print("4️⃣ Login as superadmin...")
    super_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": "superadmin@company.com", "password": "Admin123!"}
    )
    super_token = super_login.json()["access_token"]
    super_headers = {"Authorization": f"Bearer {super_token}"}
    print(f"✅ Superadmin logged in\n")
    
    # 5. Employee tries to access system metrics (should fail)
    print("5️⃣ Employee tries to access system metrics (should fail)...")
    emp_metrics = requests.get(
        f"{BASE_URL}/admin/metrics/system",
        headers=emp_headers
    )
    if emp_metrics.status_code == 403:
        print(f"✅ Correctly blocked: {emp_metrics.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_metrics.status_code}\n")
    
    # 6. HR gets system metrics
    print("6️⃣ HR gets system metrics...")
    metrics = requests.get(
        f"{BASE_URL}/admin/metrics/system",
        headers=hr_headers
    )
    if metrics.status_code == 200:
        data = metrics.json()
        print(f"✅ System Metrics:")
        print(f"   Total Users: {data['total_users']} (Active: {data['active_users']})")
        print(f"   Total Channels: {data['total_channels']} (Public: {data['public_channels']}, Private: {data['private_channels']})")
        print(f"   Total Feedback: {data['total_feedback']}")
        print(f"     • Pending: {data['pending_feedback']}")
        print(f"     • In Progress: {data['in_progress_feedback']}")
        print(f"     • Resolved: {data['resolved_feedback']}")
        print(f"   Announcements: {data['total_announcements']} (Active: {data['active_announcements']})")
        print(f"   Notifications: {data['total_notifications']} (Unread: {data['unread_notifications']})")
        print(f"   Files: {data['total_files']} (Storage: {data['storage_used_mb']} MB)\n")
    else:
        print(f"❌ Failed: {metrics.text}\n")
    
    # 7. HR tries to get user metrics (should fail - admin only)
    print("7️⃣ HR tries to get user metrics (should fail)...")
    hr_user_metrics = requests.get(
        f"{BASE_URL}/admin/metrics/users",
        headers=hr_headers
    )
    if hr_user_metrics.status_code == 403:
        print(f"✅ Correctly blocked: {hr_user_metrics.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {hr_user_metrics.status_code}\n")
    
    # 8. Admin gets user metrics
    print("8️⃣ Admin gets user metrics...")
    user_metrics = requests.get(
        f"{BASE_URL}/admin/metrics/users",
        headers=admin_headers
    )
    if user_metrics.status_code == 200:
        users = user_metrics.json()
        print(f"✅ User Metrics (showing first 3):")
        for user in users[:3]:
            print(f"   • {user['full_name']} ({user['role']})")
            print(f"     Feedback: {user['feedback_submitted']} submitted, {user['feedback_assigned']} assigned")
            print(f"     Channels: {user['channels_joined']}, Files: {user['files_uploaded']}")
        print()
    else:
        print(f"❌ Failed: {user_metrics.text}\n")
    
    # 9. HR assigns feedback to themselves
    print("9️⃣ HR assigns feedback to themselves...")
    # First, get HR user ID
    hr_me = requests.get(f"{BASE_URL}/auth/me", headers=hr_headers).json()
    hr_id = hr_me["id"]
    
    assign_response = requests.post(
        f"{BASE_URL}/admin/feedback/assign",
        headers=hr_headers,
        json={"feedback_id": 1, "assignee_id": hr_id}
    )
    if assign_response.status_code == 200:
        assignment = assign_response.json()
        print(f"✅ {assignment['message']}")
        print(f"   Feedback ID: {assignment['feedback_id']}")
        print(f"   Assignee: {assignment['assignee_name']}\n")
    else:
        print(f"❌ Failed: {assign_response.text}\n")
    
    # 10. HR tries to assign feedback to employee (should fail)
    print("🔟 HR tries to assign feedback to employee (should fail)...")
    emp_me = requests.get(f"{BASE_URL}/auth/me", headers=emp_headers).json()
    emp_id = emp_me["id"]
    
    bad_assign = requests.post(
        f"{BASE_URL}/admin/feedback/assign",
        headers=hr_headers,
        json={"feedback_id": 2, "assignee_id": emp_id}
    )
    if bad_assign.status_code == 400:
        print(f"✅ Correctly blocked: {bad_assign.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {bad_assign.status_code}\n")
    
    # 11. Admin deactivates employee
    print("1️⃣1️⃣ Admin deactivates employee...")
    deactivate = requests.patch(
        f"{BASE_URL}/admin/users/{emp_id}/status",
        headers=admin_headers,
        json={"is_active": False}
    )
    if deactivate.status_code == 200:
        user = deactivate.json()
        print(f"✅ User deactivated: {user['full_name']} (active: {user['is_active']})\n")
    else:
        print(f"❌ Failed: {deactivate.text}\n")
    
    # 12. Verify deactivated employee cannot access API
    print("1️⃣2️⃣ Verify deactivated employee cannot access API...")
    emp_test = requests.get(f"{BASE_URL}/feedback", headers=emp_headers)
    if emp_test.status_code == 403:
        print(f"✅ Correctly blocked: {emp_test.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_test.status_code}\n")
    
    # 13. Admin reactivates employee
    print("1️⃣3️⃣ Admin reactivates employee...")
    reactivate = requests.patch(
        f"{BASE_URL}/admin/users/{emp_id}/status",
        headers=admin_headers,
        json={"is_active": True}
    )
    if reactivate.status_code == 200:
        print(f"✅ User reactivated\n")
    else:
        print(f"❌ Failed: {reactivate.text}\n")
    
    # 14. Admin tries to change employee role (should fail - superadmin only)
    print("1️⃣4️⃣ Admin tries to change employee role (should fail)...")
    admin_role_change = requests.patch(
        f"{BASE_URL}/admin/users/{emp_id}/role",
        headers=admin_headers,
        json={"role": "hr"}
    )
    if admin_role_change.status_code == 403:
        print(f"✅ Correctly blocked: {admin_role_change.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {admin_role_change.status_code}\n")
    
    # 15. Superadmin changes employee role to HR
    print("1️⃣5️⃣ Superadmin changes employee role to HR...")
    role_change = requests.patch(
        f"{BASE_URL}/admin/users/{emp_id}/role",
        headers=super_headers,
        json={"role": "hr"}
    )
    if role_change.status_code == 200:
        user = role_change.json()
        print(f"✅ Role changed: {user['full_name']} is now '{user['role']}'\n")
    else:
        print(f"❌ Failed: {role_change.text}\n")
    
    # 16. Change role back to employee
    print("1️⃣6️⃣ Change role back to employee...")
    role_restore = requests.patch(
        f"{BASE_URL}/admin/users/{emp_id}/role",
        headers=super_headers,
        json={"role": "employee"}
    )
    if role_restore.status_code == 200:
        print(f"✅ Role restored to employee\n")
    
    # 17. Get audit logs
    print("1️⃣7️⃣ Get audit logs...")
    audit_logs = requests.get(
        f"{BASE_URL}/admin/audit-logs?page=1&page_size=10",
        headers=admin_headers
    )
    if audit_logs.status_code == 200:
        logs_data = audit_logs.json()
        print(f"✅ Audit Logs (Total: {logs_data['total']}, showing first 5):")
        for log in logs_data['logs'][:5]:
            user_email = log['user_email'] or 'System'
            print(f"   • [{log['created_at'][:19]}] {user_email}")
            print(f"     Action: {log['action']}")
            if log['entity_type']:
                print(f"     Entity: {log['entity_type']} #{log['entity_id']}")
            if log['details']:
                print(f"     Details: {log['details']}")
        print()
    else:
        print(f"❌ Failed: {audit_logs.text}\n")
    
    # 18. Filter audit logs by user
    print("1️⃣8️⃣ Filter audit logs by admin user...")
    admin_me = requests.get(f"{BASE_URL}/auth/me", headers=admin_headers).json()
    admin_id = admin_me["id"]
    
    filtered_logs = requests.get(
        f"{BASE_URL}/admin/audit-logs?user_id={admin_id}",
        headers=admin_headers
    )
    if filtered_logs.status_code == 200:
        filtered_data = filtered_logs.json()
        print(f"✅ Found {filtered_data['total']} actions by admin\n")
    
    # 19. Filter audit logs by action type
    print("1️⃣9️⃣ Filter audit logs by action type (role updates)...")
    action_logs = requests.get(
        f"{BASE_URL}/admin/audit-logs?action=user.role_updated",
        headers=admin_headers
    )
    if action_logs.status_code == 200:
        action_data = action_logs.json()
        print(f"✅ Found {action_data['total']} role update actions\n")
    
    print("🎉 All admin tests completed!")


if __name__ == "__main__":
    test_admin()
