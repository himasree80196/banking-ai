"""Seed demo data into the database."""
import asyncio
import logging
from datetime import datetime, timezone
from app.database import AsyncSessionLocal, init_db
from app.models.user import User, UserRole
from app.models.chat import ChatSession, ChatMessage
from app.models.loan import LoanPrediction
from app.utils.security import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        # Admin user
        admin = User(
            email="admin@bank.com",
            username="admin",
            full_name="Bank Administrator",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # Regular user
        user = User(
            email="user@bank.com",
            username="johndoe",
            full_name="John Doe",
            hashed_password=hash_password("User@123"),
            role=UserRole.USER,
            is_active=True,
            is_verified=True,
            phone="+1-555-0100",
        )
        db.add(user)
        await db.flush()

        # Demo chat session
        session = ChatSession(user_id=user.id, title="Banking Help Chat")
        db.add(session)
        await db.flush()

        msgs = [
            ChatMessage(session_id=session.id, role="user", content="What is the best savings account?"),
            ChatMessage(session_id=session.id, role="assistant", content="Great question! High-yield savings accounts typically offer the best returns. Look for accounts with APY above 4.5% and no monthly fees.\n\n**Top features to look for:**\n- High APY (4.5%+)\n- No minimum balance\n- FDIC insured\n- Easy mobile access"),
            ChatMessage(session_id=session.id, role="user", content="How do I improve my credit score?"),
            ChatMessage(session_id=session.id, role="assistant", content="Here are proven strategies to boost your credit score:\n\n1. **Pay on time** — Payment history is 35% of your score\n2. **Reduce utilization** — Keep credit card usage below 30%\n3. **Don't close old accounts** — Length of history matters\n4. **Limit new applications** — Hard inquiries temporarily lower your score\n5. **Monitor your report** — Check for errors at AnnualCreditReport.com"),
        ]
        for m in msgs:
            db.add(m)

        # Demo loan predictions
        loans = [
            LoanPrediction(user_id=user.id, age=32, gender="Male", employment_status="Employed", occupation="Software Engineer", monthly_income=8000, existing_emi=500, loan_amount=50000, loan_tenure=60, credit_score=750, marital_status="Single", dependents=0, education="Bachelor", residential_status="Rented", is_eligible=True, approval_probability=0.87, risk_score=13.0, explanation="Strong application with excellent credit and stable employment.", recommendations="Maintain credit score above 750 for best rates."),
            LoanPrediction(user_id=user.id, age=45, gender="Female", employment_status="Self-Employed", occupation="Business Owner", monthly_income=5000, existing_emi=1200, loan_amount=80000, loan_tenure=84, credit_score=620, marital_status="Married", dependents=2, education="Master", residential_status="Owned", is_eligible=False, approval_probability=0.38, risk_score=62.0, explanation="High debt-to-income ratio and below-average credit score reduce eligibility.", recommendations="Reduce existing EMI obligations and improve credit score above 680."),
        ]
        for l in loans:
            db.add(l)

        await db.commit()
        logger.info("✅ Demo data seeded successfully!")
        logger.info("   Admin: admin@bank.com / Admin@123")
        logger.info("   User:  user@bank.com  / User@123")


if __name__ == "__main__":
    asyncio.run(seed())
