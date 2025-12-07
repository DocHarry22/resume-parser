"""
Enhanced pattern matching utilities for resume parsing.
Provides robust patterns for common resume elements.
"""

import re
from typing import Optional, List, Tuple
from datetime import datetime


class EmailMatcher:
    """Enhanced email extraction with validation."""
    
    # Multiple email patterns for robustness
    PATTERNS = [
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        r'\b[A-Za-z0-9._%+-]+\s*@\s*[A-Za-z0-9.-]+\s*\.\s*[A-Z|a-z]{2,}\b',
        r'email\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
        r'e-mail\s*:?\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})',
    ]
    
    @classmethod
    def extract(cls, text: str) -> Optional[str]:
        """Extract first valid email from text."""
        for pattern in cls.PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                email = matches[0] if isinstance(matches[0], str) else matches[0][0]
                email = email.strip()
                # Basic validation
                if cls.is_valid(email):
                    return email.lower()
        return None
    
    @staticmethod
    def is_valid(email: str) -> bool:
        """Validate email format."""
        if not email or len(email) > 254:
            return False
        # Must have exactly one @
        if email.count('@') != 1:
            return False
        # No spaces
        if ' ' in email:
            return False
        # Domain must have at least one dot
        domain = email.split('@')[1]
        if '.' not in domain:
            return False
        return True


class PhoneMatcher:
    """Enhanced phone number extraction."""
    
    PATTERNS = [
        # US formats
        r'\+?1?\s*\(?([0-9]{3})\)?[\s.-]?([0-9]{3})[\s.-]?([0-9]{4})',
        r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',
        r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',
        # International
        r'\+\d{1,3}\s?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}',
        # With labels
        r'(?:phone|tel|mobile|cell)\s*:?\s*([\d\s\(\)\-\+\.]{10,})',
    ]
    
    @classmethod
    def extract(cls, text: str) -> Optional[str]:
        """Extract first valid phone number."""
        for pattern in cls.PATTERNS:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                phone = matches[0] if isinstance(matches[0], str) else ''.join(matches[0])
                phone = cls.normalize(phone)
                if cls.is_valid(phone):
                    return phone
        return None
    
    @staticmethod
    def normalize(phone: str) -> str:
        """Normalize phone number format."""
        # Keep only digits, +, and spaces
        phone = re.sub(r'[^\d\+\s]', '', phone)
        # Collapse multiple spaces
        phone = re.sub(r'\s+', ' ', phone).strip()
        return phone
    
    @staticmethod
    def is_valid(phone: str) -> bool:
        """Validate phone number."""
        digits = re.sub(r'\D', '', phone)
        # Must have 10-15 digits
        return 10 <= len(digits) <= 15


class URLMatcher:
    """Extract URLs and social media profiles."""
    
    PATTERNS = {
        'linkedin': [
            r'linkedin\.com/in/([a-zA-Z0-9\-]+)',
            r'(?:https?://)?(?:www\.)?linkedin\.com/in/([a-zA-Z0-9\-]+)',
        ],
        'github': [
            r'github\.com/([a-zA-Z0-9\-]+)',
            r'(?:https?://)?(?:www\.)?github\.com/([a-zA-Z0-9\-]+)',
        ],
        'portfolio': [
            r'(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|io|dev|me|co))',
        ],
    }
    
    @classmethod
    def extract_linkedin(cls, text: str) -> Optional[str]:
        """Extract LinkedIn profile."""
        for pattern in cls.PATTERNS['linkedin']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                username = match.group(1)
                return f"linkedin.com/in/{username}"
        return None
    
    @classmethod
    def extract_github(cls, text: str) -> Optional[str]:
        """Extract GitHub profile."""
        for pattern in cls.PATTERNS['github']:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                username = match.group(1)
                return f"github.com/{username}"
        return None


