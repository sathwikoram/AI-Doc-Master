"""
seed_data.py  —  Run once to populate the database with sample data
for testing and demonstration.

Usage:
  cd backend
  python seed_data.py
"""
import asyncio
import sys
from pathlib import Path

# Make sure app is importable
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select
from app.database import AsyncSessionLocal, create_tables
from app.models.user import User, UserRole
from app.models.advocate import Advocate
from app.models.case import Case, CaseStatus, CasePriority
from app.models.notification import Notification, NotificationType
from app.core.security import hash_password


# ── Sample data ────────────────────────────────────────────────────────────────
USERS = [
    # Admin
    {
        "full_name": "Admin User",
        "email": "admin@aidocmaster.com",
        "phone": "+91 98000 00001",
        "password": "admin123!",
        "role": UserRole.admin,
        "is_verified": True,
    },
    # Citizens
    {
        "full_name": "Rajesh Kumar",
        "email": "rajesh@example.com",
        "phone": "+91 98765 43210",
        "password": "citizen123!",
        "role": UserRole.citizen,
        "is_verified": True,
    },
    {
        "full_name": "Priya Sharma",
        "email": "priya@example.com",
        "phone": "+91 91234 56789",
        "password": "citizen123!",
        "role": UserRole.citizen,
        "is_verified": True,
    },
    {
        "full_name": "Anitha Devi",
        "email": "anitha@example.com",
        "phone": "+91 87654 32109",
        "password": "citizen123!",
        "role": UserRole.citizen,
        "is_verified": True,
    },
    # Advocates
    {
        "full_name": "Adv. Suresh Babu",
        "email": "suresh.adv@example.com",
        "phone": "+91 99887 76655",
        "password": "advocate123!",
        "role": UserRole.advocate,
        "is_verified": True,
    },
    {
        "full_name": "Adv. Meena Krishnan",
        "email": "meena.adv@example.com",
        "phone": "+91 99001 12233",
        "password": "advocate123!",
        "role": UserRole.advocate,
        "is_verified": True,
    },
    {
        "full_name": "Adv. Vikram Pandey",
        "email": "vikram.adv@example.com",
        "phone": "+91 88990 01122",
        "password": "advocate123!",
        "role": UserRole.advocate,
        "is_verified": True,
    },
    {
        "full_name": "Adv. Lakshmi Venkat",
        "email": "lakshmi.adv@example.com",
        "phone": "+91 77889 90011",
        "password": "advocate123!",
        "role": UserRole.advocate,
        "is_verified": False,  # Pending verification
    },
]

ADVOCATES = [
    {
        "email": "suresh.adv@example.com",
        "bar_council_number": "TN/1234/2010",
        "qualification": "LLB, LLM",
        "years_of_experience": 13,
        "practice_areas": ["Criminal", "Property Dispute", "Civil"],
        "court_location": "Madras High Court",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "total_cases": 145,
        "won_cases": 98,
        "rating": 4.6,
        "rating_count": 87,
        "is_verified": True,
        "is_available": True,
        "profile_bio": "Experienced criminal and civil lawyer with 13 years at Madras High Court. Specializes in property disputes and criminal defense.",
        "languages": ["Tamil", "English", "Hindi"],
    },
    {
        "email": "meena.adv@example.com",
        "bar_council_number": "TN/5678/2015",
        "qualification": "LLB",
        "years_of_experience": 8,
        "practice_areas": ["Family Law", "Consumer Dispute", "Labour & Employment"],
        "court_location": "District Court, Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "total_cases": 82,
        "won_cases": 61,
        "rating": 4.8,
        "rating_count": 54,
        "is_verified": True,
        "is_available": True,
        "profile_bio": "Family and labour law specialist. Known for empathetic client handling and efficient case resolution.",
        "languages": ["Tamil", "English"],
    },
    {
        "email": "vikram.adv@example.com",
        "bar_council_number": "MH/9012/2012",
        "qualification": "LLB, LLM (Corporate)",
        "years_of_experience": 11,
        "practice_areas": ["Constitutional/Public Law", "Criminal", "Cyber Crime"],
        "court_location": "Bombay High Court",
        "city": "Mumbai",
        "state": "Maharashtra",
        "total_cases": 210,
        "won_cases": 156,
        "rating": 4.7,
        "rating_count": 120,
        "is_verified": True,
        "is_available": True,
        "profile_bio": "Constitutional and criminal law expert with extensive High Court experience. Handled several landmark PIL cases.",
        "languages": ["English", "Hindi", "Marathi"],
    },
    {
        "email": "lakshmi.adv@example.com",
        "bar_council_number": "KA/3456/2019",
        "qualification": "LLB",
        "years_of_experience": 4,
        "practice_areas": ["Consumer Dispute", "Civil", "Property Dispute"],
        "court_location": "City Civil Court, Bangalore",
        "city": "Bangalore",
        "state": "Karnataka",
        "total_cases": 28,
        "won_cases": 19,
        "rating": 4.2,
        "rating_count": 22,
        "is_verified": False,
        "is_available": True,
        "profile_bio": "Junior advocate specializing in consumer protection and civil matters.",
        "languages": ["Kannada", "English", "Tamil"],
    },
]

