# src/message_drafter.py
"""
Draft personalised outreach messages using the Claude API.

The message is a short cold-outreach email (~100 words) from Samantha Lo,
a UBC Sauder BCom Finance student (Class of 2028, 4.0 GPA) applying for
internship / co-op roles at Canadian banks and consulting firms.
"""

import anthropic

CANDIDATE_BIO = (
    "Samantha Lo, UBC Sauder BCom Finance, Class of 2028, 4.0 GPA. "
    "Interests: financial modelling, DCF, capital markets. "
    "Bilingual: English and Cantonese. "
    "Seeking internship / co-op roles in finance and consulting."
)

SYSTEM_PROMPT = (
    "You are a career coach helping a university student write concise, "
    "professional cold-outreach emails to recruiters and hiring managers. "
    "Keep the email to 80-120 words. Be specific to the role and company. "
    "Use a friendly but professional tone. Do not use bullet points."
)


def draft_message(
    job_title: str,
    company: str,
    contact_name: str,
    anthropic_api_key: str,
) -> str:
    """
    Generate a personalised outreach email using Claude.
    Returns the drafted message as a string.
    Falls back to a template string on any error.
    """
    contact_greeting = f"Dear {contact_name}" if contact_name else "Dear Hiring Team"

    user_prompt = (
        f"Write a cold outreach email for this candidate:\n{CANDIDATE_BIO}\n\n"
        f"Target role: {job_title}\n"
        f"Company: {company}\n"
        f"Greeting: {contact_greeting}\n\n"
        "Write the full email body (greeting through sign-off). "
        "Sign off as Samantha Lo."
    )

    try:
        client = anthropic.Anthropic(api_key=anthropic_api_key)
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=300,
            messages=[{"role": "user", "content": user_prompt}],
            system=SYSTEM_PROMPT,
        )
        return message.content[0].text.strip()
    except Exception as e:
        print(f"[message_drafter] Claude API error for {company} {job_title}: {e}")
        return (
            f"{contact_greeting},\n\n"
            f"I am writing to express my interest in the {job_title} position at {company}. "
            f"As a UBC Sauder BCom Finance student (Class of 2028, 4.0 GPA) with a strong "
            f"background in financial modelling and capital markets, I believe I would be a "
            f"great fit for this role.\n\n"
            f"I would welcome the opportunity to discuss how my skills can contribute to {company}.\n\n"
            f"Best regards,\nSamantha Lo"
        )
