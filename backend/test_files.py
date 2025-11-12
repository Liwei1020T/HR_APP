"""
Test script for Files API.
Run this after starting the server: uvicorn app.main:app --reload
"""
import requests
import io

BASE_URL = "http://localhost:8000/api/v1"


def test_files():
    """Test file upload/download system."""
    print("🧪 Testing Files System\n")
    
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
    
    # 3. Employee uploads a text file
    print("3️⃣ Employee uploads a text file...")
    text_content = b"This is a test document for the HR feedback system."
    text_file = io.BytesIO(text_content)
    
    upload_response = requests.post(
        f"{BASE_URL}/files",
        headers=emp_headers,
        files={"file": ("test_document.txt", text_file, "text/plain")}
    )
    
    if upload_response.status_code == 201:
        file1 = upload_response.json()
        file1_id = file1["id"]
        print(f"✅ File uploaded successfully (ID: {file1_id})")
        print(f"   Original name: {file1['original_filename']}")
        print(f"   Size: {file1['size']} bytes")
        print(f"   Type: {file1['content_type']}")
        print(f"   Uploader: {file1['uploader_name']}\n")
    else:
        print(f"❌ Upload failed: {upload_response.text}\n")
        return
    
    # 4. Employee uploads an image with entity attachment
    print("4️⃣ Employee uploads an image (attached to feedback)...")
    # Create a simple 1x1 pixel PNG
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    image_file = io.BytesIO(png_data)
    
    upload_response2 = requests.post(
        f"{BASE_URL}/files?entity_type=feedback&entity_id=1",
        headers=emp_headers,
        files={"file": ("screenshot.png", image_file, "image/png")}
    )
    
    if upload_response2.status_code == 201:
        file2 = upload_response2.json()
        file2_id = file2["id"]
        print(f"✅ Image uploaded and attached (ID: {file2_id})")
        print(f"   Attached to: {file2['entity_type']} #{file2['entity_id']}\n")
    else:
        print(f"❌ Upload failed: {upload_response2.text}\n")
    
    # 5. Try to upload a file that's too large (should fail)
    print("5️⃣ Try to upload file exceeding size limit...")
    large_content = b"x" * (11 * 1024 * 1024)  # 11MB > 10MB limit
    large_file = io.BytesIO(large_content)
    
    large_upload = requests.post(
        f"{BASE_URL}/files",
        headers=emp_headers,
        files={"file": ("large_file.txt", large_file, "text/plain")}
    )
    
    if large_upload.status_code == 400:
        print(f"✅ Correctly blocked: {large_upload.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {large_upload.status_code}\n")
    
    # 6. Try to upload unsupported file type (should fail)
    print("6️⃣ Try to upload unsupported file type...")
    exe_file = io.BytesIO(b"fake exe content")
    
    exe_upload = requests.post(
        f"{BASE_URL}/files",
        headers=emp_headers,
        files={"file": ("virus.exe", exe_file, "application/x-msdownload")}
    )
    
    if exe_upload.status_code == 400:
        print(f"✅ Correctly blocked: {exe_upload.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {exe_upload.status_code}\n")
    
    # 7. Employee lists their uploaded files
    print("7️⃣ Employee lists their uploaded files...")
    my_files = requests.get(f"{BASE_URL}/files/me", headers=emp_headers)
    files_data = my_files.json()
    print(f"✅ Found {files_data['total']} files:")
    for f in files_data['files']:
        attach = f" → {f['entity_type']} #{f['entity_id']}" if f['entity_type'] else ""
        print(f"   • {f['original_filename']} ({f['size']} bytes){attach}")
    print()
    
    # 8. Download a file
    print("8️⃣ Download a file...")
    download_response = requests.get(
        f"{BASE_URL}/files/{file1_id}",
        headers=emp_headers
    )
    
    if download_response.status_code == 200:
        downloaded_content = download_response.content
        print(f"✅ File downloaded successfully")
        print(f"   Size: {len(downloaded_content)} bytes")
        print(f"   Content preview: {downloaded_content[:50].decode()}...\n")
    else:
        print(f"❌ Download failed: {download_response.text}\n")
    
    # 9. HR uploads a file
    print("9️⃣ HR uploads a PDF file...")
    pdf_content = b"%PDF-1.4 fake pdf content"
    pdf_file = io.BytesIO(pdf_content)
    
    hr_upload = requests.post(
        f"{BASE_URL}/files",
        headers=hr_headers,
        files={"file": ("policy_document.pdf", pdf_file, "application/pdf")}
    )
    
    if hr_upload.status_code == 201:
        file3 = hr_upload.json()
        file3_id = file3["id"]
        print(f"✅ HR uploaded PDF (ID: {file3_id})\n")
    else:
        print(f"❌ Upload failed: {hr_upload.text}\n")
        return
    
    # 10. HR attaches their file to an announcement
    print("🔟 HR attaches file to announcement...")
    attach_response = requests.patch(
        f"{BASE_URL}/files/{file3_id}/attach",
        headers=hr_headers,
        json={"entity_type": "announcement", "entity_id": 1}
    )
    
    if attach_response.status_code == 200:
        attached = attach_response.json()
        print(f"✅ File attached to {attached['entity_type']} #{attached['entity_id']}\n")
    else:
        print(f"❌ Attach failed: {attach_response.text}\n")
    
    # 11. Employee tries to attach HR's file (should fail)
    print("1️⃣1️⃣ Employee tries to attach HR's file (should fail)...")
    emp_attach = requests.patch(
        f"{BASE_URL}/files/{file3_id}/attach",
        headers=emp_headers,
        json={"entity_type": "feedback", "entity_id": 2}
    )
    
    if emp_attach.status_code == 403:
        print(f"✅ Correctly blocked: {emp_attach.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_attach.status_code}\n")
    
    # 12. Get files attached to an entity
    print("1️⃣2️⃣ Get files attached to announcement #1...")
    entity_files = requests.get(
        f"{BASE_URL}/files/entity/announcement/1",
        headers=emp_headers
    )
    
    entity_data = entity_files.json()
    print(f"✅ Found {entity_data['total']} file(s) attached:")
    for f in entity_data['files']:
        print(f"   • {f['original_filename']} (uploaded by {f['uploader_name']})")
    print()
    
    # 13. Employee deletes their own file
    print("1️⃣3️⃣ Employee deletes their own file...")
    delete_response = requests.delete(
        f"{BASE_URL}/files/{file1_id}",
        headers=emp_headers
    )
    
    if delete_response.status_code == 204:
        print(f"✅ File deleted successfully\n")
    else:
        print(f"❌ Delete failed: {delete_response.text}\n")
    
    # 14. Employee tries to delete HR's file (should fail)
    print("1️⃣4️⃣ Employee tries to delete HR's file (should fail)...")
    emp_delete = requests.delete(
        f"{BASE_URL}/files/{file3_id}",
        headers=emp_headers
    )
    
    if emp_delete.status_code == 403:
        print(f"✅ Correctly blocked: {emp_delete.json()['detail']}\n")
    else:
        print(f"❌ Should have been blocked but got: {emp_delete.status_code}\n")
    
    # 15. Verify deleted file is gone
    print("1️⃣5️⃣ Verify deleted file is gone...")
    download_deleted = requests.get(
        f"{BASE_URL}/files/{file1_id}",
        headers=emp_headers
    )
    
    if download_deleted.status_code == 404:
        print(f"✅ Deleted file correctly returns 404\n")
    else:
        print(f"❌ Should have returned 404 but got: {download_deleted.status_code}\n")
    
    # 16. Final file list
    print("1️⃣6️⃣ Final file list for employee...")
    final_list = requests.get(f"{BASE_URL}/files/me", headers=emp_headers)
    final_data = final_list.json()
    print(f"✅ Employee has {final_data['total']} file(s) remaining:")
    for f in final_data['files']:
        print(f"   • {f['original_filename']}")
    
    print("\n🎉 All file tests completed!")


if __name__ == "__main__":
    test_files()