SAMPLE_CASES = [
    {
        "citizen_email": "rajesh@example.com",
        "title": "Illegal Encroachment on Ancestral Land by Neighbour",
        "description": (
            "My neighbour has encroached upon approximately 200 sq ft of my ancestral land by "
            "illegally constructing a compound wall 2 feet inside my property boundary. "
            "I have the original sale deed, encumbrance certificate, and tax receipts as proof. "
            "Despite sending legal notice 3 months ago, no action has been taken. "
            "I need legal help to remove the encroachment and restore my boundary."
        ),
        "category": "Property Dispute",
        "priority": CasePriority.high,
        "status": CaseStatus.ai_analyzed,
        "court_location": "Chennai, Tamil Nadu",
        "tags": ["property", "encroachment", "boundary", "land"],
    },
    {
        "citizen_email": "priya@example.com",
        "title": "Online Fraud - Lost ₹85,000 to Fake Investment Scheme",
        "description": (
            "I received a WhatsApp message from an unknown number claiming to be from a reputed "
            "investment firm. They promised 40% returns in 30 days. I transferred ₹85,000 in "
            "two installments. After the payment, they became unreachable. I have bank transfer "
            "receipts, chat screenshots, and the WhatsApp number. I want to file a cyber crime "
            "complaint and recover my money."
        ),
        "category": "Cyber Crime",
        "priority": CasePriority.urgent,
        "status": CaseStatus.lawyer_assigned,
        "court_location": "Chennai, Tamil Nadu",
        "tags": ["cyber crime", "fraud", "online", "investment"],
    },
    {
        "citizen_email": "anitha@example.com",
        "title": "Wrongful Termination Without Notice Period",
        "description": (
            "I was working at a private company for 6 years. On 15th March 2024, the HR called "
            "me and verbally terminated my employment, claiming 'organizational restructuring'. "
            "No formal letter was issued, no notice period given, and 3 months' salary is still "
            "pending. I have appointment letter, salary slips, and PF statements. "
            "I want to claim my dues and challenge the illegal termination."
        ),
        "category": "Labour & Employment",
        "priority": CasePriority.high,
        "status": CaseStatus.accepted,
        "court_location": "Chennai, Tamil Nadu",
        "tags": ["employment", "termination", "salary", "labour"],
    },
]


