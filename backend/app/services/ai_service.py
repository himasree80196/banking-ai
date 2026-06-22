"""AI Service — provider abstraction layer for LLM responses.
Configure LLM_PROVIDER in .env:
  openai     — OpenAI GPT (set OPENAI_API_KEY)
  anthropic  — Anthropic Claude (set ANTHROPIC_API_KEY)
  ollama     — Local Ollama (free, no key needed)
  mock       — Built-in mock responses (no key needed, for testing)
"""
import logging
from typing import List, Dict, Tuple
from app.config import settings
logger = logging.getLogger(__name__)
BANKING_SYSTEM_PROMPT = """You are an expert AI banking assistant for SmartBank AI, a professional financial institution.
You provide accurate, helpful information about:
- Banking products and services (savings accounts, checking accounts, credit cards, personal loans, home loans, auto loans, mortgages)
- Personal finance advice (budgeting, saving strategies, emergency funds, debt management)
- Loan eligibility and credit score improvement
- Banking procedures, regulations, and compliance
- Interest rate calculations and financial planning
- Investment basics (FDs, mutual funds, bonds)
Guidelines:
- Always be professional, empathetic, accurate, and helpful
- For greetings like "hi", "hello", "hey" — respond warmly and briefly, then offer to help with banking questions
- For farewells like "bye", "goodbye", "see you" — respond warmly and briefly
- For thank-you messages — acknowledge warmly and offer further help
- Keep responses concise but thorough — use markdown formatting (headers, lists, tables) for clarity
- Include specific numbers and examples whenever useful
- Clarify that you provide general financial guidance, not personalized regulated advice
- For complex tax or legal decisions, recommend consulting a licensed advisor
- Respond in the same language the user writes in (multilingual support)
- If asked about the loan predictor, guide users to use the "Loan Predictor" feature in the sidebar
- Support both USD ($) and INR (₹) amounts — if the user mentions rupees or INR, respond with INR figures; if dollars or USD, use dollar figures"""
MOCK_RESPONSES = {
    "greeting": """Hi there! 👋 Welcome to **SmartBank AI Assistant**.
I'm here to help you with all your banking and financial questions. Here's what I can assist with:
- 🏦 **Loans** — eligibility, EMI calculations, home/personal/auto loans
- 💳 **Credit Score** — how to check and improve it
- 💰 **Savings & Investments** — FDs, mutual funds, budgeting tips
- 📊 **Interest Rates** — calculations, comparisons
- 🏠 **Mortgages** — home loan guidance
What can I help you with today?""",
    "farewell": """Goodbye! 👋 It was great chatting with you.
Feel free to come back anytime you have banking or financial questions. Have a wonderful day! 😊""",
    "thanks": """You're welcome! 😊 Happy to help.
If you have any more questions about banking, loans, or personal finance — I'm always here. Is there anything else I can assist you with?""",
    "howru": """I'm doing great, thank you for asking! 😊
I'm your SmartBank AI Assistant, ready to help with all your banking needs. What financial question can I help you with today?""",
    "default": """I'm your AI banking assistant! I can help you with:
**Banking Services**
- Savings & checking accounts
- Credit cards and loans
- Mortgages and home equity
**Financial Guidance**
- Budgeting and expense tracking
- Investment basics (FDs, mutual funds)
- Credit score improvement
**Loan Tools**
- Use our **Loan Predictor** in the sidebar for an instant AI-powered eligibility check
What banking question can I help you with today?""",
    "loan": """**Loan Eligibility — Key Factors**
Lenders evaluate your application based on:
| Factor | Weight | Ideal Value |
|--------|--------|-------------|
| Credit Score | 30% | 750+ |
| Debt-to-Income | 25% | Below 36% |
| Employment | 20% | Stable 2+ years |
| Income | 15% | Sufficient for EMI |
| Collateral | 10% | Owned property helps |
**Quick Tips to Improve Eligibility:**
1. Pay all bills on time — even one late payment hurts
2. Keep credit card utilization below 30%
3. Avoid applying for multiple loans at once
4. Pay down existing EMIs before applying
👉 Use our **Loan Predictor** in the sidebar for an instant eligibility check!""",
    "credit": """**How to Improve Your Credit Score**
Your credit score (300–900) is built from:
- **35%** Payment history — never miss a due date
- **30%** Credit utilization — keep it below 30%
- **15%** Length of credit history — keep old accounts open
- **10%** Credit mix — having loans + cards helps
- **10%** New inquiries — limit new applications
**Action Plan:**
1. ✅ Set up autopay for all bills
2. ✅ Request a credit limit increase (don't spend more)
3. ✅ Check your credit report for errors
4. ✅ Become an authorized user on a family member's old card
5. ✅ Pay off collections (especially recent ones)
Consistent good habits improve your score in 3–6 months.""",
    "savings": """**Best Savings Strategies**
**High-Yield Savings Account**
- Online banks offer 4.5–5.2% APY (USD) or 6–7% (INR FD)
- No lock-in, fully liquid
- Insured up to $250,000 (FDIC) / ₹5,00,000 (DICGC)
**The 50/30/20 Budget Rule:**
- 50% → Needs (rent, food, utilities)
- 30% → Wants (dining, entertainment)
- 20% → Savings & debt repayment
**Emergency Fund Goal:** 3–6 months of expenses in a liquid account
**Automation is key:** Set up automatic transfers on payday — you won't miss what you don't see.
Would you like help calculating how much you should save each month?""",
    "interest": """**Interest Rate Calculation Guide**
**EMI Formula:**
\```
EMI = P × r × (1 + r)^n / [(1 + r)^n - 1]
\```
Where: P = Principal | r = Monthly rate | n = Tenure (months)
**Example — $50,000 / ₹41,60,000 loan at 8% for 5 years:**
- Monthly rate: 8% ÷ 12 = 0.667%
- EMI: **$1,013/month** (≈ **₹84,500/month**)
- Total payment: $60,778 (≈ ₹50,64,900)
- Total interest: **$10,778** (≈ **₹8,98,700**)
**Types of Interest:**
- **Flat rate** — interest on full principal throughout (costs more)
- **Reducing balance** — interest on outstanding balance (cheaper, most loans)
- **Fixed vs floating** — fixed gives certainty; floating may save money if rates drop
Use our Loan Predictor to see your estimated EMI!""",
    "mortgage": """**Home Loan / Mortgage Guide**
**The 28/36 Rule:**
- Housing costs ≤ 28% of gross monthly income
- Total debt payments ≤ 36% of gross monthly income
**Documents You'll Need:**
1. Proof of income (3 months pay stubs or 2 years ITR for self-employed)
2. Bank statements (last 6 months)
3. Property documents
4. Identity & address proof
5. Employment verification
**Down Payment:** Most lenders require 10–20%
- 20%+ → No PMI (private mortgage insurance)
- FHA loans → As low as 3.5% (with 580+ credit score)
**Fixed vs ARM:**
- Fixed: Predictable payments, good if rates are low
- ARM: Lower initial rate, risk if rates rise
What's your approximate budget and location? I can give more tailored guidance.""",
    "inr": """**USD ↔ INR Currency Info**
Current approximate exchange rate: **1 USD ≈ ₹84**
**Common Loan Amounts:**
| USD | INR (approx) |
|-----|-------------|
| $1,000 | ₹84,000 |
| $5,000 | ₹4,20,000 |
| $10,000 | ₹8,40,000 |
| $50,000 | ₹42,00,000 |
| $1,00,000 | ₹84,00,000 |
💡 **Tip:** In our Loan Predictor, you can switch between USD and INR using the currency toggle at the top of the form. The system automatically converts INR values to USD for processing.
Is there a specific amount you'd like me to convert or explain?""",
}
async def get_ai_response(history: List[Dict], user_message: str) -> Tuple[str, int]:
    provider = settings.LLM_PROVIDER.lower().strip()
    logger.info(f"AI request via provider: {provider}")
    try:
        if provider == "openai":
            if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "sk-your-openai-api-key-here":
                return _smart_mock(user_message)
            return await _openai_response(history, user_message)
        elif provider == "anthropic":
            if not settings.ANTHROPIC_API_KEY:
                return _smart_mock(user_message)
            return await _anthropic_response(history, user_message)
        elif provider == "ollama":
            return await _ollama_response(history, user_message)
        else:
            return _smart_mock(user_message)
    except Exception as e:
        logger.error(f"AI provider error ({provider}): {type(e).__name__}: {e}")
        return _smart_mock(user_message)
