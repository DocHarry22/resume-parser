"""Text cleaning utilities."""

import re


def normalize_whitespace(text: str) -> str:
    """
    Normalize whitespace in text.
    
    - Replace multiple spaces with single space
    - Normalize line endings to \n
    - Remove leading/trailing whitespace
    
    Args:
        text: Input text
        
    Returns:
        Normalized text
    """
    # Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # Replace multiple spaces with single space (but preserve newlines)
    text = re.sub(r'[ \t]+', ' ', text)
    
    # Remove spaces at start/end of lines
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(lines)
    
    # Replace multiple consecutive newlines with max 2
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()


def remove_special_characters(text: str, keep_chars: str = '') -> str:
    """
    Remove special characters from text, keeping alphanumeric and spaces.
    
    Args:
        text: Input text
        keep_chars: Additional characters to keep (e.g., '.-@')
        
    Returns:
        Cleaned text
    """
    pattern = f'[^a-zA-Z0-9\\s{re.escape(keep_chars)}]'
    return re.sub(pattern, '', text)


def clean_text_block(text: str) -> str:
    """
    Clean a text block for processing.
    
    Args:
        text: Input text block
        
    Returns:
        Cleaned text
    """
    # Normalize whitespace
    text = normalize_whitespace(text)
    
    # Remove excessive punctuation (e.g., "......" -> "...")
    text = re.sub(r'\.{4,}', '...', text)
    text = re.sub(r'-{4,}', '---', text)
    
    # Remove bullet point artifacts
    text = re.sub(r'^\s*[•·∙◦▪▫‣⁃]\s*', '• ', text, flags=re.MULTILINE)
    
    return text


def extract_bullet_points(text: str) -> list[str]:
    """
    Extract bullet points from text.
    
    Args:
        text: Text containing bullet points
        
    Returns:
        List of bullet point texts
    """
    bullets = []
    
    # Split by lines
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Check if line starts with bullet marker
        bullet_pattern = r'^[•·∙◦▪▫‣⁃\-\*]\s+'
        if re.match(bullet_pattern, line):
            # Remove bullet marker
            bullet_text = re.sub(bullet_pattern, '', line).strip()
            if bullet_text:
                bullets.append(bullet_text)
    
    return bullets


def normalize_line_breaks(text: str, blocks: list[str]) -> list[str]:
    """
    Normalize line breaks within blocks.
    
    Sometimes text extraction creates artificial line breaks in the middle
    of sentences. This function attempts to rejoin them.
    
    Args:
        text: Full text
        blocks: List of text blocks
        
    Returns:
        Normalized blocks
    """
    normalized = []
    
    for block in blocks:
        # Split into lines
        lines = block.split('\n')
        
        joined_lines = []
        current_sentence = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # If line doesn't end with sentence-ending punctuation,
            # it might be a continuation
            if current_sentence and not current_sentence[-1].endswith(('.', '!', '?', ':')):
                # Check if this line looks like a continuation
                # (starts with lowercase or is very short)
                if line[0].islower() or len(line) < 50:
                    current_sentence.append(line)
                else:
                    # Start new sentence
                    joined_lines.append(' '.join(current_sentence))
                    current_sentence = [line]
            else:
                if current_sentence:
                    joined_lines.append(' '.join(current_sentence))
                current_sentence = [line]
        
        if current_sentence:
            joined_lines.append(' '.join(current_sentence))
        
        normalized_block = '\n'.join(joined_lines)
        normalized.append(normalized_block)
    
    return normalized