async def seed():
    print("Starting database seed...")

    # Ensure tables exist
    await create_tables()
    print("✓ Tables ready")

    async with AsyncSessionLocal() as db:
        # ── Create users ────────────────────────────────────────────────────────
        user_map = {}  # email → User obj

        for u_data in USERS:
            # Check if already exists
            result = await db.execute(select(User).where(User.email == u_data["email"]))
            existing = result.scalar_one_or_none()

            if existing:
                user_map[u_data["email"]] = existing
                print(f"  -- User already exists: {u_data['email']}")
                continue

            user = User(
                full_name=u_data["full_name"],
                email=u_data["email"],
                phone=u_data.get("phone"),
                hashed_password=hash_password(u_data["password"]),
                role=u_data["role"],
                is_active=True,
                is_verified=u_data.get("is_verified", False),
            )
            db.add(user)
            await db.flush()
            await db.refresh(user)
            user_map[u_data["email"]] = user
            print(f"  OK Created user: {u_data['email']} [{u_data['role'].value}]")

        # ── Create advocate profiles ────────────────────────────────────────────
        adv_map = {}  # email → Advocate obj

        for a_data in ADVOCATES:
            email = a_data.pop("email")
            user = user_map.get(email)
            if not user:
                print(f"  ✗ User not found for advocate: {email}")
                a_data["email"] = email
                continue

            # Check if already exists
            result = await db.execute(select(Advocate).where(Advocate.user_id == user.id))
            existing = result.scalar_one_or_none()

            if existing:
                adv_map[email] = existing
                print(f"  -- Advocate already exists: {email}")
                a_data["email"] = email
                continue

            adv = Advocate(user_id=user.id, **a_data)
            db.add(adv)
            await db.flush()
            await db.refresh(adv)
            adv_map[email] = adv
            a_data["email"] = email
            print(f"  OK Created advocate: {email}")

        # ── Create sample cases ─────────────────────────────────────────────────
        for c_data in SAMPLE_CASES:
            citizen_email = c_data.pop("citizen_email")
            citizen = user_map.get(citizen_email)
            if not citizen:
                c_data["citizen_email"] = citizen_email
                continue

            # Assign an advocate for assigned/accepted cases
            advocate_id = None
            if c_data.get("status") in [CaseStatus.lawyer_assigned, CaseStatus.accepted]:
                if c_data["category"] == "Cyber Crime":
                    adv = adv_map.get("vikram.adv@example.com")
                elif c_data["category"] == "Labour & Employment":
                    adv = adv_map.get("meena.adv@example.com")
                else:
                    adv = adv_map.get("suresh.adv@example.com")
                advocate_id = adv.id if adv else None

            # Check duplicate
            result = await db.execute(select(Case).where(
                Case.citizen_id == citizen.id,
                Case.title == c_data["title"]
            ))
            if result.scalar_one_or_none():
                print(f"  -- Case already exists: {c_data['title'][:40]}")
                c_data["citizen_email"] = citizen_email
                continue

            case = Case(
                citizen_id=citizen.id,
                advocate_id=advocate_id,
                title=c_data["title"],
                description=c_data["description"],
                category=c_data.get("category"),
                priority=c_data.get("priority", CasePriority.medium),
                status=c_data.get("status", CaseStatus.pending),
                court_location=c_data.get("court_location"),
                tags=c_data.get("tags", []),
                ai_analysis={
                    "classification": {
                        "category": c_data.get("category"),
                        "confidence": 0.91,
                        "method": "keyword",
                    }
                },
            )
            db.add(case)
            await db.flush()
            print(f"  OK Created case: {c_data['title'][:50]}")
            c_data["citizen_email"] = citizen_email

        # ── Welcome notifications ───────────────────────────────────────────────
        for email, user in user_map.items():
            result = await db.execute(select(Notification).where(Notification.user_id == user.id))
            if result.scalars().first():
                continue
            notif = Notification(
                user_id=user.id,
                title="Welcome to AI DocMaster!",
                message="Your account has been set up. Start by submitting a case or exploring the platform.",
                type=NotificationType.system,
            )
            db.add(notif)

        await db.commit()
        print("\nDatabase seeded successfully!")
        print("\nLogin Credentials:")
        print("  Admin:    admin@aidocmaster.com    / admin123!")
        print("  Citizen:  rajesh@example.com       / citizen123!")
        print("  Citizen:  priya@example.com        / citizen123!")
        print("  Advocate: suresh.adv@example.com   / advocate123!")
        print("  Advocate: meena.adv@example.com    / advocate123!")
        print("  Advocate: vikram.adv@example.com   / advocate123!")


if __name__ == "__main__":
    asyncio.run(seed())
