"""NLP service using spaCy for text analysis.

spaCy is a production-grade open-source NLP library designed for
industrial-strength text processing. It provides:
- Fast tokenization and sentence segmentation
- Part-of-speech (POS) tagging
- Named Entity Recognition (NER) for PERSON, ORG, DATE, GPE, etc.
- Dependency parsing
- Pre-trained statistical models

Reference: https://spacy.io
"""

import spacy
from spacy.language import Language
from typing import Optional, List, Dict, Tuple
import re
from pathlib import Path
from app.core.config import settings


class NLPService:
    """Singleton NLP service for spaCy model management."""
    
    _instance: Optional['NLPService'] = None
    _nlp: Optional[Language] = None
    
    def __new__(cls):
        """Ensure only one instance exists (singleton pattern)."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize NLP service."""
        if self._nlp is None:
            self._load_model()
    
    def _load_model(self):
        """Load spaCy model."""
        try:
            self._nlp = spacy.load(settings.spacy_model)
            print(f"✓ Loaded spaCy model: {settings.spacy_model}")
        except OSError:
            print(f"✗ Model '{settings.spacy_model}' not found. Downloading...")
            # Try to download the model
            import subprocess
            subprocess.run(
                ["python", "-m", "spacy", "download", settings.spacy_model],
                check=True
            )
            self._nlp = spacy.load(settings.spacy_model)
            print(f"✓ Downloaded and loaded: {settings.spacy_model}")
    
    @property
    def nlp(self) -> Language:
        """Get the spaCy language model."""
        if self._nlp is None:
            self._load_model()
        return self._nlp
    
    def extract_entities(self, text: str, entity_types: Optional[List[str]] = None) -> List[Dict]:
        """
        Extract named entities from text.
        
        Args:
            text: Input text
            entity_types: Filter by entity types (e.g., ['PERSON', 'ORG'])
                         If None, return all entities
        
        Returns:
            List of entities with text, label, start, and end positions
        """
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            if entity_types is None or ent.label_ in entity_types:
                entities.append({
                    'text': ent.text,
                    'label': ent.label_,
                    'start': ent.start_char,
                    'end': ent.end_char
                })
        
        return entities
    
    def extract_persons(self, text: str, limit: int = 5) -> List[str]:
        """
        Extract person names from text.
        
        Args:
            text: Input text
            limit: Maximum number of names to return
        
        Returns:
            List of person names
        """
        entities = self.extract_entities(text, entity_types=['PERSON'])
        persons = [ent['text'] for ent in entities[:limit]]
        return persons
    
    def extract_organizations(self, text: str, limit: int = 10) -> List[str]:
        """
        Extract organization names from text.
        
        Args:
            text: Input text
            limit: Maximum number of organizations to return
        
        Returns:
            List of organization names
        """
        entities = self.extract_entities(text, entity_types=['ORG'])
        orgs = [ent['text'] for ent in entities[:limit]]
        return orgs
    
    def extract_dates(self, text: str) -> List[str]:
        """
        Extract date expressions from text.
        
        Args:
            text: Input text
        
        Returns:
            List of date strings
        """
        entities = self.extract_entities(text, entity_types=['DATE'])
        dates = [ent['text'] for ent in entities]
        return dates
    
    def tokenize_sentences(self, text: str) -> List[str]:
        """
        Split text into sentences.
        
        Args:
            text: Input text
        
        Returns:
            List of sentences
        """
        doc = self.nlp(text)
        sentences = [sent.text.strip() for sent in doc.sents]
        return sentences
    
    def tokenize_words(self, text: str) -> List[str]:
        """
        Split text into words (tokens).
        
        Args:
            text: Input text
        
        Returns:
            List of words
        """
        doc = self.nlp(text)
        words = [token.text for token in doc if not token.is_space]
        return words
    
    def count_syllables(self, word: str) -> int:
        """
        Estimate syllable count in a word.
        
        Simple heuristic based on vowel groups.
        Used for Flesch-Kincaid readability calculations.
        
        Args:
            word: Input word
        
        Returns:
            Estimated syllable count
        """
        word = word.lower()
        
        # Remove non-alphabetic characters
        word = re.sub(r'[^a-z]', '', word)
        
        if len(word) == 0:
            return 0
        
        # Count vowel groups
        vowels = "aeiouy"
        syllable_count = 0
        previous_was_vowel = False
        
        for i, char in enumerate(word):
            is_vowel = char in vowels
            
            if is_vowel and not previous_was_vowel:
                syllable_count += 1
            
            previous_was_vowel = is_vowel
        
        # Adjust for silent 'e' at the end
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        # Ensure at least 1 syllable
        return max(1, syllable_count)
    
    def calculate_flesch_reading_ease(self, text: str) -> Tuple[float, Dict]:
        """
        Calculate Flesch Reading Ease score.
        
        Formula: 206.835 - 1.015 * (total_words / total_sentences) 
                          - 84.6 * (total_syllables / total_words)
        
        Score interpretation:
        - 90-100: Very easy (5th grade)
        - 80-89: Easy (6th grade)
        - 70-79: Fairly easy (7th grade)
        - 60-69: Standard (8th-9th grade)
        - 50-59: Fairly difficult (10th-12th grade)
        - 30-49: Difficult (college)
        - 0-29: Very difficult (college graduate)
        
        Reference: https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests
        
        Args:
            text: Input text
        
        Returns:
            Tuple of (score, metrics_dict)
        """
        sentences = self.tokenize_sentences(text)
        doc = self.nlp(text)
        
        # Get words (excluding punctuation)
        words = [token.text for token in doc if token.is_alpha]
        
        if len(sentences) == 0 or len(words) == 0:
            return 0.0, {
                'total_sentences': 0,
                'total_words': 0,
                'total_syllables': 0,
                'avg_words_per_sentence': 0,
                'avg_syllables_per_word': 0
            }
        
        # Count syllables
        total_syllables = sum(self.count_syllables(word) for word in words)
        
        # Calculate metrics
        total_sentences = len(sentences)
        total_words = len(words)
        avg_words_per_sentence = total_words / total_sentences
        avg_syllables_per_word = total_syllables / total_words
        
        # Flesch Reading Ease formula
        score = 206.835 - 1.015 * avg_words_per_sentence - 84.6 * avg_syllables_per_word
        
        # Clamp score between 0 and 100
        score = max(0.0, min(100.0, score))
        
        metrics = {
            'total_sentences': total_sentences,
            'total_words': total_words,
            'total_syllables': total_syllables,
            'avg_words_per_sentence': round(avg_words_per_sentence, 2),
            'avg_syllables_per_word': round(avg_syllables_per_word, 2)
        }
        
        return round(score, 2), metrics
    
    def calculate_flesch_kincaid_grade(self, text: str) -> float:
        """
        Calculate Flesch-Kincaid Grade Level.
        
        Formula: 0.39 * (total_words / total_sentences) 
                 + 11.8 * (total_syllables / total_words) 
                 - 15.59
        
        Result represents U.S. school grade level needed to understand the text.
        
        Reference: https://en.wikipedia.org/wiki/Flesch–Kincaid_readability_tests
        
        Args:
            text: Input text
        
        Returns:
            Grade level (e.g., 10.2 = 10th grade)
        """
        sentences = self.tokenize_sentences(text)
        doc = self.nlp(text)
        
        # Get words (excluding punctuation)
        words = [token.text for token in doc if token.is_alpha]
        
        if len(sentences) == 0 or len(words) == 0:
            return 0.0
        
        # Count syllables
        total_syllables = sum(self.count_syllables(word) for word in words)
        
        # Calculate metrics
        total_sentences = len(sentences)
        total_words = len(words)
        avg_words_per_sentence = total_words / total_sentences
        avg_syllables_per_word = total_syllables / total_words
        
        # Flesch-Kincaid Grade Level formula
        grade = 0.39 * avg_words_per_sentence + 11.8 * avg_syllables_per_word - 15.59
        
        return round(max(0.0, grade), 2)


# Global singleton instance
def get_nlp_service() -> NLPService:
    """Get the singleton NLP service instance."""
    return NLPService()
