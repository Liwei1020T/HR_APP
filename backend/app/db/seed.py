"""
Database seed script - creates initial data.
Run this after migrations: python -m app.db.seed
"""
import sys
from pathlib import Path
from datetime import datetime, timedelta

# Add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.modules.users.models import User, UserRole
from app.modules.channels.models import Channel, ChannelMember, MemberRole
from app.modules.feedback.models import Feedback, FeedbackComment, FeedbackStatus, FeedbackCategory
from app.modules.announcements.models import Announcement, AnnouncementCategory

# Import all models to ensure they're registered
from app.modules.users.models import User  # noqa: F401
from app.modules.channels.models import Channel, ChannelMember  # noqa: F401
from app.modules.feedback.models import Feedback, FeedbackComment  # noqa: F401
from app.modules.announcements.models import Announcement  # noqa: F401
from app.modules.notifications.models import Notification  # noqa: F401
from app.modules.files.models import File  # noqa: F401
from app.modules.admin.models import AuditLog  # noqa: F401


def seed_database():
    """Seed the database with initial data."""
    print("🌱 Seeding database...")

    # Create engine and session
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        # Create tables (in case migrations haven't run)
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created/verified")

        # Check if superadmin exists
        existing_superadmin = (
            db.query(User).filter(User.email == "superadmin@company.com").first()
        )

        if existing_superadmin:
            print("ℹ️  Superadmin already exists")
        else:
            # Create superadmin
            superadmin = User(
                email="superadmin@company.com",
                password_hash=hash_password("Admin123!"),
                name="Super Admin",
                role=UserRole.SUPERADMIN,
                is_active=True,
            )
            db.add(superadmin)
            print("✅ Created superadmin user")

        # Create HR user
        existing_hr = db.query(User).filter(User.email == "hr@company.com").first()
        if not existing_hr:
            hr_user = User(
                email="hr@company.com",
                password_hash=hash_password("Hr123!"),
                name="HR Manager",
                department="Human Resources",
                role=UserRole.HR,
                is_active=True,
            )
            db.add(hr_user)
            print("✅ Created HR user")

        # Create employee user
        existing_employee = db.query(User).filter(User.email == "employee@company.com").first()
        if not existing_employee:
            employee = User(
                email="employee@company.com",
                password_hash=hash_password("Employee123!"),
                name="John Doe",
                department="Engineering",
                role=UserRole.EMPLOYEE,
                is_active=True,
            )
            db.add(employee)
            print("✅ Created employee user")
        
        # Create admin user
        existing_admin = db.query(User).filter(User.email == "admin@company.com").first()
        if not existing_admin:
            admin = User(
                email="admin@company.com",
                password_hash=hash_password("Admin123!"),
                name="Admin User",
                department="IT",
                role=UserRole.ADMIN,
                is_active=True,
            )
            db.add(admin)
            print("✅ Created admin user")
        
        # Create additional employees
        employees_data = [
            ("jane.smith@company.com", "Jane Smith", "Marketing"),
            ("mike.johnson@company.com", "Mike Johnson", "Sales"),
            ("sarah.wilson@company.com", "Sarah Wilson", "Engineering"),
        ]
        
        for email, name, dept in employees_data:
            existing = db.query(User).filter(User.email == email).first()
            if not existing:
                user = User(
                    email=email,
                    password_hash=hash_password("Employee123!"),
                    name=name,
                    department=dept,
                    role=UserRole.EMPLOYEE,
                    is_active=True,
                )
                db.add(user)
        print("✅ Created additional employee users")

        db.commit()
        
        # Get created users
        superadmin = db.query(User).filter(User.email == "superadmin@company.com").first()
        hr_user = db.query(User).filter(User.email == "hr@company.com").first()
        employee = db.query(User).filter(User.email == "employee@company.com").first()
        admin = db.query(User).filter(User.email == "admin@company.com").first()
        jane = db.query(User).filter(User.email == "jane.smith@company.com").first()
        mike = db.query(User).filter(User.email == "mike.johnson@company.com").first()
        sarah = db.query(User).filter(User.email == "sarah.wilson@company.com").first()
        
        all_users = [u for u in [superadmin, hr_user, employee, admin, jane, mike, sarah] if u]
        
        # Create default channels
        existing_general = db.query(Channel).filter(Channel.name == "general").first()
        if not existing_general:
            general_channel = Channel(
                name="general",
                description="General company announcements and discussions",
                is_public=True,
                created_by=hr_user.id,
            )
            db.add(general_channel)
            db.flush()  # Get the ID
            
            # Add all users as members
            for user in all_users:
                db.add(ChannelMember(
                    user_id=user.id,
                    channel_id=general_channel.id,
                    role=MemberRole.MEMBER,
                ))
            print("✅ Created 'general' channel with all users")
        
        existing_hr = db.query(Channel).filter(Channel.name == "hr-announcements").first()
        if not existing_hr:
            hr_channel = Channel(
                name="hr-announcements",
                description="HR policies, benefits, and important updates",
                is_public=True,
                created_by=hr_user.id,
            )
            db.add(hr_channel)
            db.flush()
            
            # Add HR as moderator
            db.add(ChannelMember(
                user_id=hr_user.id,
                channel_id=hr_channel.id,
                role=MemberRole.MODERATOR,
            ))
            # Add other users as members
            for user in [employee, jane, mike, sarah]:
                if user:
                    db.add(ChannelMember(
                        user_id=user.id,
                        channel_id=hr_channel.id,
                        role=MemberRole.MEMBER,
                    ))
            print("✅ Created 'hr-announcements' channel")
        
        # Create engineering channel
        existing_eng = db.query(Channel).filter(Channel.name == "engineering").first()
        if not existing_eng:
            eng_channel = Channel(
                name="engineering",
                description="Engineering team discussions",
                is_public=False,
                created_by=employee.id if employee else hr_user.id,
            )
            db.add(eng_channel)
            db.flush()
            
            # Add engineering team members
            for user in [employee, sarah]:
                if user:
                    db.add(ChannelMember(
                        user_id=user.id,
                        channel_id=eng_channel.id,
                        role=MemberRole.MEMBER,
                    ))
            print("✅ Created 'engineering' private channel")
        
        db.commit()
        
        # Create sample feedback
        general_channel = db.query(Channel).filter(Channel.name == "general").first()
        
        feedback_data = [
            {
                "title": "Office Temperature Too Cold",
                "content": "The air conditioning is set too cold in the main office. Many employees are complaining about the temperature.",
                "category": FeedbackCategory.WORKPLACE.value,
                "status": FeedbackStatus.PENDING.value,
                "submitted_by": employee.id if employee else None,
                "is_anonymous": False,
            },
            {
                "title": "Request for Remote Work Policy",
                "content": "Can we establish a clear remote work policy? Many employees would benefit from flexibility.",
                "category": FeedbackCategory.BENEFITS.value,
                "status": FeedbackStatus.REVIEWED.value,
                "submitted_by": jane.id if jane else None,
                "assigned_to": hr_user.id,
                "is_anonymous": False,
            },
            {
                "title": "Parking Space Issues",
                "content": "There aren't enough parking spaces for all employees. This has been an ongoing issue.",
                "category": FeedbackCategory.WORKPLACE.value,
                "status": FeedbackStatus.PENDING.value,
                "submitted_by": mike.id if mike else None,
                "is_anonymous": False,
            },
            {
                "title": "Anonymous Feedback About Team Communication",
                "content": "Some team members are not responding to emails in a timely manner, affecting project progress.",
                "category": FeedbackCategory.OTHER.value,
                "status": FeedbackStatus.RESOLVED.value,
                "submitted_by": sarah.id if sarah else None,
                "assigned_to": hr_user.id,
                "is_anonymous": True,
            },
        ]
        
        existing_feedback = db.query(Feedback).count()
        if existing_feedback == 0:
            for idx, feedback_info in enumerate(feedback_data, 1):
                feedback = Feedback(**feedback_info)
                db.add(feedback)
                db.flush()
                
                # Add a comment to some feedback
                if idx == 2:
                    comment = FeedbackComment(
                        feedback_id=feedback.id,
                        user_id=hr_user.id,
                        comment="We are reviewing parking options with building management.",
                    )
                    db.add(comment)
                elif idx == 4:
                    comment = FeedbackComment(
                        feedback_id=feedback.id,
                        user_id=hr_user.id,
                        comment="We've addressed this in the team meeting. Issue resolved.",
                    )
                    db.add(comment)
            
            print(f"✅ Created {len(feedback_data)} sample feedback items")
        
        db.commit()
        
        # Create sample announcements
        announcements_data = [
            {
                "title": "Welcome to the New HR Portal",
                "content": "We're excited to launch our new HR portal for employee feedback, announcements, and internal communication. Please explore the features and provide feedback!",
                "category": AnnouncementCategory.GENERAL,
                "is_pinned": True,
                "created_by": hr_user.id,
            },
            {
                "title": "Updated Remote Work Policy",
                "content": "Effective next month, employees can work remotely up to 2 days per week. Please coordinate with your manager and submit requests through the portal.",
                "category": AnnouncementCategory.POLICY,
                "is_pinned": True,
                "created_by": hr_user.id,
            },
            {
                "title": "Company Holiday Party - December 20th",
                "content": "Join us for our annual holiday celebration! Food, drinks, and entertainment. RSVP by December 10th.",
                "category": AnnouncementCategory.EVENT,
                "is_pinned": False,
                "created_by": hr_user.id,
                "expires_at": datetime.utcnow() + timedelta(days=30),
            },
            {
                "title": "New Health Insurance Benefits",
                "content": "We've expanded our health insurance options. Review the new plans and make your selections during open enrollment.",
                "category": AnnouncementCategory.BENEFIT,
                "is_pinned": False,
                "created_by": hr_user.id,
            },
        ]
        
        existing_announcements = db.query(Announcement).count()
        if existing_announcements == 0:
            for announcement_info in announcements_data:
                announcement = Announcement(**announcement_info)
                db.add(announcement)
            
            print(f"✅ Created {len(announcements_data)} sample announcements")
        
        db.commit()
        
        print("\n🎉 Database seeded successfully!")
        print("\n📋 Default Users:")
        print("   Superadmin: superadmin@company.com / Admin123!")
        print("   Admin:      admin@company.com / Admin123!")
        print("   HR:         hr@company.com / Hr123!")
        print("   Employee:   employee@company.com / Employee123!")
        print("   Jane:       jane.smith@company.com / Employee123!")
        print("   Mike:       mike.johnson@company.com / Employee123!")
        print("   Sarah:      sarah.wilson@company.com / Employee123!")
        print("\n📺 Default Channels:")
        print("   • general (public, 7 members)")
        print("   • hr-announcements (public, 5 members)")
        print("   • engineering (private, 2 members)")
        print("\n📝 Sample Data:")
        print(f"   • {len(feedback_data)} feedback items (various statuses)")
        print(f"   • {len(announcements_data)} announcements (2 pinned)")
        print(f"   • Feedback comments and assignments")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
