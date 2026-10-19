"""Atomic local document persistence scoped to a signed workspace."""
from collections.abc import MutableMapping
import json
import os
from pathlib import Path
import tempfile

from app.core.workspaces import document_path, workspace_path, enforce_storage_limit
from app.models.cover_letter_models import CoverLetter


class CoverLetterStore(MutableMapping):
    def _directory(self):
        directory = workspace_path() / "cover_letters"
        directory.mkdir(parents=True, exist_ok=True)
        return directory

    def __getitem__(self, key):
        try:
            path = document_path(self._directory(), key)
            return CoverLetter.model_validate_json(path.read_text(encoding="utf-8"))
        except (FileNotFoundError, ValueError):
            raise KeyError(key)

    def __setitem__(self, key, value):
        directory = self._directory()
        destination = document_path(directory, key)
        value = CoverLetter.model_validate(value)
        serialized = value.model_dump_json(indent=2)
        enforce_storage_limit(directory, destination, len(serialized.encode("utf-8")))
        temporary = None
        try:
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=directory,
                                             suffix=".tmp", delete=False) as handle:
                temporary = Path(handle.name)
                handle.write(serialized)
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temporary, destination)
        finally:
            if temporary:
                temporary.unlink(missing_ok=True)

    def __delitem__(self, key):
        try:
            document_path(self._directory(), key).unlink()
        except (FileNotFoundError, ValueError):
            raise KeyError(key)

    def __iter__(self):
        for path in self._directory().glob("*.json"):
            try:
                self[path.stem]
            except KeyError:
                continue
            yield path.stem

    def __len__(self):
        return sum(1 for _ in self)
