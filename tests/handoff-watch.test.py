import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('watch', Path(__file__).resolve().parents[1] / 'tools/codex-handoff-watch.py')
watch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(watch)

class WatchTests(unittest.TestCase):
    def test_only_claude_messages(self):
        text = '### Codex → Claude — reply\nDone\n### Claude → Codex — task A\nDo A\n### Claude → Codex — task B\nDo B'
        self.assertEqual(len(watch.entries(text)), 2)

    def test_no_replay_for_body_edits_or_codex_replies(self):
        text = '### Claude → Codex — task A\nDo A'
        state = {'seen': [], 'queue': []}
        watch.collect(state, text)
        watch.collect(state, text + '\nextra details\n### Codex → Claude — done\nDone')
        self.assertEqual(len(state['queue']), 1)

    def test_preserves_two_new_tasks(self):
        state = {'seen': [], 'queue': []}
        watch.collect(state, '### Claude → Codex — first\nOne\n### Claude → Codex — second\nTwo')
        self.assertEqual(len(state['queue']), 2)

if __name__ == '__main__': unittest.main()
