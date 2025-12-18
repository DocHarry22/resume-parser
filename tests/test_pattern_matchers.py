"""
Tests for enhanced pattern matchers.
"""

import pytest
from app.utils.pattern_matchers import (
    EmailMatcher, PhoneMatcher, URLMatcher,
    DateRangeMatcher, NameMatcher, LocationMatcher
)


class TestEmailMatcher:
    def test_basic_email(self):
        text = "Contact me at john.doe@example.com for more info"
        assert EmailMatcher.extract(text) == "john.doe@example.com"
    
    def test_email_with_label(self):
        text = "Email: john.doe@company.org"
        assert EmailMatcher.extract(text) == "john.doe@company.org"
    
    def test_email_with_spaces(self):
        text = "john.doe @ example . com"
        result = EmailMatcher.extract(text)
        assert result == "john.doe@example.com" or result is None
    
    def test_no_email(self):
        text = "No email address here"
        assert EmailMatcher.extract(text) is None
    
    def test_multiple_emails(self):
        text = "Email1: first@test.com and second@test.com"
        # Should get first one
        assert EmailMatcher.extract(text) == "first@test.com"


class TestPhoneMatcher:
    def test_us_format_dashes(self):
        text = "Call me at 555-123-4567"
        result = PhoneMatcher.extract(text)
        assert result is not None
        assert '555' in result and '123' in result and '4567' in result
    
    def test_us_format_parens(self):
        text = "Phone: (555) 123-4567"
        result = PhoneMatcher.extract(text)
        assert result is not None
    
    def test_international_format(self):
        text = "+1 555 123 4567"
        result = PhoneMatcher.extract(text)
        assert result is not None
    
    def test_no_phone(self):
        text = "No phone number here"
        assert PhoneMatcher.extract(text) is None


class TestURLMatcher:
    def test_linkedin_full_url(self):
        text = "LinkedIn: https://www.linkedin.com/in/johndoe"
        assert URLMatcher.extract_linkedin(text) == "linkedin.com/in/johndoe"
    
    def test_linkedin_short(self):
        text = "linkedin.com/in/janedoe"
        assert URLMatcher.extract_linkedin(text) == "linkedin.com/in/janedoe"
    
    def test_github(self):
        text = "GitHub: github.com/developer123"
        assert URLMatcher.extract_github(text) == "github.com/developer123"
    
    def test_no_linkedin(self):
        text = "No social media here"
        assert URLMatcher.extract_linkedin(text) is None


class TestDateRangeMatcher:
    def test_month_year_to_present(self):
        text = "Jan 2020 - Present"
        start, end = DateRangeMatcher.extract(text)
        assert start == "2020-01"
        assert end == "Present"
    
    def test_month_year_range(self):
        text = "Jan 2020 - Dec 2022"
        start, end = DateRangeMatcher.extract(text)
        assert start == "2020-01"
        assert end == "2022-12"
    
    def test_year_range(self):
        text = "2020 - 2022"
        start, end = DateRangeMatcher.extract(text)
        assert start == "2020"
        assert end == "2022"
    
    def test_year_to_present(self):
        text = "2020 - Present"
        start, end = DateRangeMatcher.extract(text)
        assert start == "2020"
        assert end == "Present"
    
    def test_single_date(self):
        text = "Jan 2020"
        result = DateRangeMatcher.extract(text)
        assert result is not None
        start, end = result
        assert start == "2020-01"
        assert end is None
    
    def test_current_synonym(self):
        text = "2020 - Current"
        start, end = DateRangeMatcher.extract(text)
        assert start == "2020"
        assert end == "Present"


class TestNameMatcher:
    def test_simple_name(self):
        text = "John Doe\nEmail: john@example.com"
        name = NameMatcher.extract_from_top(text)
        assert name == "John Doe"
    
    def test_name_with_middle(self):
        text = "John Michael Doe\n555-1234"
        name = NameMatcher.extract_from_top(text)
        assert name == "John Michael Doe"
    
    def test_name_with_title(self):
        text = "Dr. Jane Smith\nSenior Engineer"
        name = NameMatcher.extract_from_top(text)
        assert name == "Jane Smith"
    
    def test_skip_contact_line(self):
        text = "john.doe@email.com\nJohn Doe\nEngineer"
        name = NameMatcher.extract_from_top(text)
        assert name == "John Doe"
    
    def test_looks_like_name(self):
        assert NameMatcher.looks_like_name("John Doe") == True
        assert NameMatcher.looks_like_name("John Michael Doe") == True
        assert NameMatcher.looks_like_name("john doe") == False  # lowercase
        assert NameMatcher.looks_like_name("This Is A Very Long Name Here") == False  # too many words


class TestLocationMatcher:
    def test_city_state_abbreviation(self):
        text = "San Francisco, CA"
        assert LocationMatcher.extract(text) == "San Francisco, CA"
    
    def test_city_state_full(self):
        text = "New York, New York"
        result = LocationMatcher.extract(text)
        assert "New York" in result
    
    def test_remote(self):
        text = "Location: Remote"
        assert LocationMatcher.extract(text) == "Remote"
    
    def test_no_location(self):
        text = "No location information"
        assert LocationMatcher.extract(text) is None


def test_all_matchers_integration():
    """Test multiple matchers on realistic text."""
    resume_text = """
    JOHN DOE
    Email: john.doe@example.com | Phone: 555-123-4567
    LinkedIn: linkedin.com/in/johndoe | GitHub: github.com/johndoe
    San Francisco, CA
    
    EXPERIENCE
    Senior Engineer | Tech Corp
    Jan 2020 - Present | Remote
    """
    
    # Extract all information
    name = NameMatcher.extract_from_top(resume_text)
    email = EmailMatcher.extract(resume_text)
    phone = PhoneMatcher.extract(resume_text)
    linkedin = URLMatcher.extract_linkedin(resume_text)
    github = URLMatcher.extract_github(resume_text)
    location = LocationMatcher.extract(resume_text)
    
    # Verify extractions
    assert name == "JOHN DOE"
    assert email == "john.doe@example.com"
    assert phone is not None
    assert linkedin == "linkedin.com/in/johndoe"
    assert github == "github.com/johndoe"
    assert location == "San Francisco, CA"