class DateRangeMatcher:
    """Enhanced date range parsing."""
    
    MONTH_NAMES = {
        'jan': 1, 'january': 1,
        'feb': 2, 'february': 2,
        'mar': 3, 'march': 3,
        'apr': 4, 'april': 4,
        'may': 5,
        'jun': 6, 'june': 6,
        'jul': 7, 'july': 7,
        'aug': 8, 'august': 8,
        'sep': 9, 'sept': 9, 'september': 9,
        'oct': 10, 'october': 10,
        'nov': 11, 'november': 11,
        'dec': 12, 'december': 12,
    }
    
    PATTERNS = [
        # "Jan 2020 - Present"
        r'(\w+)\s+(\d{4})\s*[-–—to]+\s*(present|current)',
        # "Jan 2020 - Dec 2022"
        r'(\w+)\s+(\d{4})\s*[-–—to]+\s*(\w+)\s+(\d{4})',
        # "2020 - 2022"
        r'(\d{4})\s*[-–—to]+\s*(\d{4})',
        # "2020 - Present"
        r'(\d{4})\s*[-–—to]+\s*(present|current)',
        # "Jan 2020"
        r'(\w+)\s+(\d{4})',
        # Just year
        r'(\d{4})',
    ]
    
    @classmethod
    def extract(cls, text: str) -> Optional[Tuple[Optional[str], Optional[str]]]:
        """
        Extract start and end dates from text.
        Returns (start_date, end_date) where end_date may be "Present"
        """
        text = text.strip()
        
        for pattern in cls.PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                groups = match.groups()
                
                if len(groups) == 3 and groups[2].lower() in ('present', 'current'):
                    # Format: Month Year - Present
                    start = cls._format_date(groups[0], groups[1])
                    return (start, "Present")
                
                elif len(groups) == 4:
                    # Format: Month Year - Month Year
                    start = cls._format_date(groups[0], groups[1])
                    end = cls._format_date(groups[2], groups[3])
                    return (start, end)
                
                elif len(groups) == 2:
                    if groups[1].lower() in ('present', 'current'):
                        # Format: Year - Present
                        return (groups[0], "Present")
                    else:
                        # Format: Year - Year
                        return (groups[0], groups[1])
                
                elif len(groups) == 2 and groups[0].isalpha():
                    # Format: Month Year (single date)
                    date = cls._format_date(groups[0], groups[1])
                    return (date, None)
                
                elif len(groups) == 1:
                    # Just a year
                    return (groups[0], None)
        
        return None
    
    @classmethod
    def _format_date(cls, month_str: str, year_str: str) -> str:
        """Format month and year into standard format."""
        month_lower = month_str.lower()
        if month_lower in cls.MONTH_NAMES:
            month_num = cls.MONTH_NAMES[month_lower]
            return f"{year_str}-{month_num:02d}"
        return year_str


class NameMatcher:
    """Enhanced name extraction."""
    
    TITLE_PREFIXES = {
        'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'professor',
    }
    
    SUFFIXES = {
        'jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'esq',
    }
    
    @classmethod
    def extract_from_top(cls, text: str, max_lines: int = 3) -> Optional[str]:
        """
        Extract name from top of resume.
        Assumes name is in first few lines and is prominently placed.
        """
        lines = text.split('\n')[:max_lines]
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines
            if not line:
                continue
            
            # Skip lines that look like contact info
            if any(indicator in line.lower() for indicator in ['email', '@', 'phone', 'linkedin', 'github', 'http']):
                continue
            
            # Skip lines with too many words (likely not a name)
            words = line.split()
            if len(words) > 5:
                continue
            
            # Check if it looks like a name
            if cls.looks_like_name(line):
                return cls.clean_name(line)
        
        return None
    
    @classmethod
    def looks_like_name(cls, text: str) -> bool:
        """Check if text looks like a person's name."""
        # Must have 2-4 words
        words = text.split()
        if not 2 <= len(words) <= 4:
            return False
        
        # All words should start with capital letter
        if not all(w[0].isupper() for w in words if w):
            return False
        
        # Should be mostly alphabetic
        alpha_ratio = sum(c.isalpha() or c.isspace() for c in text) / len(text)
        if alpha_ratio < 0.8:
            return False
        
        return True
    
    @classmethod
    def clean_name(cls, name: str) -> str:
        """Clean and normalize name."""
        # Remove title prefixes
        words = name.split()
        if words[0].lower().rstrip('.') in cls.TITLE_PREFIXES:
            words = words[1:]
        
        # Remove suffixes
        if words and words[-1].lower().rstrip('.') in cls.SUFFIXES:
            words = words[:-1]
        
        return ' '.join(words).strip()


class LocationMatcher:
    """Extract location information."""
    
    # US state patterns
    STATES = {
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    }
    
    PATTERNS = [
        # City, ST
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z]{2})',
        # City, State
        r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),\s*([A-Z][a-z]+)',
        # Remote
        r'(Remote)',
    ]
    
    @classmethod
    def extract(cls, text: str) -> Optional[str]:
        """Extract location from text."""
        for pattern in cls.PATTERNS:
            match = re.search(pattern, text)
            if match:
                if len(match.groups()) == 1:
                    return match.group(1)
                else:
                    city, state = match.groups()
                    # Validate state if it's 2 letters
                    if len(state) == 2 and state.upper() in cls.STATES:
                        return f"{city}, {state.upper()}"
                    return f"{city}, {state}"
        return None