async def _openai_response(history, user_message):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    messages = [{"role": "system", "content": BANKING_SYSTEM_PROMPT}] + history[-10:]
    response = await client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=1024, temperature=0.7)
    content = response.choices[0].message.content or ""
    tokens = response.usage.total_tokens if response.usage else len(content.split())
    return content, tokens
async def _anthropic_response(history, user_message):
    import anthropic
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = await client.messages.create(model=settings.ANTHROPIC_MODEL, max_tokens=1024, system=BANKING_SYSTEM_PROMPT, messages=history[-10:])
    content = response.content[0].text if response.content else ""
    tokens = (response.usage.input_tokens + response.usage.output_tokens) if response.usage else len(content.split())
    return content, tokens
async def _ollama_response(history, user_message):
    import aiohttp
    messages = [{"role": "system", "content": BANKING_SYSTEM_PROMPT}] + history[-10:]
    async with aiohttp.ClientSession() as session:
        payload = {"model": settings.OLLAMA_MODEL, "messages": messages, "stream": False}
        async with session.post(f"{settings.OLLAMA_BASE_URL}/api/chat", json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
            data = await resp.json()
            return data.get("message", {}).get("content", ""), 0
def _smart_mock(user_message: str) -> Tuple[str, int]:
    msg = user_message.lower().strip()
    # ── Greetings (checked FIRST) ──────────────────────────────────────────
    greetings = ["hi", "hello", "hey", "howdy", "greetings", "good morning",
                 "good afternoon", "good evening", "hii", "helo", "hola"]
    if any(msg == g or msg.startswith(g + " ") or msg.startswith(g + "!")
           or msg.startswith(g + ",") for g in greetings):
        r = MOCK_RESPONSES["greeting"]
        return r, len(r.split())
    # ── Farewells ──────────────────────────────────────────────────────────
    if any(k in msg for k in ["bye", "goodbye", "good bye", "see you",
                               "see ya", "take care", "cya", "ttyl", "adios"]):
        r = MOCK_RESPONSES["farewell"]
        return r, len(r.split())
    # ── Thank you ──────────────────────────────────────────────────────────
    if any(k in msg for k in ["thank", "thanks", "thx", "ty", "grateful", "appreciate"]):
        r = MOCK_RESPONSES["thanks"]
        return r, len(r.split())
    # ── How are you ───────────────────────────────────────────────────────
    if any(k in msg for k in ["how are you", "how r u", "what's up",
                               "whats up", "wassup", "sup"]):
        r = MOCK_RESPONSES["howru"]
        return r, len(r.split())
    # ── Currency / INR ────────────────────────────────────────────────────
    if any(k in msg for k in ["inr", "rupee", "rupees", "₹", "exchange rate", "convert"]):
        r = MOCK_RESPONSES["inr"]
        return r, len(r.split())
    # ── Topic matching ────────────────────────────────────────────────────
    if any(k in msg for k in ["credit score", "cibil", "credit report", "fico"]):
        r = MOCK_RESPONSES["credit"]
    elif any(k in msg for k in ["loan", "borrow", "emi", "eligib", "qualify"]):
        r = MOCK_RESPONSES["loan"]
    elif any(k in msg for k in ["mortgage", "home loan", "house", "property"]):
        r = MOCK_RESPONSES["mortgage"]
    elif any(k in msg for k in ["interest", "rate", "apy", "apr", "calculation"]):
        r = MOCK_RESPONSES["interest"]
    elif any(k in msg for k in ["save", "saving", "budget", "emergency fund", "invest"]):
        r = MOCK_RESPONSES["savings"]
    else:
        r = MOCK_RESPONSES["default"]
    return r, len(r.split())